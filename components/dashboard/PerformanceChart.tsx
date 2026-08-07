"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
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
      classe: "bg-[#071E49]",
    },
    {
      nome: "Custo",
      valor: dados.custo,
      percentual:
        (dados.custo / maiorValor) * 100,
      classe: "bg-slate-300",
    },
    {
      nome: "Lucro",
      valor: dados.lucro,
      percentual:
        (Math.abs(dados.lucro) / maiorValor) * 100,
      classe:
        dados.lucro >= 0
          ? "bg-[#F47B20]"
          : "bg-red-500",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-slate-900">
            Desempenho
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Margem e ROI das vendas realizadas.
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
          <BarChart3
            size={17}
            className="text-[#F47B20]"
          />
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {carregando ? (
          <div className="py-20 text-center text-sm text-slate-400">
            Carregando...
          </div>
        ) : (
          barras.map((barra) => (
            <div key={barra.nome}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  {barra.nome}
                </span>

                <span className="text-xs font-bold text-slate-800">
                  {formatarMoeda(barra.valor)}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barra.classe}`}
                  style={{
                    width: `${Math.min(
                      Math.max(barra.percentual, 0),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-[10px] font-medium text-slate-400">
            Margem
          </p>

          <p
            className={`mt-1 text-lg font-bold ${
              margem >= 0
                ? "text-emerald-600"
                : "text-red-600"
            }`}
          >
            {margem.toFixed(2)}%
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-[10px] font-medium text-slate-400">
            ROI
          </p>

          <p
            className={`mt-1 text-lg font-bold ${
              roi >= 0
                ? "text-blue-600"
                : "text-red-600"
            }`}
          >
            {roi.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}