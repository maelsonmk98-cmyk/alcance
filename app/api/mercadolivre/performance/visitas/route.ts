import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getMercadoLivreAccessToken } from "@/lib/mercadolivre/getAccessToken";

type ItemSearchResponse = {
  results?: string[];
  paging?: {
    total?: number;
  };
};

type VisitasHistoricasResponse = Record<
  string,
  number
>;

type VisitaItem = {
  item_id: string;
  total: number;
};

export async function GET(
  request: NextRequest
) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        error:
          "Variáveis do Supabase não configuradas.",
      },
      {
        status: 500,
      }
    );
  }

  try {
    /*
     * ============================================================
     * 1. USUÁRIO LOGADO
     * ============================================================
     */

    const cookieStore =
      await cookies();

    const supabase =
      createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },

            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(
                  ({
                    name,
                    value,
                    options,
                  }) => {
                    cookieStore.set(
                      name,
                      value,
                      options
                    );
                  }
                );
              } catch {
                // Ignora contexto sem escrita de cookies.
              }
            },
          },
        }
      );

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ============================================================
     * 2. TOKEN VÁLIDO DO MERCADO LIVRE
     * ============================================================
     */

    let accessToken: string;
    let mlUserId:
      | string
      | number;

    try {
      const token =
        await getMercadoLivreAccessToken(
          supabase,
          user.id
        );

      accessToken =
        token.accessToken;

      mlUserId =
        token.mlUserId;
    } catch (error) {
      console.error(
        "Erro ao obter token Mercado Livre para visitas:",
        error
      );

      return NextResponse.json(
        {
          conectado: false,

          error:
            error instanceof Error
              ? error.message
              : "Não foi possível acessar o Mercado Livre.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ============================================================
     * 3. PERÍODO SOLICITADO
     * ============================================================
     *
     * Mantemos o parâmetro dias porque ele será útil
     * na interface.
     *
     * Porém a fonte de visitas usada aqui é o
     * histórico retornado pelo endpoint /visits/items.
     */

    const diasParam =
      Number(
        request.nextUrl.searchParams.get(
          "dias"
        ) ?? 30
      );

    const dias =
      Number.isFinite(
        diasParam
      ) &&
      diasParam > 0
        ? Math.min(
            diasParam,
            90
          )
        : 30;

    /*
     * ============================================================
     * 4. LISTAR ANÚNCIOS DO VENDEDOR
     * ============================================================
     */

    const ids: string[] =
      [];

    let offset = 0;
    const limit = 50;

    while (true) {
      const url =
        `https://api.mercadolibre.com/users/${mlUserId}/items/search` +
        `?limit=${limit}` +
        `&offset=${offset}`;

      const response =
        await fetch(
          url,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },

            cache:
              "no-store",
          }
        );

      const data =
        (await response.json()) as ItemSearchResponse;

      if (!response.ok) {
        console.error(
          "Erro ao listar anúncios para visitas:",
          data
        );

        return NextResponse.json(
          {
            error:
              "Não foi possível listar os anúncios para consultar visitas.",

            details:
              data,
          },
          {
            status:
              response.status,
          }
        );
      }

      const results =
        Array.isArray(
          data.results
        )
          ? data.results
          : [];

      ids.push(
        ...results
      );

      if (
        results.length <
        limit
      ) {
        break;
      }

      offset +=
        limit;

      const total =
        Number(
          data.paging
            ?.total ??
            0
        );

      if (
        total > 0 &&
        offset >= total
      ) {
        break;
      }

      if (
        offset >= 1000
      ) {
        break;
      }
    }

    /*
     * ============================================================
     * 5. CONSULTAR VISITAS HISTÓRICAS EM LOTES
     * ============================================================
     *
     * Endpoint que funcionou no diagnóstico:
     *
     * /visits/items?ids=MLB1,MLB2,...
     *
     * Exemplo real retornado:
     *
     * {
     *   "MLB4308749391": 150
     * }
     */

    const mapaVisitas =
      new Map<
        string,
        number
      >();

    const tamanhoLote =
      20;

    for (
      let i = 0;
      i < ids.length;
      i += tamanhoLote
    ) {
      const lote =
        ids.slice(
          i,
          i +
            tamanhoLote
        );

      const url =
        `https://api.mercadolibre.com/visits/items` +
        `?ids=${encodeURIComponent(
          lote.join(",")
        )}`;

      try {
        const response =
          await fetch(
            url,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },

              cache:
                "no-store",
            }
          );

        const data =
          (await response.json()) as
            VisitasHistoricasResponse;

        if (!response.ok) {
          console.error(
            "Erro ao consultar lote de visitas históricas:",
            {
              status:
                response.status,

              lote,

              resposta:
                data,
            }
          );

          continue;
        }

        lote.forEach(
          (itemId) => {
            const total =
              Number(
                data?.[
                  itemId
                ] ??
                  0
              );

            mapaVisitas.set(
              itemId,
              Number.isFinite(
                total
              )
                ? Math.max(
                    0,
                    total
                  )
                : 0
            );
          }
        );
      } catch (error) {
        console.error(
          "Erro ao consultar lote de visitas históricas:",
          {
            lote,
            error,
          }
        );
      }
    }

    /*
     * ============================================================
     * 6. GARANTIR TODOS OS ANÚNCIOS
     * ============================================================
     */

    const visitas:
      VisitaItem[] =
      ids.map(
        (
          itemId
        ) => ({
          item_id:
            itemId,

          total:
            mapaVisitas.get(
              itemId
            ) ??
            0,
        })
      );

    /*
     * ============================================================
     * 7. RESUMO
     * ============================================================
     */

    const totalVisitas =
      visitas.reduce(
        (
          total,
          item
        ) =>
          total +
          item.total,
        0
      );

    const anunciosComVisitas =
      visitas.filter(
        (item) =>
          item.total >
          0
      ).length;

    const anunciosSemVisitas =
      visitas.length -
      anunciosComVisitas;

    const mediaVisitas =
      visitas.length >
      0
        ? totalVisitas /
          visitas.length
        : 0;

    /*
     * ============================================================
     * 8. RANKINGS
     * ============================================================
     */

    const maisVisitados =
      [...visitas]
        .filter(
          (item) =>
            item.total >
            0
        )
        .sort(
          (
            a,
            b
          ) =>
            b.total -
            a.total
        )
        .slice(
          0,
          10
        );

    /*
     * ============================================================
     * 9. RETORNO
     * ============================================================
     */

    return NextResponse.json({
      conectado:
        true,

      /*
       * Importante:
       *
       * O parâmetro dias é mantido para compatibilidade
       * com a interface, mas as visitas abaixo são
       * históricas/acumuladas, pois foi a fonte que
       * retornou dados confiáveis no diagnóstico.
       */

      periodo: {
        dias,

        tipo:
          "historico",
      },

      resumo: {
        total_anuncios:
          ids.length,

        total_visitas:
          totalVisitas,

        media_visitas_anuncio:
          mediaVisitas,

        anuncios_com_visitas:
          anunciosComVisitas,

        anuncios_sem_visitas:
          anunciosSemVisitas,
      },

      visitas,

      rankings: {
        mais_visitados:
          maisVisitados,
      },
    });
  } catch (error) {
    console.error(
      "Erro Performance visitas:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao consultar visitas dos anúncios.",

        details:
          error instanceof Error
            ? error.message
            : String(
                error
              ),
      },
      {
        status: 500,
      }
    );
  }
}