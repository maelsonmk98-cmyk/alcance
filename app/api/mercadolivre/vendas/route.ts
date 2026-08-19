import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getMercadoLivreAccessToken } from "@/lib/mercadolivre/getAccessToken";

type OrderItem = {
  quantity?: number;
  unit_price?: number;

  item?: {
    id?: string;
    title?: string;
    seller_sku?: string | null;
    variation_id?: number | null;
  };
};

type MercadoLivreOrder = {
  id?: number;
  status?: string;
  date_created?: string;
  date_closed?: string;

  total_amount?: number;
  paid_amount?: number;

  order_items?: OrderItem[];

  buyer?: {
    id?: number;
    nickname?: string;
  };

  payments?: Array<{
    id?: number;
    status?: string;
    transaction_amount?: number;
    total_paid_amount?: number;
    shipping_cost?: number;
    marketplace_fee?: number;
  }>;
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
     * 2. TOKEN VÁLIDO DO MERCADO LIVRE
     * ============================================================
     *
     * A função central:
     *
     * - verifica se o access_token ainda é válido
     * - usa refresh_token se necessário
     * - salva os novos tokens no Supabase
     * - retorna um access_token válido
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
     * 3. PERÍODO
     * ============================================================
     *
     * Exemplo:
     *
     * /api/mercadolivre/vendas?dias=30
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

    const dataFim =
      new Date();

    const dataInicio =
      new Date();

    dataInicio.setDate(
      dataInicio.getDate() -
        dias
    );

    /*
     * ============================================================
     * 4. BUSCAR PEDIDOS
     * ============================================================
     */

    const pedidos:
      MercadoLivreOrder[] =
      [];

    let offset = 0;

    const limit = 50;

    while (true) {
      const params =
        new URLSearchParams({
          seller:
            String(
              mlUserId
            ),

          "order.date_created.from":
            dataInicio.toISOString(),

          "order.date_created.to":
            dataFim.toISOString(),

          sort:
            "date_desc",

          limit:
            String(
              limit
            ),

          offset:
            String(
              offset
            ),
        });

      const url =
        `https://api.mercadolibre.com/orders/search?${params.toString()}`;

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
        await response.json();

      if (!response.ok) {
        console.error(
          "Erro Mercado Livre vendas:",
          data
        );

        return NextResponse.json(
          {
            error:
              "Não foi possível buscar os pedidos do Mercado Livre.",

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

      pedidos.push(
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
     * 5. NORMALIZAR PEDIDOS
     * ============================================================
     */

    const vendas =
      pedidos.map(
        (pedido) => {
          const itens =
            Array.isArray(
              pedido.order_items
            )
              ? pedido.order_items
              : [];

          const quantidade =
            itens.reduce(
              (
                total,
                item
              ) =>
                total +
                Number(
                  item.quantity ??
                    0
                ),
              0
            );

          const produtos =
            itens.map(
              (item) => ({
                mlb:
                  item.item
                    ?.id ??
                  null,

                titulo:
                  item.item
                    ?.title ??
                  "",

                sku:
                  item.item
                    ?.seller_sku ??
                  null,

                variation_id:
                  item.item
                    ?.variation_id ??
                  null,

                quantidade:
                  Number(
                    item.quantity ??
                      0
                  ),

                preco_unitario:
                  Number(
                    item.unit_price ??
                      0
                  ),
              })
            );

          const pagamentoAprovado =
            pedido.payments
              ?.find(
                (
                  pagamento
                ) =>
                  pagamento.status ===
                  "approved"
              );

          return {
            id:
              pedido.id ??
              null,

            data:
              pedido.date_created ??
              null,

            data_fechamento:
              pedido.date_closed ??
              null,

            status:
              pedido.status ??
              "",

            quantidade,

            faturamento:
              Number(
                pedido.total_amount ??
                  0
              ),

            valor_pago:
              Number(
                pedido.paid_amount ??
                  pagamentoAprovado
                    ?.total_paid_amount ??
                  0
              ),

            taxa_marketplace:
              Number(
                pagamentoAprovado
                  ?.marketplace_fee ??
                  0
              ),

            frete:
              Number(
                pagamentoAprovado
                  ?.shipping_cost ??
                  0
              ),

            comprador: {
              id:
                pedido.buyer
                  ?.id ??
                null,

              nickname:
                pedido.buyer
                  ?.nickname ??
                null,
            },

            produtos,
          };
        }
      );

    /*
     * ============================================================
     * 6. RESUMO
     * ============================================================
     */

    const pedidosValidos =
      vendas.filter(
        (venda) =>
          venda.status !==
          "cancelled"
      );

    const faturamento =
      pedidosValidos.reduce(
        (
          total,
          venda
        ) =>
          total +
          venda.faturamento,
        0
      );

    const unidades =
      pedidosValidos.reduce(
        (
          total,
          venda
        ) =>
          total +
          venda.quantidade,
        0
      );

    const totalTaxas =
      pedidosValidos.reduce(
        (
          total,
          venda
        ) =>
          total +
          venda.taxa_marketplace,
        0
      );

    const ticketMedio =
      pedidosValidos.length >
      0
        ? faturamento /
          pedidosValidos.length
        : 0;

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

        inicio:
          dataInicio.toISOString(),

        fim:
          dataFim.toISOString(),
      },

      resumo: {
        pedidos:
          pedidosValidos.length,

        unidades,

        faturamento,

        ticket_medio:
          ticketMedio,

        taxas_marketplace:
          totalTaxas,

        cancelados:
          vendas.filter(
            (venda) =>
              venda.status ===
              "cancelled"
          ).length,
      },

      vendas,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar vendas Mercado Livre:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao buscar vendas do Mercado Livre.",
      },
      {
        status: 500,
      }
    );
  }
}