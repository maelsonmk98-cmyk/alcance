"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Package } from "lucide-react";
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
};

export default function ProductTable() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarProdutos() {
      const { data, error } = await supabase
        .from("produtos")
        .select(
          "id, sku, nome, estoque, custo, preco_venda, comissao, impostos, embalagem, frete, outras_despesas"
        )
        .order("id", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Erro ao carregar produtos recentes:", error);
        setProdutos([]);
      } else {
        setProdutos(data || []);
      }

      setCarregando(false);
    }

    carregarProdutos();
  }, []);

  function formatarMoeda(valor: number | null) {
    return Number(valor ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarQuantidade(valor: number | null) {
    return Number(valor ?? 0).toLocaleString("pt-BR");
  }

  function calcularMargem(produto: Produto) {
    const venda = Number(produto.preco_venda ?? 0);
    const custo = Number(produto.custo ?? 0);
    const comissao = Number(produto.comissao ?? 0);
    const impostos = Number(produto.impostos ?? 0);
    const embalagem = Number(produto.embalagem ?? 0);
    const frete = Number(produto.frete ?? 0);
    const outrasDespesas = Number(produto.outras_despesas ?? 0);

    if (venda <= 0) {
      return 0;
    }

    const valorComissao = venda * (comissao / 100);
    const valorImpostos = venda * (impostos / 100);

    const lucro =
      venda -
      custo -
      valorComissao -
      valorImpostos -
      embalagem -
      frete -
      outrasDespesas;

    return (lucro / venda) * 100;
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#071E49]/[0.06]">
              <Package
                size={16}
                strokeWidth={2}
                className="text-[#071E49]"
              />
            </div>

            <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
              Produtos Recentes
            </h2>
          </div>

          <p className="mt-1.5 text-[11px] text-slate-400">
            Acompanhe os produtos cadastrados recentemente.
          </p>
        </div>

        <Link
          href="/produtos"
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-[#071E49] transition hover:bg-slate-50 sm:flex"
        >
          Ver todos
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Carregando */}
      {carregando ? (
        <div className="px-6 py-10 text-center text-xs text-slate-400">
          Carregando produtos...
        </div>
      ) : produtos.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <Package
            size={28}
            className="mx-auto text-slate-300"
          />

          <p className="mt-3 text-sm font-semibold text-slate-600">
            Nenhum produto cadastrado
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Cadastre seu primeiro produto para ele aparecer aqui.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left">
                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  SKU
                </th>

                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Produto
                </th>

                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Qtd.
                </th>

                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Custo
                </th>

                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Venda
                </th>

                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Margem
                </th>
              </tr>
            </thead>

            <tbody>
              {produtos.map((produto) => {
                const margem = calcularMargem(produto);
                const estoque = Number(produto.estoque ?? 0);

                return (
                  <tr
                    key={produto.id}
                    className="group border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/70"
                  >
                    {/* SKU */}
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-semibold text-slate-500">
                        {produto.sku || "-"}
                      </span>
                    </td>

                    {/* PRODUTO */}
                    <td className="px-4 py-4 pr-6">
                      <p className="max-w-[250px] truncate text-[12px] font-semibold text-slate-800">
                        {produto.nome || "Produto sem nome"}
                      </p>
                    </td>

                    {/* QUANTIDADE */}
                    <td className="px-4 py-4">
                      <span
                        className={[
                          "inline-flex min-w-[42px] items-center justify-center rounded-md px-2 py-1 text-[11px] font-bold",
                          estoque > 0
                            ? "bg-blue-50 text-blue-700"
                            : "bg-red-50 text-red-600",
                        ].join(" ")}
                      >
                        {formatarQuantidade(estoque)}
                      </span>
                    </td>

                    {/* CUSTO UNITÁRIO */}
                    <td className="px-4 py-4 text-[12px] text-slate-500">
                      {formatarMoeda(produto.custo)}
                    </td>

                    {/* VENDA UNITÁRIA */}
                    <td className="px-4 py-4 text-[12px] font-semibold text-slate-700">
                      {formatarMoeda(produto.preco_venda)}
                    </td>

                    {/* MARGEM */}
                    <td className="px-4 py-4">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset",
                          margem >= 0
                            ? "bg-emerald-50 text-emerald-600 ring-emerald-500/10"
                            : "bg-red-50 text-red-600 ring-red-500/10",
                        ].join(" ")}
                      >
                        {margem.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Rodapé */}
      <div className="border-t border-slate-100 px-6 py-3.5">
        <p className="text-[10px] text-slate-400">
          Exibindo os produtos cadastrados mais recentemente.
        </p>
      </div>
    </div>
  );
}
