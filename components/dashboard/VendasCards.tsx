"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  BarChart3,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Venda = {
  quantidade: number | null;
  faturamento: number | null;
  custo_total: number | null;
  lucro: number | null;
};

export default function VendasCards() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarVendas();
  }, []);

  async function carregarVendas() {
    setCarregando(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setVendas([]);
        return;
      }

      const { data, error } = await supabase
        .from("vendas")
        .select("quantidade, faturamento, custo_total, lucro")
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao carregar vendas:", error);
        setVendas([]);
        return;
      }

      setVendas(data || []);
    } catch (error) {
      console.error("Erro inesperado ao carregar vendas:", error);
      setVendas([]);
    } finally {
      setCarregando(false);
    }
  }

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const quantidadeVendida = vendas.reduce(
    (total, venda) => total + Number(venda.quantidade ?? 0),
    0
  );

  const faturamento = vendas.reduce(
    (total, venda) => total + Number(venda.faturamento ?? 0),
    0
  );

  const custoTotal = vendas.reduce(
    (total, venda) => total + Number(venda.custo_total ?? 0),
    0
  );

  const lucroLiquido = vendas.reduce(
    (total, venda) => total + Number(venda.lucro ?? 0),
    0
  );

  const roi =
    custoTotal > 0
      ? (lucroLiquido / custoTotal) * 100
      : 0;

  const margem =
    faturamento > 0
      ? (lucroLiquido / faturamento) * 100
      : 0;

  const cards = [
    {
      title: "Produtos Vendidos",
      value: quantidadeVendida.toLocaleString("pt-BR"),
      description: "Unidades vendidas",
      icon: ShoppingCart,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
      borderHover: "hover:border-blue-500/30",
      glow: "hover:shadow-blue-500/10",
    },
    {
      title: "Faturamento",
      value: formatarMoeda(faturamento),
      description: "Valor total das vendas",
      icon: DollarSign,
      iconBg: "bg-cyan-500/15",
      iconColor: "text-cyan-400",
      borderHover: "hover:border-cyan-500/30",
      glow: "hover:shadow-cyan-500/10",
    },
    {
      title: "Custo das Vendas",
      value: formatarMoeda(custoTotal),
      description: "Custos das vendas realizadas",
      icon: Wallet,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-400",
      borderHover: "hover:border-amber-500/30",
      glow: "hover:shadow-amber-500/10",
    },
    {
      title: "Lucro Líquido",
      value: formatarMoeda(lucroLiquido),
      description: "Resultado das vendas",
      icon: TrendingUp,
      iconBg:
        lucroLiquido >= 0
          ? "bg-emerald-500/15"
          : "bg-red-500/15",
      iconColor:
        lucroLiquido >= 0
          ? "text-emerald-400"
          : "text-red-400",
      borderHover:
        lucroLiquido >= 0
          ? "hover:border-emerald-500/30"
          : "hover:border-red-500/30",
      glow:
        lucroLiquido >= 0
          ? "hover:shadow-emerald-500/10"
          : "hover:shadow-red-500/10",
    },
    {
      title: "ROI",
      value: `${roi.toFixed(2)}%`,
      description: "Retorno sobre os custos",
      icon: BarChart3,
      iconBg:
        roi >= 0
          ? "bg-violet-500/15"
          : "bg-red-500/15",
      iconColor:
        roi >= 0
          ? "text-violet-400"
          : "text-red-400",
      borderHover:
        roi >= 0
          ? "hover:border-violet-500/30"
          : "hover:border-red-500/30",
      glow:
        roi >= 0
          ? "hover:shadow-violet-500/10"
          : "hover:shadow-red-500/10",
    },
    {
      title: "Margem Média",
      value: `${margem.toFixed(2)}%`,
      description: "Lucro sobre o faturamento",
      icon: TrendingUp,
      iconBg:
        margem >= 0
          ? "bg-[#F47B20]/15"
          : "bg-red-500/15",
      iconColor:
        margem >= 0
          ? "text-[#F47B20]"
          : "text-red-400",
      borderHover:
        margem >= 0
          ? "hover:border-[#F47B20]/30"
          : "hover:border-red-500/30",
      glow:
        margem >= 0
          ? "hover:shadow-orange-500/10"
          : "hover:shadow-red-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`
              group
              relative
              min-h-[172px]
              overflow-hidden
              rounded-2xl
              border
              border-slate-700/60
              bg-[#0d1a2d]
              p-5
              shadow-[0_12px_35px_rgba(0,0,0,0.18)]
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-2xl
              ${card.borderHover}
              ${card.glow}
            `}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.025] to-transparent" />

            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/[0.02] blur-2xl transition-all duration-300 group-hover:bg-white/[0.05]" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div
                  className={`
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-white/[0.04]
                    ${card.iconBg}
                  `}
                >
                  <Icon
                    size={20}
                    strokeWidth={2}
                    className={card.iconColor}
                  />
                </div>

                <div
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-slate-700/60
                    bg-[#111f34]
                    text-slate-500
                    transition-all
                    duration-300
                    group-hover:border-slate-600
                    group-hover:text-slate-300
                  "
                >
                  <ArrowUpRight size={15} />
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[12px] font-medium text-slate-400">
                  {card.title}
                </p>

                <h2
                  className="
                    mt-1.5
                    truncate
                    text-[23px]
                    font-bold
                    tracking-[-0.025em]
                    text-white
                  "
                >
                  {carregando ? "..." : card.value}
                </h2>

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      card.title === "Lucro Líquido" && lucroLiquido < 0
                        ? "bg-red-400"
                        : card.title === "ROI" && roi < 0
                        ? "bg-red-400"
                        : card.title === "Margem Média" && margem < 0
                        ? "bg-red-400"
                        : "bg-emerald-400"
                    }`}
                  />

                  <p className="text-[10px] text-slate-500">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}