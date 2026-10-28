import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getMercadoLivreAccessToken } from "@/lib/mercadolivre/getAccessToken";

type ItemSearchResponse = {
  results?: string[];
  paging?: { total?: number };
};

type VisitasHistoricasResponse = Record<string, unknown>;
type VisitaItem = { item_id: string; total: number | null };

const LIMITE_PAGINA = 50;
const CONCORRENCIA = 10;
const MAX_PAGINAS = 200; // Proteção contra paginação inesperada (até 10 mil anúncios).

async function lerJson(response: Response): Promise<unknown> {
  const texto = await response.text();
  if (!texto) return {};
  try { return JSON.parse(texto) as unknown; }
  catch { throw new Error(`Resposta inválida do Mercado Livre (HTTP ${response.status}).`); }
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Variáveis do Supabase não configuradas." }, { status: 500 });
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch { /* Contexto sem escrita de cookies. */ }
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    let accessToken: string;
    let mlUserId: string | number;
    try {
      const token = await getMercadoLivreAccessToken(supabase, user.id);
      accessToken = token.accessToken;
      mlUserId = token.mlUserId;
    } catch (error) {
      return NextResponse.json({
        conectado: false,
        error: error instanceof Error ? error.message : "Não foi possível acessar o Mercado Livre.",
      }, { status: 401 });
    }

    const diasParam = Number(request.nextUrl.searchParams.get("dias") ?? 30);
    const dias = Number.isFinite(diasParam) && diasParam > 0 ? Math.min(diasParam, 90) : 30;
    // O parâmetro dias é mantido para compatibilidade; /visits/items retorna histórico.

    const ids: string[] = [];
    let paginasConsultadas = 0;
    let totalAnunciosInformado: number | null = null;
    let terminouPaginacao = false;

    for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
      const offset = pagina * LIMITE_PAGINA;
      const url = new URL(`https://api.mercadolibre.com/users/${mlUserId}/items/search`);
      url.searchParams.set("limit", String(LIMITE_PAGINA));
      url.searchParams.set("offset", String(offset));

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const data = await lerJson(response) as ItemSearchResponse;
      if (!response.ok) {
        console.error("Erro ao listar anúncios para visitas:", response.status, data);
        return NextResponse.json({
          error: "Não foi possível listar todos os anúncios para consultar visitas.",
          status: response.status,
          paginas_consultadas: paginasConsultadas,
        }, { status: response.status });
      }

      paginasConsultadas++;
      const resultados = Array.isArray(data.results) ? data.results : [];
      ids.push(...resultados.filter((id): id is string => typeof id === "string" && id.length > 0));
      const total = Number(data.paging?.total);
      if (Number.isFinite(total) && total >= 0) totalAnunciosInformado = total;
      if (resultados.length < LIMITE_PAGINA || (totalAnunciosInformado !== null && ids.length >= totalAnunciosInformado)) {
        terminouPaginacao = true;
        break;
      }
    }

    if (!terminouPaginacao) {
      return NextResponse.json({
        error: "A listagem atingiu o limite de segurança de páginas. Nenhum resumo parcial foi publicado.",
        paginas_consultadas: paginasConsultadas,
      }, { status: 502 });
    }

    const idsUnicos = [...new Set(ids)];
    const visitas: VisitaItem[] = [];
    let falhasConsulta = 0;

    // Mantém a chamada individual já validada na integração existente.
    for (let i = 0; i < idsUnicos.length; i += CONCORRENCIA) {
      const grupo = idsUnicos.slice(i, i + CONCORRENCIA);
      const resultados = await Promise.all(grupo.map(async (itemId): Promise<VisitaItem> => {
        try {
          const url = new URL("https://api.mercadolibre.com/visits/items");
          url.searchParams.set("ids", itemId);
          const response = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          });
          const data = await lerJson(response) as VisitasHistoricasResponse;
          if (!response.ok) {
            console.error(`Erro ao consultar visitas de ${itemId}: HTTP ${response.status}`);
            return { item_id: itemId, total: null };
          }
          const valor = data[itemId];
          if (valor === undefined || valor === null || valor === "") {
            return { item_id: itemId, total: null };
          }
          const total = Number(valor);
          return {
            item_id: itemId,
            total: Number.isFinite(total) && total >= 0 ? total : null,
          };
        } catch (error) {
          console.error(`Erro ao consultar visitas de ${itemId}:`, error);
          return { item_id: itemId, total: null };
        }
      }));
      falhasConsulta += resultados.filter((item) => item.total === null).length;
      visitas.push(...resultados);
    }

    const visitasValidas = visitas.filter((item): item is { item_id: string; total: number } => item.total !== null);
    const totalVisitas = visitasValidas.reduce((soma, item) => soma + item.total, 0);
    const anunciosComVisitas = visitasValidas.filter((item) => item.total > 0).length;
    const anunciosSemVisitas = visitasValidas.filter((item) => item.total === 0).length;
    const mediaVisitas = visitasValidas.length > 0 ? totalVisitas / visitasValidas.length : 0;
    const maisVisitados = [...visitasValidas].filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total).slice(0, 10);

    return NextResponse.json({
      conectado: true,
      periodo: { dias, tipo: "historico" },
      resumo: {
        total_anuncios: idsUnicos.length,
        total_visitas: totalVisitas,
        media_visitas_anuncio: mediaVisitas,
        anuncios_com_visitas: anunciosComVisitas,
        anuncios_sem_visitas: anunciosSemVisitas,
        anuncios_visitas_indisponiveis: falhasConsulta,
        dados_parciais: falhasConsulta > 0,
      },
      visitas,
      rankings: { mais_visitados: maisVisitados },
      diagnostico: {
        paginas_consultadas: paginasConsultadas,
        total_anuncios_informado: totalAnunciosInformado,
        anuncios_consultados: idsUnicos.length,
        consultas_com_falha: falhasConsulta,
        visitas_sao_historicas: true,
      },
    });
  } catch (error) {
    console.error("Erro Performance visitas:", error);
    return NextResponse.json({
      error: "Erro interno ao consultar visitas dos anúncios.",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
