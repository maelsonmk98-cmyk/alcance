import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
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
    const cookieStore = await cookies();

    const supabase = createServerClient(
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
              // Contexto sem escrita de cookies.
            }
          },
        },
      }
    );

    /*
     * ============================================================
     * 1. USUÁRIO LOGADO
     * ============================================================
     */

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

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
     * 2. CONTA MERCADO LIVRE
     * ============================================================
     */

    const {
      data: conta,
      error: contaError,
    } = await supabase
      .from("mercadolivre_contas")
      .select(
        `
        ml_user_id,
        access_token
        `
      )
      .eq("user_id", user.id)
      .single();

    if (contaError || !conta) {
      return NextResponse.json(
        {
          error:
            "Nenhuma conta do Mercado Livre conectada.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ============================================================
     * 3. PERÍODO
     * ============================================================
     */

    const diasParam = Number(
      request.nextUrl.searchParams.get(
        "dias"
      ) ?? 30
    );

    const dias =
      Number.isFinite(diasParam) &&
      diasParam > 0
        ? Math.min(diasParam, 90)
        : 30;

    const fim = new Date();

    const inicio = new Date();

    inicio.setDate(
      inicio.getDate() - dias
    );

    const dateFrom =
      inicio
        .toISOString()
        .slice(0, 10);

    const dateTo =
      fim
        .toISOString()
        .slice(0, 10);

    /*
     * ============================================================
     * 4. DESCOBRIR ADVERTISER
     * ============================================================
     */

    const advertiserResponse =
      await fetch(
        "https://api.mercadolibre.com/advertising/advertisers?product_id=PADS",
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${conta.access_token}`,

            "Api-Version": "1",
          },

          cache: "no-store",
        }
      );

    const advertiserData =
      await advertiserResponse.json();

    if (!advertiserResponse.ok) {
      return NextResponse.json(
        {
          error:
            "Não foi possível consultar o advertiser.",

          details:
            advertiserData,
        },
        {
          status:
            advertiserResponse.status,
        }
      );
    }

    const advertisers =
      Array.isArray(
        advertiserData.advertisers
      )
        ? advertiserData.advertisers
        : [];

    if (advertisers.length === 0) {
      return NextResponse.json(
        {
          mercado_ads: false,

          error:
            "Nenhum advertiser Product Ads encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const advertiser =
      advertisers.find(
        (item: {
          site_id?: string;
        }) =>
          item.site_id === "MLB"
      ) ?? advertisers[0];

    const advertiserId =
      advertiser.advertiser_id;

    const siteId =
      advertiser.site_id ??
      "MLB";

    if (!advertiserId) {
      return NextResponse.json(
        {
          error:
            "Advertiser ID não encontrado.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ============================================================
     * 5. MÉTRICAS DAS CAMPANHAS
     * ============================================================
     *
     * Usamos o mesmo endpoint de campanhas
     * que já funcionou no seu projeto.
     *
     * Agora solicitamos métricas no período.
     */

    const params =
      new URLSearchParams({
        limit: "50",
        offset: "0",

        date_from:
          dateFrom,

        date_to:
          dateTo,

        metrics:
          [
            "clicks",
            "prints",
            "cost",
            "cpc",
            "acos",
            "roas",
            "direct_amount",
            "indirect_amount",
            "direct_items_quantity",
            "indirect_items_quantity",
          ].join(","),
      });

    const url =
      `https://api.mercadolibre.com/marketplace/advertising/${siteId}` +
      `/advertisers/${advertiserId}` +
      `/product_ads/campaigns/search?${params.toString()}`;

    const response =
      await fetch(
        url,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${conta.access_token}`,

            "Api-Version": "1",
          },

          cache: "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "Erro métricas Mercado Ads:",
        data
      );

      return NextResponse.json(
        {
          mercado_ads: true,

          advertiser_id:
            advertiserId,

          site_id:
            siteId,

          periodo: {
            dias,
            date_from:
              dateFrom,
            date_to:
              dateTo,
          },

          status:
            response.status,

          error:
            "Não foi possível consultar as métricas do Mercado Ads.",

          details:
            data,
        },
        {
          status:
            response.status,
        }
      );
    }

    /*
     * ============================================================
     * 6. EXTRAIR CAMPANHAS
     * ============================================================
     */

    const resultados =
      Array.isArray(data.results)
        ? data.results
        : [];

    /*
     * ============================================================
     * 7. RESUMO
     * ============================================================
     *
     * Nesta primeira versão calculamos
     * somente campos que realmente vierem
     * da API.
     */

    let investimento = 0;

    let cliques = 0;

    let impressoes = 0;

    let receitaAds = 0;

    let vendasAds = 0;

    const campanhas =
      resultados.map(
        (campanha: any) => {
          const metrics =
            campanha.metrics ??
            campanha;

          const cost =
            Number(
              metrics.cost ?? 0
            );

          const clicks =
            Number(
              metrics.clicks ?? 0
            );

          const prints =
            Number(
              metrics.prints ??
                metrics.impressions ??
                0
            );

          const directAmount =
            Number(
              metrics.direct_amount ??
                0
            );

          const indirectAmount =
            Number(
              metrics.indirect_amount ??
                0
            );

          const directItems =
            Number(
              metrics.direct_items_quantity ??
                0
            );

          const indirectItems =
            Number(
              metrics.indirect_items_quantity ??
                0
            );

          const receita =
            directAmount +
            indirectAmount;

          const vendas =
            directItems +
            indirectItems;

          investimento += cost;

          cliques += clicks;

          impressoes += prints;

          receitaAds += receita;

          vendasAds += vendas;

          return {
            id:
              campanha.id ??
              null,

            nome:
              campanha.name ??
              "",

            status:
              campanha.status ??
              "",

            strategy:
              campanha.strategy ??
              null,

            budget:
              Number(
                campanha.budget ??
                  0
              ),

            acos_target:
              Number(
                campanha.acos_target ??
                  0
              ),

            roas_target:
              Number(
                campanha.roas_target ??
                  0
              ),

            investimento:
              cost,

            cliques:
              clicks,

            impressoes:
              prints,

            receita_ads:
              receita,

            vendas_ads:
              vendas,

            acos:
              Number(
                metrics.acos ??
                  (
                    receita > 0
                      ? (
                          cost /
                          receita
                        ) * 100
                      : 0
                  )
              ),

            roas:
              Number(
                metrics.roas ??
                  (
                    cost > 0
                      ? receita /
                        cost
                      : 0
                  )
              ),

            cpc:
              Number(
                metrics.cpc ??
                  (
                    clicks > 0
                      ? cost /
                        clicks
                      : 0
                  )
              ),

            raw_metrics:
              campanha.metrics ??
              null,
          };
        }
      );

    /*
     * ============================================================
     * 8. MÉTRICAS GERAIS
     * ============================================================
     */

    const acos =
      receitaAds > 0
        ? (
            investimento /
            receitaAds
          ) * 100
        : 0;

    const roas =
      investimento > 0
        ? receitaAds /
          investimento
        : 0;

    const cpc =
      cliques > 0
        ? investimento /
          cliques
        : 0;

    const ctr =
      impressoes > 0
        ? (
            cliques /
            impressoes
          ) * 100
        : 0;

    /*
     * ============================================================
     * 9. RETORNO
     * ============================================================
     */

    return NextResponse.json({
      mercado_ads: true,

      advertiser_id:
        advertiserId,

      site_id:
        siteId,

      periodo: {
        dias,
        date_from:
          dateFrom,
        date_to:
          dateTo,
      },

      resumo: {
        investimento,

        receita_ads:
          receitaAds,

        vendas_ads:
          vendasAds,

        impressoes,

        cliques,

        ctr,

        cpc,

        acos,

        roas,
      },

      total_campanhas:
        campanhas.length,

      campanhas,

      /*
       * Temporariamente mantemos
       * estes dados para diagnóstico.
       */
      diagnostico: {
        paging:
          data.paging ??
          null,
      },
    });
  } catch (error) {
    console.error(
      "Erro métricas Mercado Ads:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao consultar métricas do Mercado Ads.",
      },
      {
        status: 500,
      }
    );
  }
}