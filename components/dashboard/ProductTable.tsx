"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Package,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Produto = {
  id: number;
  sku: string | null;
  nome: string | null;
  estoque: number | null;
  custo: number | null;
  preco_venda: number | null;
  comissao: number | null;
  impostos: number | null;
  embalagem: number | null;
  frete: number | null;
  outras_despesas: number | null;
  acos: number | null;
  promocao: number | null;
};

export default function ProductTable() {
  const [produtos, setProdutos] =
    useState<Produto[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    async function carregarProdutos() {
      setCarregando(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setProdutos([]);
          return;
        }

        const { data, error } =
          await supabase
            .from("produtos")
            .select(
              `
              id,
              sku,
              nome,
              estoque,
              custo,
              preco_venda,
              comissao,
              impostos,
              embalagem,
              frete,
              outras_despesas,
              acos,
              promocao
              `
            )
            .eq("user_id", user.id)
            .order("id", {
              ascending: false,
            })
            .limit(5);

        if (error) {
          console.error(
            "Erro ao carregar produtos recentes:",
            error
          );

          setProdutos([]);
          return;
        }

        setProdutos(
          (data || []) as Produto[]
        );
      } catch (error) {
        console.error(
          "Erro inesperado ao carregar produtos recentes:",
          error
        );

        setProdutos([]);
      } finally {
        setCarregando(false);
      }
    }

    carregarProdutos();
  }, []);

  function formatarMoeda(
    valor: number | null
  ) {
    return Number(
      valor ?? 0
    ).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarQuantidade(
    valor: number | null
  ) {
    return Number(
      valor ?? 0
    ).toLocaleString("pt-BR");
  }

  function calcularLucro(
    produto: Produto
  ) {
    const venda = Number(
      produto.preco_venda ?? 0
    );

    const custo = Number(
      produto.custo ?? 0
    );

    const comissao = Number(
      produto.comissao ?? 0
    );

    const impostos = Number(
      produto.impostos ?? 0
    );

    const embalagem = Number(
      produto.embalagem ?? 0
    );

    const frete = Number(
      produto.frete ?? 0
    );

    const outrasDespesas = Number(
      produto.outras_despesas ?? 0
    );

    const acos = Number(
      produto.acos ?? 0
    );

    const promocao = Number(
      produto.promocao ?? 0
    );

    const valorComissao =
      venda * (comissao / 100);

    const valorImpostos =
      venda * (impostos / 100);

    const valorAcos =
      venda * (acos / 100);

    const valorPromocao =
      venda * (promocao / 100);

    return (
      venda -
      custo -
      valorComissao -
      valorImpostos -
      embalagem -
      frete -
      outrasDespesas -
      valorAcos -
      valorPromocao
    );
  }

  function calcularMargem(
    produto: Produto
  ) {
    const venda = Number(
      produto.preco_venda ?? 0
    );

    if (venda <= 0) {
      return 0;
    }

    const lucro =
      calcularLucro(produto);

    return (
      (lucro / venda) * 100
    );
  }

  function calcularRoi(
    produto: Produto
  ) {
    const custo = Number(
      produto.custo ?? 0
    );

    if (custo <= 0) {
      return 0;
    }

    const lucro =
      calcularLucro(produto);

    return (
      (lucro / custo) * 100
    );
  }

  return (
    <div
      className="
        relative
        flex
        h-full
        min-h-[420px]
        flex-col
        overflow-hidden
        rounded-[14px]
        border
        border-[#233754]
        bg-[#0d1b2f]
        shadow-[0_8px_24px_rgba(0,0,0,0.15)]
      "
    >
      {/* Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-blue-500/[0.025] to-transparent" />

      {/* Cabeçalho */}
      <div className="relative flex shrink-0 items-center justify-between border-b border-[#233754]/70 px-4 py-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/10 bg-blue-500/10">
              <Package
                size={14}
                className="text-blue-400"
              />
            </div>

            <h2 className="text-[14px] font-bold text-white">
              Produtos Recentes
            </h2>
          </div>

          <p className="mt-1 text-[8px] text-slate-600">
            Acompanhe os produtos cadastrados recentemente.
          </p>
        </div>

        <Link
          href="/produtos"
          className="
            hidden
            items-center
            gap-1
            rounded-md
            px-2
            py-1.5
            text-[8px]
            font-medium
            text-blue-400
            transition
            hover:bg-blue-500/10
            hover:text-blue-300
            sm:flex
          "
        >
          Ver todos
          <ArrowUpRight size={10} />
        </Link>
      </div>

      {/* Conteúdo */}
      {carregando ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="flex items-center gap-2 text-[9px] text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />

            Carregando produtos...
          </div>
        </div>
      ) : produtos.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#233754] bg-[#101e32]">
            <Package
              size={18}
              className="text-slate-600"
            />
          </div>

          <p className="mt-3 text-[10px] font-semibold text-slate-300">
            Nenhum produto cadastrado
          </p>

          <p className="mt-1 text-[8px] text-slate-600">
            Cadastre seu primeiro produto para ele aparecer aqui.
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[33%]" />
              <col className="w-[8%]" />
              <col className="w-[12%]" />
              <col className="w-[15%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
            </colgroup>

            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[#233754]/70 bg-[#0b1728]">
                <th className="px-3 py-2 text-left text-[7px] font-medium uppercase tracking-[0.06em] text-slate-600">
                  SKU
                </th>

                <th className="px-2 py-2 text-left text-[7px] font-medium uppercase tracking-[0.06em] text-slate-600">
                  Produto
                </th>

                <th className="px-2 py-2 text-center text-[7px] font-medium uppercase tracking-[0.06em] text-slate-600">
                  Qtd.
                </th>

                <th className="px-2 py-2 text-right text-[7px] font-medium uppercase tracking-[0.06em] text-slate-600">
                  Custo
                </th>

                <th className="px-2 py-2 text-right text-[7px] font-medium uppercase tracking-[0.06em] text-slate-600">
                  Investido
                </th>

                <th className="px-2 py-2 text-right text-[7px] font-medium uppercase tracking-[0.06em] text-slate-600">
                  Margem
                </th>

                <th className="px-3 py-2 text-right text-[7px] font-medium uppercase tracking-[0.06em] text-slate-600">
                  ROI
                </th>
              </tr>
            </thead>

            <tbody>
              {produtos.map(
                (produto) => {
                  const estoque =
                    Number(
                      produto.estoque ?? 0
                    );

                  const custo =
                    Number(
                      produto.custo ?? 0
                    );

                  const valorInvestido =
                    custo * estoque;

                  const margem =
                    calcularMargem(
                      produto
                    );

                  const roi =
                    calcularRoi(
                      produto
                    );

                  return (
                    <tr
                      key={produto.id}
                      className="
                        border-b
                        border-[#17263a]
                        transition-colors
                        last:border-b-0
                        hover:bg-[#11223a]
                      "
                    >
                      {/* SKU */}
                      <td className="px-3 py-2.5">
                        <span
                          className="
                            inline-flex
                            max-w-full
                            truncate
                            rounded-md
                            border
                            border-[#2a3e59]
                            bg-[#15243a]
                            px-1.5
                            py-1
                            font-mono
                            text-[7px]
                            font-semibold
                            text-slate-400
                          "
                        >
                          {produto.sku || "-"}
                        </span>
                      </td>

                      {/* Produto */}
                      <td className="px-2 py-2.5">
                        <p
                          title={
                            produto.nome ||
                            "Produto sem nome"
                          }
                          className="truncate text-[8px] font-medium text-slate-200"
                        >
                          {produto.nome ||
                            "Produto sem nome"}
                        </p>
                      </td>

                      {/* Quantidade */}
                      <td className="px-2 py-2.5 text-center">
                        <span
                          className={`
                            inline-flex
                            min-w-[28px]
                            items-center
                            justify-center
                            rounded-md
                            border
                            px-1.5
                            py-1
                            text-[7px]
                            font-bold
                            ${
                              estoque > 0
                                ? "border-blue-500/10 bg-blue-500/10 text-blue-400"
                                : "border-red-500/10 bg-red-500/10 text-red-400"
                            }
                          `}
                        >
                          {formatarQuantidade(
                            estoque
                          )}
                        </span>
                      </td>

                      {/* Custo */}
                      <td className="px-2 py-2.5 text-right text-[8px] text-slate-400">
                        {formatarMoeda(
                          produto.custo
                        )}
                      </td>

                      {/* Investido */}
                      <td className="px-2 py-2.5 text-right">
                        <span
                          className={`truncate text-[8px] font-semibold ${
                            valorInvestido >= 0
                              ? "text-slate-200"
                              : "text-red-400"
                          }`}
                        >
                          {formatarMoeda(
                            valorInvestido
                          )}
                        </span>
                      </td>

                      {/* Margem */}
                      <td className="px-2 py-2.5 text-right">
                        <span
                          className={`
                            inline-flex
                            rounded-md
                            border
                            px-1.5
                            py-1
                            text-[7px]
                            font-bold
                            ${
                              margem >= 0
                                ? "border-emerald-500/10 bg-emerald-500/10 text-emerald-400"
                                : "border-red-500/10 bg-red-500/10 text-red-400"
                            }
                          `}
                        >
                          {margem.toFixed(
                            2
                          )}
                          %
                        </span>
                      </td>

                      {/* ROI */}
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={`
                            inline-flex
                            rounded-md
                            border
                            px-1.5
                            py-1
                            text-[7px]
                            font-bold
                            ${
                              roi >= 0
                                ? "border-emerald-500/10 bg-emerald-500/10 text-emerald-400"
                                : "border-red-500/10 bg-red-500/10 text-red-400"
                            }
                          `}
                        >
                          {roi.toFixed(
                            2
                          )}
                          %
                        </span>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Rodapé */}
      <div className="relative flex shrink-0 items-center justify-between border-t border-[#233754]/70 bg-[#0b1728] px-4 py-2">
        <p className="text-[7px] text-slate-600">
          Exibindo os produtos cadastrados mais recentemente.
        </p>

        <Link
          href="/produtos"
          className="text-[8px] font-medium text-blue-400 transition hover:text-blue-300"
        >
          Ver todos os produtos
        </Link>
      </div>
    </div>
  );
}