"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Produto = {
  id: number;
  sku: string | null;
  nome: string | null;
  categoria: string | null;
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

export default function ProductsTable() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState<number | null>(null);

  async function carregarProdutos() {
    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("produtos")
      .select(
        "id, sku, nome, categoria, custo, preco_venda, comissao, impostos, embalagem, frete, outras_despesas, acos, promocao"
      )
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      setErro("Erro ao carregar os produtos: " + error.message);
      setCarregando(false);
      return;
    }

    setProdutos(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function excluirProduto(id: number, nome: string | null) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o produto "${nome || "sem nome"}"?`
    );

    if (!confirmar) {
      return;
    }

    setExcluindo(id);
    setErro("");

    const { error } = await supabase
      .from("produtos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setErro("Erro ao excluir o produto: " + error.message);
      setExcluindo(null);
      return;
    }

    setProdutos((produtosAtuais) =>
      produtosAtuais.filter((produto) => produto.id !== id)
    );

    setExcluindo(null);
  }

  const produtosFiltrados = produtos.filter((produto) => {
    const termo = busca.toLowerCase().trim();

    if (!termo) {
      return true;
    }

    return (
      produto.nome?.toLowerCase().includes(termo) ||
      produto.sku?.toLowerCase().includes(termo)
    );
  });

  function formatarMoeda(valor: number | null) {
    return (valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function calcularMargem(produto: Produto) {
    const venda = produto.preco_venda || 0;
    const custo = produto.custo || 0;
    const comissao = produto.comissao || 0;
    const impostos = produto.impostos || 0;
    const embalagem = produto.embalagem || 0;
    const frete = produto.frete || 0;
    const outrasDespesas = produto.outras_despesas || 0;
    const acos = produto.acos || 0;
    const promocao = produto.promocao || 0;

    if (venda <= 0) {
      return 0;
    }

    const valorComissao = venda * (comissao / 100);
    const valorImpostos = venda * (impostos / 100);
    const valorAcos = venda * (acos / 100);
    const valorPromocao = venda * (promocao / 100);

    const lucro =
      venda -
      custo -
      valorComissao -
      valorImpostos -
      embalagem -
      frete -
      outrasDespesas -
      valorAcos -
      valorPromocao;

    return (lucro / venda) * 100;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
      {/* Barra superior */}
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[380px]">
          <Search
            size={17}
            strokeWidth={1.8}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071E49]/20 focus:bg-white focus:ring-4 focus:ring-[#071E49]/[0.04]"
            placeholder="Pesquisar por SKU ou nome..."
          />
        </div>

        <Link
          href="/produtos/novo"
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#F47B20] px-4 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(244,123,32,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#E96F17] hover:shadow-[0_7px_18px_rgba(244,123,32,0.22)]"
        >
          <Plus size={15} strokeWidth={2.5} />
          Novo Produto
        </Link>
      </div>

      {/* Mensagem de erro */}
      {erro && (
        <div className="mx-5 mt-5 flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] text-red-600">
          <span>{erro}</span>

          <button
            type="button"
            onClick={carregarProdutos}
            className="flex shrink-0 items-center gap-1.5 font-semibold hover:underline"
          >
            <RefreshCw size={13} />
            Tentar novamente
          </button>
        </div>
      )}

      {carregando ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071E49]/[0.06]">
            <RefreshCw
              size={18}
              className="animate-spin text-[#071E49]"
            />
          </div>

          <p className="text-[12px] text-slate-400">
            Carregando produtos...
          </p>
        </div>
      ) : (
        <>
          {/* Cabeçalho da tabela */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left">
                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Produto
                  </th>

                  <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    SKU
                  </th>

                  <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Categoria
                  </th>

                  <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Custo
                  </th>

                  <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Venda
                  </th>

                  <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Margem
                  </th>

                  <th className="px-6 py-3.5 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {produtosFiltrados.map((produto) => {
                  const margem = calcularMargem(produto);

                  return (
                    <tr
                      key={produto.id}
                      className="group border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/60"
                    >
                      {/* Produto */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#071E49]/[0.06]">
                            <Package
                              size={16}
                              strokeWidth={1.8}
                              className="text-[#071E49]"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[250px] truncate text-[12px] font-semibold text-slate-800">
                              {produto.nome || "Sem nome"}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              Produto cadastrado
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-semibold text-slate-500">
                          {produto.sku || "-"}
                        </span>
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-4">
                        <span className="text-[11px] font-medium text-slate-500">
                          {produto.categoria || "-"}
                        </span>
                      </td>

                      {/* Custo */}
                      <td className="px-4 py-4 text-[12px] text-slate-500">
                        {formatarMoeda(produto.custo)}
                      </td>

                      {/* Venda */}
                      <td className="px-4 py-4 text-[12px] font-semibold text-slate-700">
                        {formatarMoeda(produto.preco_venda)}
                      </td>

                      {/* Margem */}
                      <td className="px-4 py-4">
                        <span
                          className={[
                            "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset",
                            margem >= 0
                              ? "bg-emerald-50 text-emerald-600 ring-emerald-500/10"
                              : "bg-red-50 text-red-600 ring-red-500/10",
                          ].join(" ")}
                        >
                          {margem.toFixed(2)}%
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/produtos/editar/${produto.id}`}
                            title="Editar produto"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#071E49]/[0.06] hover:text-[#071E49]"
                          >
                            <Pencil size={14} strokeWidth={1.9} />
                          </Link>

                          <button
                            type="button"
                            title="Excluir produto"
                            disabled={excluindo === produto.id}
                            onClick={() =>
                              excluirProduto(produto.id, produto.nome)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {excluindo === produto.id ? (
                              <RefreshCw
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={14} strokeWidth={1.9} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {produtosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                          <Package
                            size={20}
                            className="text-slate-400"
                          />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-slate-700">
                          Nenhum produto encontrado
                        </p>

                        <p className="mt-1 max-w-[300px] text-[11px] leading-5 text-slate-400">
                          Tente pesquisar por outro SKU ou nome de produto.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Rodapé */}
          <div className="flex flex-col gap-2 border-t border-slate-100 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-slate-400">
              {produtosFiltrados.length}{" "}
              {produtosFiltrados.length === 1
                ? "produto encontrado"
                : "produtos encontrados"}
            </p>

            <button
              type="button"
              onClick={carregarProdutos}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 transition hover:text-[#071E49]"
            >
              <RefreshCw size={12} />
              Atualizar lista
            </button>
          </div>
        </>
      )}
    </div>
  );
}