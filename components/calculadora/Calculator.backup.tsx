"use client";

import { useState } from "react";
import {
  Search,
  Package,
  DollarSign,
  Percent,
  Truck,
  Box,
  Receipt,
  Wallet,
  TrendingUp,
  RotateCcw,
  Calculator as CalculatorIcon,
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
};

export default function Calculator() {
  const [sku, setSku] = useState("");
  const [produto, setProduto] = useState<Produto | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  const [precoVenda, setPrecoVenda] = useState(0);
  const [comissao, setComissao] = useState(0);
  const [tarifaFixa, setTarifaFixa] = useState(6.5);
  const [impostos, setImpostos] = useState(0);
  const [acos, setAcos] = useState(0);
  const [promocao, setPromocao] = useState(0);
  const [frete, setFrete] = useState(0);
  const [embalagem, setEmbalagem] = useState(0);
  const [outrasDespesas, setOutrasDespesas] = useState(0);

  async function buscarProduto() {
    const skuBusca = sku.trim();

    if (!skuBusca) {
      setErro("Digite um SKU para buscar.");
      setProduto(null);
      return;
    }

    setBuscando(true);
    setErro("");

    const { data, error } = await supabase
      .from("produtos")
      .select(
        "id, sku, nome, categoria, custo, preco_venda, comissao, impostos, embalagem, frete, outras_despesas"
      )
      .eq("sku", skuBusca)
      .maybeSingle();

    if (error) {
      console.error(error);
      setErro("Erro ao buscar produto: " + error.message);
      setProduto(null);
      setBuscando(false);
      return;
    }

    if (!data) {
      setErro("Produto não encontrado para este SKU.");
      setProduto(null);
      setBuscando(false);
      return;
    }

    setProduto(data);

    setPrecoVenda(Number(data.preco_venda ?? 0));
    setComissao(Number(data.comissao ?? 0));
    setImpostos(Number(data.impostos ?? 0));
    setFrete(Number(data.frete ?? 0));
    setEmbalagem(Number(data.embalagem ?? 0));
    setOutrasDespesas(Number(data.outras_despesas ?? 0));

    // ACOS e Promoção são informados na própria calculadora
    setAcos(0);
    setPromocao(0);

    setBuscando(false);
  }

  function limparCalculadora() {
    setSku("");
    setProduto(null);
    setErro("");
    setPrecoVenda(0);
    setComissao(0);
    setTarifaFixa(6.5);
    setImpostos(0);
    setAcos(0);
    setPromocao(0);
    setFrete(0);
    setEmbalagem(0);
    setOutrasDespesas(0);
  }

  const custo = Number(produto?.custo ?? 0);

  // Percentuais calculados sobre o preço de venda
  const valorComissao = precoVenda * (comissao / 100);
  const valorImpostos = precoVenda * (impostos / 100);
  const valorAcOS = precoVenda * (acos / 100);
  const valorPromocao = precoVenda * (promocao / 100);

  const lucro =
    precoVenda -
    custo -
    valorComissao -
    tarifaFixa -
    valorImpostos -
    valorAcOS -
    valorPromocao -
    frete -
    embalagem -
    outrasDespesas;

  const margem =
    precoVenda > 0 ? (lucro / precoVenda) * 100 : 0;

  const roi =
    custo > 0 ? (lucro / custo) * 100 : 0;

  const totalCustos =
    custo +
    valorComissao +
    tarifaFixa +
    valorImpostos +
    valorAcOS +
    valorPromocao +
    frete +
    embalagem +
    outrasDespesas;

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function campoClasse() {
    return "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071E49]/20 focus:bg-white focus:ring-4 focus:ring-[#071E49]/[0.04]";
  }

  return (
    <div className="space-y-6">
      {/* Busca */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#071E49]/[0.06]">
                <Search
                  size={16}
                  className="text-[#071E49]"
                />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Buscar produto
                </h2>

                <p className="text-[11px] text-slate-400">
                  Informe o SKU para carregar os dados cadastrados.
                </p>
              </div>
            </div>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    buscarProduto();
                  }
                }}
                placeholder="Digite o SKU do produto..."
                className={`${campoClasse()} pl-10`}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={buscarProduto}
            disabled={buscando}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F47B20] px-6 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(244,123,32,0.16)] transition-all hover:bg-[#E96F17] hover:shadow-[0_7px_18px_rgba(244,123,32,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Search size={16} />

            {buscando ? "Buscando..." : "Buscar produto"}
          </button>
        </div>

        {erro && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
            {erro}
          </div>
        )}
      </div>

      {produto && (
        <>
          {/* Produto selecionado */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#071E49]/[0.06]">
                  <Package
                    size={21}
                    className="text-[#071E49]"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Produto selecionado
                  </p>

                  <h2 className="mt-1 truncate text-lg font-bold tracking-tight text-slate-900">
                    {produto.nome || "Produto sem nome"}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={limparCalculadora}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <RotateCcw size={14} />
                Limpar
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 md:grid-cols-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  SKU
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-700">
                  {produto.sku || "-"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Categoria
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-700">
                  {produto.categoria || "-"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Custo do produto
                </p>

                <p className="mt-1 text-xs font-bold text-slate-800">
                  {formatarMoeda(custo)}
                </p>
              </div>
            </div>
          </div>

          {/* Dados da operação */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Dados da venda */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <DollarSign
                    size={17}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Dados da venda
                  </h2>

                  <p className="text-[11px] text-slate-400">
                    Configure os valores da operação.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Preço de venda */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                    Preço de venda
                  </label>

                  <div className="relative">
                    <DollarSign
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={precoVenda}
                      onChange={(e) =>
                        setPrecoVenda(Number(e.target.value))
                      }
                      className={`${campoClasse()} pl-9`}
                    />
                  </div>
                </div>

                {/* Comissão */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                    Comissão (%)
                  </label>

                  <div className="relative">
                    <Percent
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={comissao}
                      onChange={(e) =>
                        setComissao(Number(e.target.value))
                      }
                      className={`${campoClasse()} pl-9`}
                    />
                  </div>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Valor calculado sobre a venda.
                  </p>
                </div>

                {/* Tarifa fixa */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                    Tarifa fixa
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tarifaFixa}
                    onChange={(e) =>
                      setTarifaFixa(Number(e.target.value))
                    }
                    className={campoClasse()}
                  />

                  <p className="mt-1 text-[10px] text-slate-400">
                    Valor padrão: R$ 6,50
                  </p>
                </div>
              </div>
            </div>

            {/* Outros custos */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                  <Wallet
                    size={17}
                    className="text-orange-500"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Outros custos
                  </h2>

                  <p className="text-[11px] text-slate-400">
                    Despesas adicionais da operação.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Impostos */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <Percent size={12} />
                    Impostos (%)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={impostos}
                    onChange={(e) =>
                      setImpostos(Number(e.target.value))
                    }
                    className={campoClasse()}
                  />

                  <p className="mt-1 text-[10px] text-slate-400">
                    Percentual sobre o valor da venda.
                  </p>
                </div>

                {/* ACOS */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <Percent size={12} />
                    ACOS (%)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={acos}
                    onChange={(e) =>
                      setAcos(Number(e.target.value))
                    }
                    className={campoClasse()}
                  />

                  <p className="mt-1 text-[10px] text-slate-400">
                    Percentual sobre o valor da venda.
                  </p>
                </div>

                {/* Promoção */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <Percent size={12} />
                    Promoção (%)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={promocao}
                    onChange={(e) =>
                      setPromocao(Number(e.target.value))
                    }
                    className={campoClasse()}
                  />

                  <p className="mt-1 text-[10px] text-slate-400">
                    Percentual sobre o valor da venda.
                  </p>
                </div>

                {/* Frete */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <Truck size={12} />
                    Frete
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={frete}
                    onChange={(e) =>
                      setFrete(Number(e.target.value))
                    }
                    className={campoClasse()}
                  />
                </div>

                {/* Embalagem */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <Box size={12} />
                    Embalagem
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={embalagem}
                    onChange={(e) =>
                      setEmbalagem(Number(e.target.value))
                    }
                    className={campoClasse()}
                  />
                </div>

                {/* Outras despesas */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <Receipt size={12} />
                    Outras despesas
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={outrasDespesas}
                    onChange={(e) =>
                      setOutrasDespesas(Number(e.target.value))
                    }
                    className={campoClasse()}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resumo dos percentuais */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
            <div className="mb-5">
              <h2 className="text-sm font-bold text-slate-900">
                Resumo dos percentuais
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                Valores calculados automaticamente sobre o preço de venda.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Comissão
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  {formatarMoeda(valorComissao)}
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  {comissao.toFixed(2)}%
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Impostos
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  {formatarMoeda(valorImpostos)}
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  {impostos.toFixed(2)}%
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  ACOS
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  {formatarMoeda(valorAcOS)}
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  {acos.toFixed(2)}%
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Promoção
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  {formatarMoeda(valorPromocao)}
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  {promocao.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Resultado */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                <CalculatorIcon
                  size={17}
                  className="text-emerald-600"
                />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Resultado da análise
                </h2>

                <p className="text-[11px] text-slate-400">
                  Resultado calculado com os valores informados.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {/* Total de custos */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-slate-500">
                    Total de custos
                  </p>

                  <Wallet
                    size={16}
                    className="text-slate-400"
                  />
                </div>

                <p className="mt-3 text-xl font-bold tracking-tight text-slate-800">
                  {formatarMoeda(totalCustos)}
                </p>
              </div>

              {/* Lucro */}
              <div
                className={[
                  "rounded-xl border p-5",
                  lucro >= 0
                    ? "border-emerald-100 bg-emerald-50/60"
                    : "border-red-100 bg-red-50/60",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <p
                    className={[
                      "text-[11px] font-medium",
                      lucro >= 0
                        ? "text-emerald-600"
                        : "text-red-600",
                    ].join(" ")}
                  >
                    Lucro líquido
                  </p>

                  <DollarSign
                    size={16}
                    className={
                      lucro >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }
                  />
                </div>

                <p
                  className={[
                    "mt-3 text-xl font-bold tracking-tight",
                    lucro >= 0
                      ? "text-emerald-700"
                      : "text-red-700",
                  ].join(" ")}
                >
                  {formatarMoeda(lucro)}
                </p>
              </div>

              {/* Margem */}
              <div
                className={[
                  "rounded-xl border p-5",
                  margem >= 0
                    ? "border-blue-100 bg-blue-50/60"
                    : "border-red-100 bg-red-50/60",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-slate-500">
                    Margem
                  </p>

                  <Percent
                    size={16}
                    className="text-blue-600"
                  />
                </div>

                <p
                  className={[
                    "mt-3 text-xl font-bold tracking-tight",
                    margem >= 0
                      ? "text-blue-700"
                      : "text-red-700",
                  ].join(" ")}
                >
                  {margem.toFixed(2)}%
                </p>
              </div>

              {/* ROI */}
              <div
                className={[
                  "rounded-xl border p-5",
                  roi >= 0
                    ? "border-orange-100 bg-orange-50/60"
                    : "border-red-100 bg-red-50/60",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-slate-500">
                    ROI
                  </p>

                  <TrendingUp
                    size={16}
                    className={
                      roi >= 0
                        ? "text-orange-500"
                        : "text-red-600"
                    }
                  />
                </div>

                <p
                  className={[
                    "mt-3 text-xl font-bold tracking-tight",
                    roi >= 0
                      ? "text-orange-600"
                      : "text-red-700",
                  ].join(" ")}
                >
                  {roi.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}