import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type ProdutoBanco = {
  id: number;
  sku: string | null;
  nome: string | null;
  custo: number | null;
  preco_venda: number | null;
  comissao: number | null;
  impostos: number | null;
  embalagem: number | null;
  frete: number | null;
  outras_despesas: number | null;
  acos: number | null;
  promocao: number | null;
  estoque: number | null;
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
                // Ignora contextos sem escrita de cookies.
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
     * 2. PRODUTOS DO USUÁRIO
     * ============================================================
     */

    const {
      data,
      error: produtosError,
    } = await supabase
      .from("produtos")
      .select(
        `
        id,
        sku,
        nome,
        custo,
        preco_venda,
        comissao,
        impostos,
        embalagem,
        frete,
        outras_despesas,
        acos,
        promocao,
        estoque
        `
      )
      .eq("user_id", user.id);

    if (produtosError) {
      console.error(
        "Erro ao buscar produtos para Performance:",
        produtosError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível carregar os custos dos produtos.",
          details:
            produtosError,
        },
        {
          status: 500,
        }
      );
    }

    const produtosBanco =
      (data ?? []) as ProdutoBanco[];

    /*
     * ============================================================
     * 3. NORMALIZAR DADOS
     * ============================================================
     */

    const produtos =
      produtosBanco.map(
        (produto) => {
          const custo =
            Number(
              produto.custo ?? 0
            );

          const precoVenda =
            Number(
              produto.preco_venda ?? 0
            );

          const comissao =
            Number(
              produto.comissao ?? 0
            );

          const impostos =
            Number(
              produto.impostos ?? 0
            );

          const embalagem =
            Number(
              produto.embalagem ?? 0
            );

          const frete =
            Number(
              produto.frete ?? 0
            );

          const outrasDespesas =
            Number(
              produto.outras_despesas ??
                0
            );

          const acos =
            Number(
              produto.acos ?? 0
            );

          const promocao =
            Number(
              produto.promocao ?? 0
            );

          /*
           * Esses valores servem como
           * referência do cadastro.
           *
           * O cálculo final da Performance
           * será feito posteriormente usando
           * a venda real do Mercado Livre.
           */

          const valorComissao =
            precoVenda *
            (comissao / 100);

          const valorImpostos =
            precoVenda *
            (impostos / 100);

          const valorAcos =
            precoVenda *
            (acos / 100);

          const valorPromocao =
            precoVenda *
            (promocao / 100);

          const custosFixos =
            custo +
            embalagem +
            frete +
            outrasDespesas;

          const custosPercentuais =
            valorComissao +
            valorImpostos +
            valorAcos +
            valorPromocao;

          const custoEstimadoCadastro =
            custosFixos +
            custosPercentuais;

          const lucroEstimadoCadastro =
            precoVenda -
            custoEstimadoCadastro;

          const margemEstimadaCadastro =
            precoVenda > 0
              ? (
                  lucroEstimadoCadastro /
                  precoVenda
                ) * 100
              : 0;

          const roiEstimadoCadastro =
            custo > 0
              ? (
                  lucroEstimadoCadastro /
                  custo
                ) * 100
              : 0;

          return {
            id:
              produto.id,

            sku:
              produto.sku?.trim() ||
              null,

            nome:
              produto.nome ?? "",

            estoque:
              Number(
                produto.estoque ?? 0
              ),

            custos: {
              custo,

              preco_venda:
                precoVenda,

              comissao,

              impostos,

              embalagem,

              frete,

              outras_despesas:
                outrasDespesas,

              acos,

              promocao,
            },

            referencia: {
              valor_comissao:
                valorComissao,

              valor_impostos:
                valorImpostos,

              valor_acos:
                valorAcos,

              valor_promocao:
                valorPromocao,

              custo_estimado:
                custoEstimadoCadastro,

              lucro_estimado:
                lucroEstimadoCadastro,

              margem_estimada:
                margemEstimadaCadastro,

              roi_estimado:
                roiEstimadoCadastro,
            },
          };
        }
      );

    /*
     * ============================================================
     * 4. ÍNDICE POR SKU
     * ============================================================
     *
     * Facilita cruzar:
     *
     * Mercado Livre
     *       ↓
     * SKU 11902
     *       ↓
     * Produto no Supabase
     */

    const porSku =
      produtos.reduce<
        Record<
          string,
          (typeof produtos)[number]
        >
      >(
        (mapa, produto) => {
          if (produto.sku) {
            mapa[
              produto.sku
            ] = produto;
          }

          return mapa;
        },
        {}
      );

    /*
     * ============================================================
     * 5. DIAGNÓSTICO
     * ============================================================
     */

    const comSku =
      produtos.filter(
        (produto) =>
          Boolean(produto.sku)
      ).length;

    const semSku =
      produtos.length - comSku;

    /*
     * ============================================================
     * 6. RETORNO
     * ============================================================
     */

    return NextResponse.json({
      conectado: true,

      total_produtos:
        produtos.length,

      resumo: {
        com_sku:
          comSku,

        sem_sku:
          semSku,
      },

      produtos,

      por_sku:
        porSku,
    });
  } catch (error) {
    console.error(
      "Erro Performance Mercado Livre:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao carregar dados de Performance.",
      },
      {
        status: 500,
      }
    );
  }
}