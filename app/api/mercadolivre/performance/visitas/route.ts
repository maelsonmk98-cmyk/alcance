import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getMercadoLivreAccessToken } from "@/lib/mercadolivre/getAccessToken";

export async function GET() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        error: "Supabase não configurado.",
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
                ({ name, value, options }) => {
                  cookieStore.set(
                    name,
                    value,
                    options
                  );
                }
              );
            } catch {
              // Ignora contexto sem escrita.
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const token =
      await getMercadoLivreAccessToken(
        supabase,
        user.id
      );

    const accessToken =
      token.accessToken;

    /*
     * MLB usado no diagnóstico
     */

    const itemId =
      "MLB4308749391";

    /*
     * ============================================================
     * 1. DADOS DO ANÚNCIO
     * ============================================================
     */

    const itemResponse =
      await fetch(
        `https://api.mercadolibre.com/items/${itemId}`,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

    const itemData =
      await itemResponse.json();

    /*
     * ============================================================
     * 2. VISITAS ÚLTIMOS 30 DIAS
     * ============================================================
     */

    const visitas30Url =
      `https://api.mercadolibre.com/items/${itemId}/visits/time_window` +
      `?last=30&unit=day`;

    const visitas30Response =
      await fetch(
        visitas30Url,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

    const visitas30Data =
      await visitas30Response.json();

    /*
     * ============================================================
     * 3. VISITAS HISTÓRICAS
     * ============================================================
     */

    const historicoUrl =
      `https://api.mercadolibre.com/visits/items?ids=${itemId}`;

    const historicoResponse =
      await fetch(
        historicoUrl,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

    const historicoData =
      await historicoResponse.json();

    /*
     * ============================================================
     * 4. INTERVALO EXPLÍCITO
     * ============================================================
     */

    const fim =
      new Date();

    const inicio =
      new Date();

    inicio.setDate(
      inicio.getDate() - 30
    );

    const dateFrom =
      inicio.toISOString();

    const dateTo =
      fim.toISOString();

    const intervaloUrl =
      `https://api.mercadolibre.com/items/${itemId}/visits/time_window` +
      `?date_from=${encodeURIComponent(dateFrom)}` +
      `&date_to=${encodeURIComponent(dateTo)}` +
      `&unit=day`;

    const intervaloResponse =
      await fetch(
        intervaloUrl,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

    const intervaloData =
      await intervaloResponse.json();

    /*
     * ============================================================
     * 5. RETORNO
     * ============================================================
     */

    return NextResponse.json({
      item_id:
        itemId,

      anuncio: {
        status:
          itemResponse.status,

        id:
          itemData?.id ??
          null,

        title:
          itemData?.title ??
          null,

        status_anuncio:
          itemData?.status ??
          null,

        sold_quantity:
          itemData?.sold_quantity ??
          null,

        available_quantity:
          itemData?.available_quantity ??
          null,

        parent_item:
          itemData?.parent_item_id ??
          itemData?.parent_item ??
          null,

        start_time:
          itemData?.start_time ??
          null,

        stop_time:
          itemData?.stop_time ??
          null,

        end_time:
          itemData?.end_time ??
          null,
      },

      visitas_30_dias: {
        status:
          visitas30Response.status,

        resposta:
          visitas30Data,
      },

      visitas_historicas: {
        status:
          historicoResponse.status,

        resposta:
          historicoData,
      },

      visitas_intervalo: {
        status:
          intervaloResponse.status,

        date_from:
          dateFrom,

        date_to:
          dateTo,

        resposta:
          intervaloData,
      },
    });
  } catch (error) {
    console.error(
      "Diagnóstico avançado de visitas:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro no diagnóstico avançado de visitas.",

        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}