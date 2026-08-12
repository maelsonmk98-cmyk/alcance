"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Venda = {
  faturamento: number | null;
  custo_total: number | null;
  lucro: number | null;
};

export default function PerformanceChart() {
  const [dados, setDados] = useState({
    faturamento: 0,
    custo: 0,
    lucro: 0,
  });

  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDados({
        faturamento: 0,
        custo: 0,
        lucro: 0,
      });

      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("vendas")
      .select("faturamento, custo_total, lucro")
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Erro ao carregar desempenho:",
        error
      );

      setCarregando(false);
      return;
    }

    const faturamento = (data || []).reduce(
      (total, venda: Venda) =>
        total + Number(venda.faturamento ?? 0),
      0
    );

    const custo = (data || []).reduce(
      (total, venda: Venda) =>
        total + Number(venda.custo_total ?? 0),
      0
    );

    const lucro = (data || []).reduce(
      (total, venda: Venda) =>
        total + Number(venda.lucro ?? 0),
      0
    );

    setDados({
      faturamento,
      custo,
      lucro,
    });

    setCarregando(false);
  }

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const maiorValor = Math.max(
    dados.faturamento,
    dados.custo,
    Math.abs(dados.lucro),
    1
  );

  const margem =
    dados.faturamento > 0
      ? (dados.lucro / dados.faturamento) * 100
      : 0;

  const roi =
    dados.custo > 0
      ? (dados.lucro / dados.custo) * 100
      : 0;

  const barras = [
    {
      nome: "Faturamento",
      valor: dados.faturamento,
      percentual:
        (dados.faturamento / maiorValor) * 100,
      cor: "from-blue-600 to-blue-400",
      ponto: "bg-blue-400",
    },
    {
      nome: "Custos",
      valor: dados.custo,
      percentual:
        (dados.custo / maiorValor) * 100,
      cor: "from-slate-500 to-slate-400",
      ponto: "bg-slate-400",
    },
    {
      nome: "Lucro",
      valor: dados.lucro,
      percentual:
        (Math.abs(dados.lucro) / maiorValor) * 100,
      cor:
        dados.lucro >= 0
          ? "from-emerald-600 to-emerald-400"
          : "from-red-600 to-red-400",
      ponto:
        dados.lucro >= 0
          ? "bg-emerald-400"
          : "bg-red-400",
    },
  ];

  return (
    <div
      className="
        relative
        h-[360px]
        overflow-hidden
        rounded-2xl
        border
        border-[#22334c]
        bg-[#0d1a2d]
        px-5
        py-4
        shadow-[0_8px_30px_rgba(0,0,0,0.16)]
      "
    >
      {/* Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#F47B20]/[0.035] to-transparent" />

      <div className="relative flex h-full flex-col">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[16px] font-bold tracking-tight text-white">
              Desempenho
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-500">
              Resultado financeiro das vendas
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#F47B20]/10 bg-[#F47B20]/10">
            <BarChart3
              size={16}
              className="text-[#F47B20]"
            />
          </div>
        </div>

        {/* Cards resumidos */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-[#22334c] bg-[#101e32] px-3 py-2.5">
            <p className="text-[9px] font-medium text-slate-500">
              Faturamento
            </p>

            <p className="mt-1 truncate text-[13px] font-bold text-white">
              {carregando
                ? "..."
                : formatarMoeda(dados.faturamento)}
            </p>
          </div>

          <div className="rounded-xl border border-[#22334c] bg-[#101e32] px-3 py-2.5">
            <p className="text-[9px] font-medium text-slate-500">
              Custos
            </p>

            <p className="mt-1 truncate text-[13px] font-bold text-white">
              {carregando
                ? "..."
                : formatarMoeda(dados.custo)}
            </p>
          </div>

          <div className="rounded-xl border border-[#22334c] bg-[#101e32] px-3 py-2.5">
            <p className="text-[9px] font-medium text-slate-500">
              Lucro
            </p>

            <p
              className={`mt-1 truncate text-[13px] font-bold ${
                dados.lucro >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {carregando
                ? "..."
                : formatarMoeda(dados.lucro)}
            </p>
          </div>
        </div>

        {/* Barras */}
        <div className="mt-5 space-y-4">
          {carregando ? (
            <div className="flex h-[115px] items-center justify-center">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-[#F47B20]" />

                Carregando...
              </div>
            </div>
          ) : (
            barras.map((barra) => (
              <div key={barra.nome}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${barra.ponto}`}
                    />

                    <span className="text-[10px] font-semibold text-slate-300">
                      {barra.nome}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-white">
                    {formatarMoeda(barra.valor)}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full border border-[#17263a] bg-[#07111f]">
                  <div
                    className={`
                      h-full
                      rounded-full
                      bg-gradient-to-r
                      transition-all
                      duration-700
                      ${barra.cor}
                    `}
                    style={{
                      width: `${
                        barra.valor === 0
                          ? 0
                          : Math.min(
                              Math.max(
                                barra.percentual,
                                2
                              ),
                              100
                            )
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Margem e ROI */}
        <div className="mt-auto grid grid-cols-2 gap-2.5 border-t border-[#22334c]/70 pt-3">
          {/* Margem */}
          <div className="group rounded-xl border border-[#22334c] bg-[#101e32] px-3 py-2.5 transition hover:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-medium text-slate-500">
                  Margem
                </p>

                <p
                  className={`mt-0.5 text-[16px] font-bold ${
                    margem >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {carregando
                    ? "..."
                    : `${margem.toFixed(2)}%`}
                </p>
              </div>

              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  margem >= 0
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {margem >= 0 ? (
                  <TrendingUp size={13} />
                ) : (
                  <TrendingDown size={13} />
                )}
              </div>
            </div>
          </div>

          {/* ROI */}
          <div className="group rounded-xl border border-[#22334c] bg-[#101e32] px-3 py-2.5 transition hover:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-medium text-slate-500">
                  ROI
                </p>

                <p
                  className={`mt-0.5 text-[16px] font-bold ${
                    roi >= 0
                      ? "text-blue-400"
                      : "text-red-400"
                  }`}
                >
                  {carregando
                    ? "..."
                    : `${roi.toFixed(2)}%`}
                </p>
              </div>

              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  roi >= 0
                    ? "bg-blue-500/10 text-blue-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                <CircleDollarSign size={13} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}