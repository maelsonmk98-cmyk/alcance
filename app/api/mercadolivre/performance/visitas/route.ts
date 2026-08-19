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

type VisitaSerie = {
  date?: string;
  total?: number;
  visits?: number;
};

type VisitaApiItem = {
  item_id?: string;

  /*
   * Este é o campo que confirmamos
   * na resposta REAL do Mercado Livre.
   */
  total_visits?: number;

  /*
   * Fallback para possíveis formatos antigos.
   */
  total?: number;

  date_from?: string;
  date_to?: string;

  last?: number;
  unit?: string;

  results?: VisitaSerie[];
};

type VisitaItem = {
  item_id: string;
  total: number;
};

export async function GET(
  request: NextRequest
) {
  /*
   * ============================================================
   * 1. VARIÁVEIS SUPABASE
   * ============================================================
   */

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
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
     * 2. USUÁRIO LOGADO
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

            setAll(
              cookiesToSet
            ) {
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

    if (
      userError ||
      !user
    ) {
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
     * 3. TOKEN VÁLIDO DO MERCADO LIVRE
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
        "Erro ao obter token para visitas Mercado Livre:",
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
     * 4. PERÍODO
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
     * 5. LISTAR ANÚNCIOS DO VENDEDOR
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
            method:
              "GET",

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

      if (
        !response.ok
      ) {
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

      /*
       * Última página.
       */

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

      /*
       * Segurança para evitar loop infinito.
       */

      if (
        offset >= 1000
      ) {
        break;
      }
    }

    /*
     * ============================================================
     * 6. CONSULTAR VISITAS
     * ============================================================
     *
     * Consultamos em lotes.
     *
     * Exemplo:
     *
     * /items/visits/time_window
     * ?ids=MLB1,MLB2
     * &last=30
     * &unit=day
     */

    const visitasEncontradas:
      VisitaItem[] =
      [];

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

      const visitasUrl =
        `https://api.mercadolibre.com/items/visits/time_window` +
        `?ids=${encodeURIComponent(
          lote.join(",")
        )}` +
        `&last=${dias}` +
        `&unit=day`;

      try {
        const response =
          await fetch(
            visitasUrl,
            {
              method:
                "GET",

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },

              cache:
                "no-store",
            }
          );

        const raw =
          await response.json();

        if (
          !response.ok
        ) {
          console.error(
            "Erro ao consultar lote de visitas:",
            {
              status:
                response.status,

              lote,

              resposta:
                raw,
            }
          );

          continue;
        }

        /*
         * O endpoint em lote retorna array.
         *
         * Mas mantemos fallback caso algum
         * formato retorne objeto único.
         */

        const itens:
          VisitaApiItem[] =
          Array.isArray(
            raw
          )
            ? raw
            : raw
              ? [raw]
              : [];

        itens.forEach(
          (item) => {
            const itemId =
              String(
                item.item_id ??
                  ""
              );

            if (!itemId) {
              return;
            }

            /*
             * ====================================================
             * CAMPO REAL CONFIRMADO
             * ====================================================
             *
             * O Mercado Livre retornou:
             *
             * {
             *   "item_id": "...",
             *   "total_visits": 123,
             *   "last": 30,
             *   "unit": "day"
             * }
             */

            const totalVisits =
              Number(
                item.total_visits
              );

            /*
             * Fallback antigo.
             */

            const totalAntigo =
              Number(
                item.total
              );

            /*
             * Caso a API retorne somente série temporal.
             */

            const totalSerie =
              Array.isArray(
                item.results
              )
                ? item.results.reduce(
                    (
                      soma,
                      periodo
                    ) =>
                      soma +
                      Number(
                        periodo.total ??
                          periodo.visits ??
                          0
                      ),
                    0
                  )
                : 0;

            let total = 0;

            if (
              Number.isFinite(
                totalVisits
              )
            ) {
              total =
                totalVisits;
            } else if (
              Number.isFinite(
                totalAntigo
              )
            ) {
              total =
                totalAntigo;
            } else {
              total =
                totalSerie;
            }

            visitasEncontradas.push(
              {
                item_id:
                  itemId,

                total:
                  Math.max(
                    0,
                    total
                  ),
              }
            );
          }
        );
      } catch (error) {
        console.error(
          "Erro ao consultar lote de visitas:",
          {
            lote,
            error,
          }
        );
      }
    }

    /*
     * ============================================================
     * 7. GARANTIR QUE TODOS OS ANÚNCIOS APAREÇAM
     * ============================================================
     */

    const mapaVisitas =
      new Map<
        string,
        number
      >();

    visitasEncontradas.forEach(
      (item) => {
        mapaVisitas.set(
          item.item_id,
          item.total
        );
      }
    );

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
     * 8. RESUMO
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
     * 9. RANKING
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
     * 10. RETORNO
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