import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      {
        error: "Informe o ID do anúncio.",
      },
      {
        status: 400,
      }
    );
  }

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
                ({ name, value, options }) => {
                  cookieStore.set(
                    name,
                    value,
                    options
                  );
                }
              );
            } catch {
              // Ignora caso não seja possível alterar cookies.
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

    const itemResponse = await fetch(
      `https://api.mercadolibre.com/items/${id}`,
      {
        headers: {
          Authorization:
            `Bearer ${conta.access_token}`,
        },
        cache: "no-store",
      }
    );

    const itemData =
      await itemResponse.json();

    if (!itemResponse.ok) {
      return NextResponse.json(
        {
          error:
            "Não foi possível consultar o anúncio.",
          details: itemData,
        },
        {
          status:
            itemResponse.status,
        }
      );
    }

    return NextResponse.json({
      id: itemData.id,
      title: itemData.title,

      status: itemData.status,

      price: itemData.price,

      available_quantity:
        itemData.available_quantity,

      sold_quantity:
        itemData.sold_quantity,

      seller_custom_field:
        itemData.seller_custom_field,

      inventory_id:
        itemData.inventory_id,

      listing_type_id:
        itemData.listing_type_id,

      catalog_listing:
        itemData.catalog_listing,

      catalog_product_id:
        itemData.catalog_product_id,

      attributes:
        itemData.attributes,

      variations:
        itemData.variations,

      shipping:
        itemData.shipping,

      seller_address:
        itemData.seller_address,
    });
  } catch (error) {
    console.error(
      "Erro no diagnóstico Mercado Livre:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno no diagnóstico.",
      },
      {
        status: 500,
      }
    );
  }
}