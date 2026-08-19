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
                // Ignora contexto sem escrita de cookies.
              }
            },
          },
        }
      );

    /*
     * ============================================================
     * 1. USUÁRIO
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
        "Erro ao obter token Mercado Livre para campanhas Ads:",
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

    const hoje =
      new Date();

    const inicio =
      new Date();

    inicio.setDate(
      hoje.getDate() -
        dias
    );

    const dateFrom =
      inicio
        .toISOString()
        .slice(0, 10);

    const dateTo =
      hoje
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

    const advertiserData =
      await advertiserResponse.json();

    if (
      !advertiserResponse.ok
    ) {
      console.error(
        "Erro ao consultar advertiser Mercado Ads:",
        advertiserData
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível consultar o advertiser do Mercado Ads.",

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
            "Nenhum advertiser de Product Ads encontrado.",
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
     * 5. CONSULTAR CAMPANHAS
     * ============================================================
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
      });

    const campanhasUrl =
      `https://api.mercadolibre.com/marketplace/advertising/${siteId}` +
      `/advertisers/${advertiserId}` +
      `/product_ads/campaigns/search?${params.toString()}`;

    const campanhasResponse =
      await fetch(
        campanhasUrl,
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

    const campanhasData =
      await campanhasResponse.json();

    /*
     * ============================================================
     * 6. RETORNO DE ERRO
     * ============================================================
     */

    if (
      !campanhasResponse.ok
    ) {
      console.error(
        "Erro campanhas Mercado Ads:",
        campanhasData
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
            campanhasResponse.status,

          error:
            "Não foi possível consultar as campanhas do Mercado Ads.",

          details:
            campanhasData,
        },
        {
          status:
            campanhasResponse.status,
        }
      );
    }

    /*
     * ============================================================
     * 7. SUCESSO
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

      campanhas:
        campanhasData,
    });
  } catch (error) {
    console.error(
      "Erro Mercado Ads campanhas:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao consultar campanhas do Mercado Ads.",
      },
      {
        status: 500,
      }
    );
  }
}