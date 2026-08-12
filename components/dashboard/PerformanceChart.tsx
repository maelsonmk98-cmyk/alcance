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
      console.error("Erro ao carregar desempenho:", error);

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
      classe:
        "bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400",
      bolinha: "bg-blue-400",
    },
    {
      nome: "Custos",
      valor: dados.custo,
      percentual:
        (dados.custo / maiorValor) * 100,
      classe:
        "bg-gradient-to-r from-slate-600 via-slate-500 to-slate-400",
      bolinha: "bg-slate-400",
    },
    {
      nome: "Lucro Líquido",
      valor: dados.lucro,
      percentual:
        (Math.abs(dados.lucro) / maiorValor) * 100,
      classe:
        dados.lucro >= 0
          ? "bg-gradient-to-r from-orange-600 via-[#F47B20] to-amber-400"
          : "bg-gradient-to-r from-red-700 via-red-500 to-rose-400",
      bolinha:
        dados.lucro >= 0
          ? "bg-[#F47B20]"
          : "bg-red-400",
    },
  ];

  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-2xl
        border
        border-slate-700/60
        bg-[#0d1a2d]
        p-6
        shadow-[0_12px_35px_rgba(0,0,0,0.22)]
      "
    >
      {/* brilho de fundo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-orange-500/[0.04] to-transparent" />

      <div className="relative">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[17px] font-bold tracking-tight text-white">
              Desempenho
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Resultado financeiro das vendas realizadas.
            </p>
          </div>

          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-orange-500/10
              bg-orange-500/10
            "
          >
            <BarChart3
              size={18}
              className="text-[#F47B20]"
            />
          </div>
        </div>

        {/* Resumo */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-700/50 bg-[#101e32] p-3">
            <p className="text-[10px] font-medium text-slate-500">
              Faturamento
            </p>

            <p className="mt-1 truncate text-sm font-bold text-white">
              {carregando
                ? "..."
                : formatarMoeda(dados.faturamento)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-[#101e32] p-3">
            <p className="text-[10px] font-medium text-slate-500">
              Custos
            </p>

            <p className="mt-1 truncate text-sm font-bold text-slate-200">
              {carregando
                ? "..."
                : formatarMoeda(dados.custo)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-[#101e32] p-3">
            <p className="text-[10px] font-medium text-slate-500">
              Lucro
            </p>

            <p
              className={`mt-1 truncate text-sm font-bold ${
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
        <div className="mt-7 space-y-6">
          {carregando ? (
            <div className="flex min-h-[190px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-orange-400" />

                Carregando...
              </div>
            </div>
          ) : (
            barras.map((barra) => (
              <div key={barra.nome}>
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${barra.bolinha}`}
                    />

                    <span className="text-xs font-semibold text-slate-300">
                      {barra.nome}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-white">
                    {formatarMoeda(barra.valor)}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full border border-slate-700/40 bg-[#07111f]">
                  <div
                    className={`
                      relative
                      h-full
                      rounded-full
                      transition-all
                      duration-700
                      ${barra.classe}
                    `}
                    style={{
                      width: `${Math.min(
                        Math.max(barra.percentual, 0),
                        100
                      )}%`,
                    }}
                  >
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Margem e ROI */}
        <div className="mt-7 grid grid-cols-2 gap-3 border-t border-slate-700/50 pt-5">
          <div
            className="
              group
              rounded-xl
              border
              border-slate-700/50
              bg-[#101e32]
              p-4
              transition
              hover:border-slate-600
            "
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">
                Margem
              </p>

              <div
                className={`
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-lg
                  ${
                    margem >= 0
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }
                `}
              >
                {margem >= 0 ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
              </div>
            </div>

            <p
              className={`mt-2 text-xl font-bold ${
                margem >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {carregando ? "..." : `${margem.toFixed(2)}%`}
            </p>

            <p className="mt-1 text-[10px] text-slate-600">
              Lucro sobre faturamento
            </p>
          </div>

          <div
            className="
              group
              rounded-xl
              border
              border-slate-700/50
              bg-[#101e32]
              p-4
              transition
              hover:border-slate-600
            "
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">
                ROI
              </p>

              <div
                className={`
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-lg
                  ${
                    roi >= 0
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-red-500/10 text-red-400"
                  }
                `}
              >
                <CircleDollarSign size={14} />
              </div>
            </div>

            <p
              className={`mt-2 text-xl font-bold ${
                roi >= 0
                  ? "text-blue-400"
                  : "text-red-400"
              }`}
            >
              {carregando ? "..." : `${roi.toFixed(2)}%`}
            </p>

            <p className="mt-1 text-[10px] text-slate-600">
              Retorno sobre os custos
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] text-slate-600">
            Baseado em todas as vendas
          </span>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                dados.lucro >= 0
                  ? "bg-emerald-400"
                  : "bg-red-400"
              }`}
            />

            {dados.lucro >= 0
              ? "Resultado positivo"
              : "Resultado negativo"}
          </div>
        </div>
      </div>
    </div>
  );
}