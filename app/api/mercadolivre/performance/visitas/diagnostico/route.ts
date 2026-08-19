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

    const itemId =
      "MLB4308749391";

    const urlIndividual =
      `https://api.mercadolibre.com/items/${itemId}/visits/time_window` +
      `?last=30&unit=day`;

    const individualResponse =
      await fetch(
        urlIndividual,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

    const individualText =
      await individualResponse.text();

    const urlLote =
      `https://api.mercadolibre.com/items/visits/time_window` +
      `?ids=${itemId}&last=30&unit=day`;

    const loteResponse =
      await fetch(
        urlLote,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

    const loteText =
      await loteResponse.text();

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

    const itemText =
      await itemResponse.text();

    return NextResponse.json({
      item_id: itemId,

      teste_individual: {
        status:
          individualResponse.status,

        content_type:
          individualResponse.headers.get(
            "content-type"
          ),

        resposta_bruta:
          individualText,
      },

      teste_lote: {
        status:
          loteResponse.status,

        content_type:
          loteResponse.headers.get(
            "content-type"
          ),

        resposta_bruta:
          loteText,
      },

      anuncio: {
        status:
          itemResponse.status,

        resposta_bruta:
          itemText,
      },
    });
  } catch (error) {
    console.error(
      "Diagnóstico visitas Mercado Livre:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro no diagnóstico de visitas.",

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
