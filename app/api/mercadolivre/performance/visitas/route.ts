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
                // Ignora contexto sem escrita de cookie.
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
     * 2. TOKEN VÁLIDO
     * ============================================================
     */

    let accessToken: string;
    let mlUserId: string | number;

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
     * 3. PERÍODO
     * ============================================================
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

    const ids: string[] = [];

    let offset = 0;
    const limit = 50;

    while (true) {
      const url =
        `https://api.mercadolibre.com/users/${mlUserId}/items/search` +
        `?limit=${limit}&offset=${offset}`;

      const response =
        await fetch(
          url,
          {
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
     * 5. CONSULTAR VISITAS POR ITEM
     * ============================================================
     *
     * Fazemos individualmente para evitar
     * enviar URLs enormes e facilitar
     * diagnóstico caso algum MLB falhe.
     */

    const visitas: VisitaItem[] =
      [];

    for (
      const itemId of ids
    ) {
      try {
        const visitasUrl =
          `https://api.mercadolibre.com/items/${itemId}/visits/time_window` +
          `?last=${dias}&unit=day`;

        const response =
          await fetch(
            visitasUrl,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },

              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          console.error(
            `Erro ao consultar visitas do item ${itemId}:`,
            data
          );

          continue;
        }

        visitas.push({
          item_id:
            itemId,

          total:
            Number(
              data.total ??
                0
            ),
        });
      } catch (error) {
        console.error(
          `Erro ao consultar visitas do item ${itemId}:`,
          error
        );
      }
    }

    /*
     * ============================================================
     * 6. RESUMO
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

    const maisVisitados =
      [...visitas]
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
     * 7. RETORNO
     * ============================================================
     */

    return NextResponse.json({
      conectado:
        true,

      periodo: {
        dias,
      },

      resumo: {
        total_anuncios:
          ids.length,

        total_visitas:
          totalVisitas,

        media_visitas_anuncio:
          ids.length > 0
            ? totalVisitas /
              ids.length
            : 0,
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