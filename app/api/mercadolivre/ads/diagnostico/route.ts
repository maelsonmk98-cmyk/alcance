import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
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
              // Ignora contexto sem escrita de cookies.
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
     * 3. BUSCAR ADVERTISER DO PRODUCT ADS
     * ============================================================
     */

    const response = await fetch(
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

    const data = await response.json();

    /*
     * ============================================================
     * 4. ERRO DA API
     * ============================================================
     */

    if (!response.ok) {
      console.error(
        "Erro Mercado Ads:",
        data
      );

      return NextResponse.json(
        {
          conectado: true,

          mercado_ads:
            false,

          status:
            response.status,

          error:
            "Não foi possível acessar o Mercado Ads.",

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
     * 5. ADVERTISERS
     * ============================================================
     */

    const advertisers =
      Array.isArray(
        data.advertisers
      )
        ? data.advertisers
        : [];

    return NextResponse.json({
      conectado: true,

      mercado_ads:
        advertisers.length > 0,

      ml_user_id:
        conta.ml_user_id,

      total_advertisers:
        advertisers.length,

      advertisers:
        advertisers.map(
          (advertiser: {
            advertiser_id?:
              number;

            site_id?:
              string;

            advertiser_name?:
              string;

            account_name?:
              string;

            status?:
              string;
          }) => ({
            advertiser_id:
              advertiser.advertiser_id ??
              null,

            site_id:
              advertiser.site_id ??
              null,

            advertiser_name:
              advertiser.advertiser_name ??
              advertiser.account_name ??
              null,

            status:
              advertiser.status ??
              null,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Erro diagnóstico Mercado Ads:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao consultar Mercado Ads.",
      },
      {
        status: 500,
      }
    );
  }
}