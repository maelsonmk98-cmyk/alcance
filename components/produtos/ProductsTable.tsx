"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
        "id, sku, nome, categoria, custo, preco_venda, comissao, impostos, embalagem, frete, outras_despesas"
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
    <div className="bg-white rounded-2xl shadow-sm">
      <div className="flex justify-between items-center p-6 border-b gap-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border rounded-xl p-3 w-96"
          placeholder="Pesquisar por SKU ou nome..."
        />

        <Link
          href="/produtos/novo"
          className="bg-[#081E4A] text-white px-6 py-3 rounded-xl hover:bg-blue-900 transition"
        >
          + Novo Produto
        </Link>
      </div>

      {erro && (
        <div className="mx-6 mt-6 p-4 rounded-xl bg-red-50 text-red-600">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="p-6 text-gray-500">
          Carregando produtos...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">SKU</th>
                <th className="text-left">Produto</th>
                <th className="text-left">Categoria</th>
                <th className="text-left">Custo</th>
                <th className="text-left">Venda</th>
                <th className="text-left">Margem</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>

            <tbody>
              {produtosFiltrados.map((produto) => {
                const margem = calcularMargem(produto);

                return (
                  <tr
                    key={produto.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-4">
                      {produto.sku || "-"}
                    </td>

                    <td>
                      {produto.nome || "-"}
                    </td>

                    <td>
                      {produto.categoria || "-"}
                    </td>

                    <td>
                      {formatarMoeda(produto.custo)}
                    </td>

                    <td>
                      {formatarMoeda(produto.preco_venda)}
                    </td>

                    <td
                      className={
                        margem >= 0
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {margem.toFixed(2)}%
                    </td>

                    <td className="text-center">
                      <Link
                        href={`/produtos/editar/${produto.id}`}
                        className="mr-3"
                        title="Editar produto"
                      >
                        ✏️
                      </Link>

                      <button
                        type="button"
                        title="Excluir produto"
                        disabled={excluindo === produto.id}
                        onClick={() =>
                          excluirProduto(produto.id, produto.nome)
                        }
                        className="disabled:opacity-50"
                      >
                        {excluindo === produto.id ? "⏳" : "🗑️"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {produtosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center p-8 text-gray-500"
                  >
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}