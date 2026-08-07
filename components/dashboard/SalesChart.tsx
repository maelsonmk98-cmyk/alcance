"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Venda = {
  data_venda: string;
  faturamento: number | null;
};

type Dia = {
  data: string;
  label: string;
  valor: number;
};

export default function SalesChart() {
  const [dados, setDados] = useState<Dia[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("vendas")
      .select("data_venda, faturamento")
      .order("data_venda", { ascending: true });

    if (error) {
      console.error("Erro ao carregar gráfico de vendas:", error);
      setDados([]);
      setCarregando(false);
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dias: Dia[] = [];

    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);

      const chave = data.toISOString().split("T")[0];

      const valor = (data as Date) && (data.getTime(), 0);

      dias.push({
        data: chave,
        label: data.toLocaleDateString("pt-BR", {
          weekday: "short",
        }).replace(".", ""),
        valor,
      });
    }

    (data || []).forEach((venda: Venda) => {
      const chave = venda.data_venda.split("T")[0];

      const dia = dias.find((item) => item.data === chave);

      if (dia) {
        dia.valor += Number(venda.faturamento ?? 0);
      }
    });

    setDados(dias);
    setCarregando(false);
  }

  const maiorValor = Math.max(...dados.map((item) => item.valor), 1);

  const faturamentoTotal = dados.reduce(
    (total, item) => total + item.valor,
    0
  );

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-slate-900">
            Vendas
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Faturamento dos últimos 7 dias.
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
          <TrendingUp size={17} className="text-blue-600" />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium text-slate-400">
          Faturamento no período
        </p>

        <p className="mt-1 text-xl font-bold text-slate-900">
          {carregando ? "..." : formatarMoeda(faturamentoTotal)}
        </p>
      </div>

      <div className="mt-8 flex h-[190px] items-end gap-3">
        {carregando ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            Carregando...
          </div>
        ) : (
          dados.map((item) => {
            const altura =
              item.valor > 0
                ? Math.max((item.valor / maiorValor) * 100, 5)
                : 3;

            return (
              <div
                key={item.data}
                className="flex h-full flex-1 flex-col items-center justify-end"
              >
                <div className="mb-2 text-[10px] font-semibold text-slate-500">
                  {item.valor > 0 ? formatarMoeda(item.valor) : ""}
                </div>

                <div className="flex h-[140px] w-full items-end justify-center">
                  <div
                    className="w-full max-w-[42px] rounded-t-lg bg-[#071E49] transition-all duration-500 hover:bg-[#F47B20]"
                    style={{ height: `${altura}%` }}
                    title={formatarMoeda(item.valor)}
                  />
                </div>

                <span className="mt-2 text-[10px] font-medium capitalize text-slate-400">
                  {item.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
