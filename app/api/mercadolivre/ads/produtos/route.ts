import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getMercadoLivreAccessToken } from "@/lib/mercadolivre/getAccessToken";

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

    try {
      const token =
        await getMercadoLivreAccessToken(
          supabase,
          user.id
        );

      accessToken =
        token.accessToken;
    } catch (tokenError) {
      console.error(
        "Erro ao obter token Mercado Livre para produtos Ads:",
        tokenError
      );

      const mensagem =
        tokenError instanceof Error
          ? tokenError.message
          : "Erro ao acessar conta Mercado Livre.";

      return NextResponse.json(
        {
          mercado_ads: false,
          conectado: false,
          error: mensagem,
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

    const fim =
      new Date();

    const inicio =
      new Date();

    inicio.setDate(
      inicio.getDate() -
        dias
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
     * 4. BUSCAR ADVERTISER
     * ============================================================
     */

    const advertiserResponse =
      await fetch(
        "https://api.mercadolibre.com/advertising/advertisers?product_id=PADS",
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            "Api-Version":
              "1",
          },

          cache:
            "no-store",
        }
      );

    const advertiserData =
      await advertiserResponse.json();

    if (
      !advertiserResponse.ok
    ) {
      console.error(
        "Erro ao consultar advertiser para produtos Ads:",
        advertiserData
      );

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

    if (
      advertisers.length === 0
    ) {
      return NextResponse.json(
        {
          mercado_ads:
            false,

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
          item.site_id ===
          "MLB"
      ) ??
      advertisers[0];

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
     * 5. BUSCAR PRODUTOS / ADS
     * ============================================================
     *
     * aggregation_type=TOTAL continua removido,
     * pois esse endpoint não aceita esse valor.
     */

    const params =
      new URLSearchParams({
        limit:
          "50",

        offset:
          "0",

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
            "total_amount",
            "direct_items_quantity",
            "indirect_items_quantity",
          ].join(","),
      });

    const url =
      `https://api.mercadolibre.com/marketplace/advertising/${siteId}` +
      `/advertisers/${advertiserId}` +
      `/product_ads/ads/search?${params.toString()}`;

    const response =
      await fetch(
        url,
        {
          method:
            "GET",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            "Api-Version":
              "1",
          },

          cache:
            "no-store",
        }
      );

    const data =
      await response.json();

    /*
     * ============================================================
     * 6. ERRO DA API
     * ============================================================
     */

    if (!response.ok) {
      console.error(
        "Erro Product Ads produtos:",
        data
      );

      return NextResponse.json(
        {
          mercado_ads:
            true,

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

          endpoint:
            url,

          error:
            "Não foi possível consultar os produtos do Mercado Ads.",

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
     * 7. RESULTADOS
     * ============================================================
     */

    const resultados =
      Array.isArray(
        data.results
      )
        ? data.results
        : [];

    let investimentoTotal =
      0;

    let receitaTotal =
      0;

    let cliquesTotal =
      0;

    let impressoesTotal =
      0;

    let vendasTotal =
      0;

    /*
     * ============================================================
     * 8. NORMALIZAR PRODUTOS
     * ============================================================
     */

    const produtos =
      resultados.map(
        (item: any) => {
          const metrics =
            item.metrics ??
            item;

          const investimento =
            Number(
              metrics.cost ??
                0
            );

          const cliques =
            Number(
              metrics.clicks ??
                0
            );

          const impressoes =
            Number(
              metrics.prints ??
                metrics.impressions ??
                0
            );

          const receitaDireta =
            Number(
              metrics.direct_amount ??
                0
            );

          const receitaIndireta =
            Number(
              metrics.indirect_amount ??
                0
            );

          const totalAmount =
            metrics.total_amount;

          const receita =
            totalAmount !==
              undefined &&
            totalAmount !==
              null
              ? Number(
                  totalAmount
                )
              : receitaDireta +
                receitaIndireta;

          const vendasDiretas =
            Number(
              metrics.direct_items_quantity ??
                0
            );

          const vendasIndiretas =
            Number(
              metrics.indirect_items_quantity ??
                0
            );

          const vendas =
            vendasDiretas +
            vendasIndiretas;

          /*
           * Totais
           */

          investimentoTotal +=
            investimento;

          receitaTotal +=
            receita;

          cliquesTotal +=
            cliques;

          impressoesTotal +=
            impressoes;

          vendasTotal +=
            vendas;

          /*
           * Métricas calculadas
           */

          const acos =
            receita > 0
              ? (
                  investimento /
                  receita
                ) * 100
              : Number(
                  metrics.acos ??
                    0
                );

          const roas =
            investimento > 0
              ? receita /
                investimento
              : Number(
                  metrics.roas ??
                    0
                );

          const cpc =
            cliques > 0
              ? investimento /
                cliques
              : Number(
                  metrics.cpc ??
                    0
                );

          const ctr =
            impressoes > 0
              ? (
                  cliques /
                  impressoes
                ) * 100
              : 0;

          /*
           * Fallback para estruturas
           * diferentes retornadas pela API.
           */

          const itemId =
            item.item_id ??
            item.item?.id ??
            item.item
              ?.item_id ??
            item.entity_id ??
            null;

          const titulo =
            item.title ??
            item.item?.title ??
            item.name ??
            null;

          const campaignId =
            item.campaign_id ??
            item.campaign?.id ??
            null;

          const campaignName =
            item.campaign_name ??
            item.campaign?.name ??
            null;

          return {
            id:
              item.id ??
              item.ad_id ??
              null,

            item_id:
              itemId,

            titulo,

            campaign_id:
              campaignId,

            campaign_name:
              campaignName,

            status:
              item.status ??
              null,

            investimento,

            impressoes,

            cliques,

            ctr,

            cpc,

            receita_ads:
              receita,

            vendas_ads:
              vendas,

            vendas_diretas:
              vendasDiretas,

            vendas_indiretas:
              vendasIndiretas,

            receita_direta:
              receitaDireta,

            receita_indireta:
              receitaIndireta,

            acos,

            roas,

            /*
             * Mantido temporariamente
             * para diagnóstico.
             */

            raw:
              item,
          };
        }
      );

    /*
     * ============================================================
     * 9. MÉTRICAS GERAIS
     * ============================================================
     */

    const acosTotal =
      receitaTotal > 0
        ? (
            investimentoTotal /
            receitaTotal
          ) * 100
        : 0;

    const roasTotal =
      investimentoTotal > 0
        ? receitaTotal /
          investimentoTotal
        : 0;

    const cpcTotal =
      cliquesTotal > 0
        ? investimentoTotal /
          cliquesTotal
        : 0;

    const ctrTotal =
      impressoesTotal > 0
        ? (
            cliquesTotal /
            impressoesTotal
          ) * 100
        : 0;

    /*
     * ============================================================
     * 10. RETORNO
     * ============================================================
     */

    return NextResponse.json({
      mercado_ads:
        true,

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
        investimento:
          investimentoTotal,

        receita_ads:
          receitaTotal,

        vendas_ads:
          vendasTotal,

        impressoes:
          impressoesTotal,

        cliques:
          cliquesTotal,

        ctr:
          ctrTotal,

        cpc:
          cpcTotal,

        acos:
          acosTotal,

        roas:
          roasTotal,
      },

      total_produtos:
        produtos.length,

      produtos,

      diagnostico: {
        paging:
          data.paging ??
          null,
      },
    });
  } catch (error) {
    console.error(
      "Erro produtos Mercado Ads:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao consultar produtos do Mercado Ads.",
      },
      {
        status: 500,
      }
    );
  }
}