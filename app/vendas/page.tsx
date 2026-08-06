"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  DollarSign,
  Package,
  Plus,
  TrendingUp,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Produto = {
  id: number;
  sku: string | null;
  nome: string | null;
  custo: number | null;
  preco_venda: number | null;
  estoque: number | null;
};

type Venda = {
  id: number;
  data_venda: string;
  produto_id: number | null;
  sku: string | null;
  nome_produto: string | null;
  quantidade: number;
  preco_venda: number;
  custo_unitario: number;
  faturamento: number;
  custo_total: number;
  lucro: number;
  margem: number;
  roi: number;
};

export default function VendasPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);

  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [precoVenda, setPrecoVenda] = useState("");
  const [dataVenda, setDataVenda] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Usuário não autenticado.");
      setCarregando(false);
      return;
    }

    const { data: produtosData, error: produtosError } = await supabase
      .from("produtos")
      .select("id, sku, nome, custo, preco_venda, estoque")
      .eq("user_id", user.id)
      .order("nome", { ascending: true });

    if (produtosError) {
      console.error(produtosError);
      setErro("Não foi possível carregar os produtos.");
    } else {
      setProdutos(produtosData || []);
    }

    const { data: vendasData, error: vendasError } = await supabase
      .from("vendas")
      .select(
        "id, data_venda, produto_id, sku, nome_produto, quantidade, preco_venda, custo_unitario, faturamento, custo_total, lucro, margem, roi"
      )
      .eq("user_id", user.id)
      .order("data_venda", { ascending: false });

    if (vendasError) {
      console.error(vendasError);
      setErro("Não foi possível carregar as vendas.");
    } else {
      setVendas(vendasData || []);
    }

    setCarregando(false);
  }

  const produtoSelecionado = produtos.find(
    (produto) => produto.id.toString() === produtoId
  );

  function formatarMoeda(valor: number | null | undefined) {
    return Number(valor ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function selecionarProduto(valor: string) {
    setProdutoId(valor);

    const produto = produtos.find(
      (item) => item.id.toString() === valor
    );

    if (produto) {
      setPrecoVenda(String(produto.preco_venda ?? 0));
    } else {
      setPrecoVenda("");
    }

    setMensagem("");
    setErro("");
  }

  async function registrarVenda() {
    setMensagem("");
    setErro("");

    if (!produtoSelecionado) {
      setErro("Selecione um produto.");
      return;
    }

    const quantidadeNumerica = Number(quantidade);
    const precoNumerico = Number(
      precoVenda.replace(",", ".")
    );

    if (!Number.isInteger(quantidadeNumerica) || quantidadeNumerica <= 0) {
      setErro("Informe uma quantidade válida.");
      return;
    }

    if (quantidadeNumerica > Number(produtoSelecionado.estoque ?? 0)) {
      setErro(
        `Estoque insuficiente. Disponível: ${produtoSelecionado.estoque ?? 0} unidade(s).`
      );
      return;
    }

    if (!Number.isFinite(precoNumerico) || precoNumerico <= 0) {
      setErro("Informe um preço de venda válido.");
      return;
    }

    setSalvando(true);

    const dataISO = new Date(
      `${dataVenda}T12:00:00`
    ).toISOString();

    const { data, error } = await supabase.rpc(
      "registrar_venda",
      {
        p_produto_id: produtoSelecionado.id,
        p_quantidade: quantidadeNumerica,
        p_preco_venda: precoNumerico,
        p_data_venda: dataISO,
      }
    );

    if (error) {
      console.error("Erro ao registrar venda:", error);
      setErro(error.message || "Não foi possível registrar a venda.");
      setSalvando(false);
      return;
    }

    console.log("Venda registrada:", data);

    setMensagem("Venda registrada com sucesso!");

    setProdutoId("");
    setQuantidade("1");
    setPrecoVenda("");
    setDataVenda(new Date().toISOString().split("T")[0]);

    await carregarDados();

    setSalvando(false);
  }

  async function excluirVenda(venda: Venda) {
    const confirmar = window.confirm(
      `Excluir a venda de ${venda.quantidade} unidade(s) do SKU ${venda.sku || "-" }?`
    );

    if (!confirmar) {
      return;
    }

    setErro("");
    setMensagem("");

    /*
     * IMPORTANTE:
     * Neste primeiro momento não vamos permitir excluir uma venda,
     * porque precisamos criar a função de estorno que devolverá
     * automaticamente as unidades ao estoque.
     */

    setErro(
      "A exclusão de vendas será liberada quando o estorno automático do estoque estiver pronto."
    );
  }

  const totalVendido = vendas.reduce(
    (total, venda) => total + Number(venda.quantidade ?? 0),
    0
  );

  const faturamentoTotal = vendas.reduce(
    (total, venda) => total + Number(venda.faturamento ?? 0),
    0
  );

  const lucroTotal = vendas.reduce(
    (total, venda) => total + Number(venda.lucro ?? 0),
    0
  );

  const custoTotal = vendas.reduce(
    (total, venda) => total + Number(venda.custo_total ?? 0),
    0
  );

  const margemMedia =
    faturamentoTotal > 0
      ? (lucroTotal / faturamentoTotal) * 100
      : 0;

  const roiTotal =
    custoTotal > 0
      ? (lucroTotal / custoTotal) * 100
      : 0;

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-[1600px] space-y-7 p-6 lg:p-8">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Vendas
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Registre suas vendas e acompanhe seus resultados.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setMensagem("");
              setErro("");
              document
                .getElementById("formulario-venda")
                ?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F47B20] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(244,123,32,0.20)] transition hover:bg-[#df6d19]"
          >
            <Plus size={17} />
            Registrar venda
          </button>
        </div>

        {/* Indicadores */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Package size={19} className="text-blue-600" />
            </div>

            <p className="mt-4 text-xs font-medium text-slate-500">
              Unidades vendidas
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {carregando ? "..." : totalVendido.toLocaleString("pt-BR")}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071E49]/[0.06]">
              <DollarSign size={19} className="text-[#071E49]" />
            </div>

            <p className="mt-4 text-xs font-medium text-slate-500">
              Faturamento
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {carregando ? "..." : formatarMoeda(faturamentoTotal)}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47B20]/10">
              <DollarSign size={19} className="text-[#F47B20]" />
            </div>

            <p className="mt-4 text-xs font-medium text-slate-500">
              Lucro líquido
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {carregando ? "..." : formatarMoeda(lucroTotal)}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <TrendingUp size={19} className="text-emerald-600" />
            </div>

            <p className="mt-4 text-xs font-medium text-slate-500">
              Margem média
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {carregando ? "..." : `${margemMedia.toFixed(2)}%`}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
              <TrendingUp size={19} className="text-violet-600" />
            </div>

            <p className="mt-4 text-xs font-medium text-slate-500">
              ROI
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {carregando ? "..." : `${roiTotal.toFixed(2)}%`}
            </h2>
          </div>
        </div>

        {/* Mensagens */}
        {mensagem && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        {/* Formulário */}
        <div
          id="formulario-venda"
          className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)]"
        >
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-[17px] font-bold tracking-tight text-slate-900">
              Registrar venda
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Selecione o produto e informe os dados da venda.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 xl:grid-cols-4">
            {/* Produto */}
            <div className="xl:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Produto / SKU
              </label>

              <select
                value={produtoId}
                onChange={(e) => selecionarProduto(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#071E49] focus:ring-2 focus:ring-[#071E49]/10"
              >
                <option value="">
                  {carregando
                    ? "Carregando produtos..."
                    : "Selecione um produto"}
                </option>

                {produtos.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.sku || "Sem SKU"} —{" "}
                    {produto.nome || "Produto sem nome"} — Estoque:{" "}
                    {produto.estoque ?? 0}
                  </option>
                ))}
              </select>
            </div>

            {/* Estoque */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Estoque disponível
              </label>

              <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                {produtoSelecionado
                  ? `${produtoSelecionado.estoque ?? 0} unidade(s)`
                  : "-"}
              </div>
            </div>

            {/* Quantidade */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Quantidade vendida
              </label>

              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#071E49] focus:ring-2 focus:ring-[#071E49]/10"
              />
            </div>

            {/* Preço */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Preço de venda unitário
              </label>

              <input
                type="text"
                inputMode="decimal"
                value={precoVenda}
                onChange={(e) => setPrecoVenda(e.target.value)}
                placeholder="0,00"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#071E49] focus:ring-2 focus:ring-[#071E49]/10"
              />
            </div>

            {/* Data */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Data da venda
              </label>

              <div className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  value={dataVenda}
                  onChange={(e) => setDataVenda(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#071E49] focus:ring-2 focus:ring-[#071E49]/10"
                />
              </div>
            </div>
          </div>

          {/* Resumo */}
          {produtoSelecionado && (
            <div className="mx-6 mb-6 rounded-xl bg-slate-50 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] text-slate-400">
                    Produto
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {produtoSelecionado.nome || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400">
                    Custo unitário
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatarMoeda(produtoSelecionado.custo)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400">
                    Faturamento da venda
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#071E49]">
                    {formatarMoeda(
                      Number(precoVenda.replace(",", ".") || 0) *
                        Number(quantidade || 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={registrarVenda}
              disabled={salvando || carregando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#071E49] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0a2b67] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />

              {salvando ? "Registrando..." : "Registrar venda"}
            </button>
          </div>
        </div>

        {/* Histórico */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-[17px] font-bold tracking-tight text-slate-900">
                Vendas recentes
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Histórico das vendas registradas.
              </p>
            </div>

            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-500">
              {vendas.length} venda(s)
            </span>
          </div>

          {carregando ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">
              Carregando vendas...
            </div>
          ) : vendas.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <Package size={21} className="text-slate-400" />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Nenhuma venda registrada
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Registre sua primeira venda acima.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-left">
                    <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Data
                    </th>

                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      SKU
                    </th>

                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Produto
                    </th>

                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Qtd.
                    </th>

                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Faturamento
                    </th>

                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Lucro
                    </th>

                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Margem
                    </th>

                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      ROI
                    </th>

                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Ação
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {vendas.map((venda) => (
                    <tr
                      key={venda.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatarData(venda.data_venda)}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-semibold text-slate-500">
                          {venda.sku || "-"}
                        </span>
                      </td>

                      <td className="max-w-[260px] px-4 py-4">
                        <p className="truncate text-xs font-semibold text-slate-700">
                          {venda.nome_produto || "Produto sem nome"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                        {venda.quantidade}
                      </td>

                      <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                        {formatarMoeda(venda.faturamento)}
                      </td>

                      <td className="px-4 py-4 text-xs font-semibold text-emerald-600">
                        {formatarMoeda(venda.lucro)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={[
                            "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold",
                            Number(venda.margem) >= 0
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600",
                          ].join(" ")}
                        >
                          {Number(venda.margem).toFixed(2)}%
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={[
                            "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold",
                            Number(venda.roi) >= 0
                              ? "bg-blue-50 text-blue-600"
                              : "bg-red-50 text-red-600",
                          ].join(" ")}
                        >
                          {Number(venda.roi).toFixed(2)}%
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => excluirVenda(venda)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                          title="Excluir venda"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-6 py-3.5">
            <p className="text-[10px] text-slate-400">
              As vendas registradas reduzem automaticamente o estoque.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}