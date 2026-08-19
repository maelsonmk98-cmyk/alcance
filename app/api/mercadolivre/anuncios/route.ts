import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getMercadoLivreAccessToken } from "@/lib/mercadolivre/getAccessToken";

type MercadoLivreAttribute = {
  id?: string;
  name?: string;
  value_name?: string | null;
};

type MercadoLivreVariation = {
  id?: number;
  available_quantity?: number;
  seller_custom_field?: string | null;
  attributes?: MercadoLivreAttribute[];
  attribute_combinations?: MercadoLivreAttribute[];
};

type MercadoLivreItemResponse = {
  code?: number;
  body?: {
    id?: string;
    title?: string;
    price?: number;
    available_quantity?: number;
    sold_quantity?: number;
    status?: string;
    permalink?: string;
    thumbnail?: string;
    listing_type_id?: string;
    seller_custom_field?: string | null;
    inventory_id?: string | null;
    attributes?: MercadoLivreAttribute[];
    variations?: MercadoLivreVariation[];
  };
};

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
    /*
     * ============================================================
     * 1. USUÁRIO LOGADO
     * ============================================================
     */

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
              // Ignora caso não seja possível
              // alterar cookies neste contexto.
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

    /*
     * ============================================================
     * 2. OBTER TOKEN VÁLIDO DO MERCADO LIVRE
     * ============================================================
     *
     * Aqui está a principal mudança.
     *
     * A função verifica:
     *
     * - se o access_token ainda é válido
     * - se está próximo de expirar
     * - se precisa usar refresh_token
     *
     * Se necessário, ela renova automaticamente
     * e salva os novos tokens no Supabase.
     */

    let accessToken: string;
    let mlUserId: string | number;

    try {
      const token =
        await getMercadoLivreAccessToken(
          supabase,
          user.id
        );

      accessToken = token.accessToken;
      mlUserId = token.mlUserId;
    } catch (tokenError) {
      console.error(
        "Erro ao obter token Mercado Livre:",
        tokenError
      );

      const mensagem =
        tokenError instanceof Error
          ? tokenError.message
          : "Erro ao acessar conta Mercado Livre.";

      return NextResponse.json(
        {
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
     * 3. BUSCAR IDS DOS ANÚNCIOS
     * ============================================================
     */

    const ids: string[] = [];

    let offset = 0;
    const limit = 50;

    while (true) {
      const searchUrl =
        `https://api.mercadolibre.com/users/${mlUserId}/items/search` +
        `?limit=${limit}&offset=${offset}`;

      const searchResponse = await fetch(
        searchUrl,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const searchData =
        await searchResponse.json();

      if (!searchResponse.ok) {
        console.error(
          "Erro ao buscar anúncios Mercado Livre:",
          searchData
        );

        return NextResponse.json(
          {
            error:
              "Não foi possível buscar os anúncios do Mercado Livre.",
            details: searchData,
          },
          {
            status:
              searchResponse.status,
          }
        );
      }

      const results =
        Array.isArray(searchData.results)
          ? searchData.results
          : [];

      ids.push(...results);

      if (results.length < limit) {
        break;
      }

      offset += limit;

      if (offset >= 1000) {
        break;
      }
    }

    /*
     * ============================================================
     * 4. BUSCAR DETALHES EM LOTES
     * ============================================================
     */

    const tamanhoLote = 20;

    const detalhes: MercadoLivreItemResponse[] =
      [];

    for (
      let i = 0;
      i < ids.length;
      i += tamanhoLote
    ) {
      const lote = ids.slice(
        i,
        i + tamanhoLote
      );

      const detalhesUrl =
        `https://api.mercadolibre.com/items` +
        `?ids=${lote.join(",")}`;

      const detalhesResponse = await fetch(
        detalhesUrl,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const detalhesData =
        await detalhesResponse.json();

      if (!detalhesResponse.ok) {
        console.error(
          "Erro ao buscar detalhes:",
          detalhesData
        );

        continue;
      }

      if (Array.isArray(detalhesData)) {
        detalhes.push(
          ...detalhesData
        );
      }
    }

    /*
     * ============================================================
     * 5. FORMATAR ANÚNCIOS
     * ============================================================
     */

    const anuncios = detalhes
      .filter(
        (item) =>
          item.code === 200 &&
          item.body
      )
      .map((item) => {
        const anuncio = item.body!;

        /*
         * ========================================================
         * SKU
         * ========================================================
         */

        const skuAtributo =
          anuncio.attributes
            ?.find(
              (attribute) =>
                attribute.id ===
                "SELLER_SKU"
            )
            ?.value_name?.trim() ||
          null;

        const skuSellerCustom =
          anuncio.seller_custom_field
            ?.trim() ||
          null;

        let skuVariacao:
          | string
          | null = null;

        if (
          Array.isArray(
            anuncio.variations
          )
        ) {
          for (
            const variation of
              anuncio.variations
          ) {
            const skuAtributoVariacao =
              variation.attributes
                ?.find(
                  (attribute) =>
                    attribute.id ===
                    "SELLER_SKU"
                )
                ?.value_name?.trim();

            if (
              skuAtributoVariacao
            ) {
              skuVariacao =
                skuAtributoVariacao;
              break;
            }

            const skuCombinacao =
              variation.attribute_combinations
                ?.find(
                  (attribute) =>
                    attribute.id ===
                    "SELLER_SKU"
                )
                ?.value_name?.trim();

            if (skuCombinacao) {
              skuVariacao =
                skuCombinacao;
              break;
            }

            const sellerCustom =
              variation.seller_custom_field
                ?.trim();

            if (sellerCustom) {
              skuVariacao =
                sellerCustom;
              break;
            }
          }
        }

        const sku =
          skuAtributo ||
          skuSellerCustom ||
          skuVariacao ||
          null;

        /*
         * ========================================================
         * ESTOQUE
         * ========================================================
         */

        const estoque =
          Number(
            anuncio.available_quantity ??
              0
          );

        return {
          id: anuncio.id ?? "",

          titulo:
            anuncio.title ?? "",

          sku,

          preco:
            Number(
              anuncio.price ?? 0
            ),

          estoque,

          vendidos:
            Number(
              anuncio.sold_quantity ??
                0
            ),

          status:
            anuncio.status ?? "",

          tipo_anuncio:
            anuncio.listing_type_id ??
            "",

          imagem:
            anuncio.thumbnail ?? null,

          permalink:
            anuncio.permalink ?? null,

          inventory_id:
            anuncio.inventory_id ??
            null,
        };
      });

    /*
     * ============================================================
     * 6. INDICADORES
     * ============================================================
     */

    const ativos =
      anuncios.filter(
        (anuncio) =>
          anuncio.status ===
          "active"
      ).length;

    const pausados =
      anuncios.filter(
        (anuncio) =>
          anuncio.status ===
          "paused"
      ).length;

    const fechados =
      anuncios.filter(
        (anuncio) =>
          anuncio.status ===
          "closed"
      ).length;

    const estoqueTotal =
      anuncios.reduce(
        (total, anuncio) =>
          total + anuncio.estoque,
        0
      );

    /*
     * ============================================================
     * 7. RETORNO
     * ============================================================
     */

    return NextResponse.json({
      conectado: true,

      ml_user_id:
        mlUserId,

      resumo: {
        total:
          anuncios.length,

        ativos,

        pausados,

        fechados,

        estoque_total:
          estoqueTotal,
      },

      anuncios,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar anúncios:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao buscar anúncios do Mercado Livre.",
      },
      {
        status: 500,
      }
    );
  }
}