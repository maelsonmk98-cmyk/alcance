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
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDados([]);
      setCarregando(false);
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - 6);

    const { data, error } = await supabase
      .from("vendas")
      .select("data_venda, faturamento")
      .eq("user_id", user.id)
      .gte("data_venda", inicio.toISOString())
      .order("data_venda", { ascending: true });

    if (error) {
      console.error("Erro ao carregar gráfico de vendas:", error);
      setDados([]);
      setCarregando(false);
      return;
    }

    const dias: Dia[] = [];

    for (let i = 6; i >= 0; i--) {
      const dataDia = new Date(hoje);
      dataDia.setDate(dataDia.getDate() - i);

      const chave = dataDia.toISOString().split("T")[0];

      dias.push({
        data: chave,
        label: dataDia
          .toLocaleDateString("pt-BR", {
            weekday: "short",
          })
          .replace(".", ""),
        valor: 0,
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
      {/* brilho superior */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-blue-500/[0.05] to-transparent" />

      <div className="relative">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[17px] font-bold tracking-tight text-white">
              Faturamento
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Desempenho dos últimos 7 dias.
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
              border-blue-500/10
              bg-blue-500/10
            "
          >
            <TrendingUp size={18} className="text-blue-400" />
          </div>
        </div>

        {/* Valor total */}
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Faturamento no período
            </p>

            <p className="mt-1 text-2xl font-bold tracking-tight text-white">
              {carregando ? "..." : formatarMoeda(faturamentoTotal)}
            </p>
          </div>

          {!carregando && faturamentoTotal > 0 && (
            <div
              className="
                flex
                items-center
                gap-1
                rounded-lg
                border
                border-emerald-500/10
                bg-emerald-500/10
                px-2.5
                py-1.5
                text-[11px]
                font-semibold
                text-emerald-400
              "
            >
              <TrendingUp size={12} />
              Últimos 7 dias
            </div>
          )}
        </div>

        {/* gráfico */}
        <div className="relative mt-8">
          {/* linhas horizontais */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[170px]">
            <div className="absolute top-0 w-full border-t border-dashed border-slate-700/50" />
            <div className="absolute top-1/4 w-full border-t border-dashed border-slate-700/40" />
            <div className="absolute top-2/4 w-full border-t border-dashed border-slate-700/40" />
            <div className="absolute top-3/4 w-full border-t border-dashed border-slate-700/40" />
            <div className="absolute bottom-0 w-full border-t border-slate-700/60" />
          </div>

          <div className="relative flex h-[215px] items-end gap-3">
            {carregando ? (
              <div className="flex h-full w-full items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
                  Carregando...
                </div>
              </div>
            ) : (
              dados.map((item, index) => {
                const altura =
                  item.valor > 0
                    ? Math.max((item.valor / maiorValor) * 100, 6)
                    : 2;

                const ativo = hoverIndex === index;

                return (
                  <div
                    key={item.data}
                    className="relative flex h-full flex-1 flex-col items-center justify-end"
                    onMouseEnter={() => setHoverIndex(index)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    {/* Tooltip */}
                    {ativo && (
                      <div
                        className="
                          absolute
                          bottom-[175px]
                          left-1/2
                          z-20
                          -translate-x-1/2
                          whitespace-nowrap
                          rounded-xl
                          border
                          border-slate-700
                          bg-[#07111f]
                          px-3
                          py-2
                          shadow-2xl
                        "
                      >
                        <p className="text-[10px] font-medium capitalize text-slate-400">
                          {item.label}
                        </p>

                        <p className="mt-0.5 text-xs font-bold text-white">
                          {formatarMoeda(item.valor)}
                        </p>

                        <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-slate-700 bg-[#07111f]" />
                      </div>
                    )}

                    {/* valor acima da barra */}
                    <div className="mb-2 min-h-[16px] text-center">
                      {item.valor > 0 && (
                        <span className="text-[9px] font-semibold text-slate-500">
                          {item.valor >= 1000
                            ? `R$ ${(item.valor / 1000)
                                .toFixed(1)
                                .replace(".", ",")}k`
                            : `R$ ${item.valor
                                .toFixed(0)
                                .replace(".", ",")}`}
                        </span>
                      )}
                    </div>

                    {/* barra */}
                    <div className="flex h-[150px] w-full items-end justify-center">
                      <div
                        className={`
                          relative
                          w-full
                          max-w-[44px]
                          overflow-hidden
                          rounded-t-lg
                          transition-all
                          duration-300
                          ${
                            ativo
                              ? "bg-blue-400 shadow-[0_0_22px_rgba(96,165,250,0.30)]"
                              : "bg-gradient-to-t from-blue-700 to-blue-500"
                          }
                        `}
                        style={{
                          height: `${altura}%`,
                        }}
                      >
                        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent" />
                      </div>
                    </div>

                    {/* dia */}
                    <span
                      className={`
                        mt-3
                        text-[10px]
                        font-medium
                        capitalize
                        transition-colors
                        ${
                          ativo
                            ? "text-blue-400"
                            : "text-slate-500"
                        }
                      `}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* rodapé */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-700/50 pt-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />

            <span className="text-[11px] text-slate-500">
              Faturamento diário
            </span>
          </div>

          <span className="text-[10px] text-slate-600">
            Atualizado em tempo real
          </span>
        </div>
      </div>
    </div>
  );
}