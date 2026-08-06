"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  BarChart3,
  Wallet,
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
    async function carregarVendas() {
      const { data, error } = await supabase
        .from("vendas")
        .select("quantidade, faturamento, custo_total, lucro");

      if (error) {
        console.error("Erro ao carregar vendas:", error);
        setVendas([]);
      } else {
        setVendas(data || []);
      }

      setCarregando(false);
    }

    carregarVendas();
  }, []);

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  /*
   * ============================================================
   * INDICADORES
   * ============================================================
   */

  // Quantidade total de unidades vendidas
  const quantidadeVendida = vendas.reduce(
    (total, venda) =>
      total + Number(venda.quantidade ?? 0),
    0
  );

  // Faturamento total
  const faturamento = vendas.reduce(
    (total, venda) =>
      total + Number(venda.faturamento ?? 0),
    0
  );

  // Custo dos produtos vendidos
  const custoTotal = vendas.reduce(
    (total, venda) =>
      total + Number(venda.custo_total ?? 0),
    0
  );

  // Lucro líquido
  const lucroLiquido = vendas.reduce(
    (total, venda) =>
      total + Number(venda.lucro ?? 0),
    0
  );

  // Margem geral das vendas
  const margemMedia =
    faturamento > 0
      ? (lucroLiquido / faturamento) * 100
      : 0;

  // ROI geral
  const roi =
    custoTotal > 0
      ? (lucroLiquido / custoTotal) * 100
      : 0;

  /*
   * ============================================================
   * CARDS
   * ============================================================
   */

  const cards = [
    {
      title: "Produtos Vendidos",
      value: quantidadeVendida.toLocaleString("pt-BR"),
      description: "Unidades vendidas",
      icon: ShoppingCart,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Faturamento",
      value: formatarMoeda(faturamento),
      description: "Valor total das vendas",
      icon: DollarSign,
      iconBg: "bg-[#071E49]/[0.06]",
      iconColor: "text-[#071E49]",
    },
    {
      title: "Custo das Vendas",
      value: formatarMoeda(custoTotal),
      description: "Investimento nos produtos vendidos",
      icon: Wallet,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Lucro Líquido",
      value: formatarMoeda(lucroLiquido),
      description: "Resultado das vendas",
      icon: TrendingUp,
      iconBg: "bg-[#F47B20]/10",
      iconColor: "text-[#F47B20]",
    },
    {
      title: "ROI",
      value: `${roi.toFixed(2)}%`,
      description: "Retorno sobre o investimento",
      icon: BarChart3,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_30px_rgba(15,23,42,0.07)]"
          >
            <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-slate-50 opacity-60 transition-transform duration-300 group-hover:scale-150" />

            <div className="relative flex items-start justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon
                  size={20}
                  strokeWidth={2}
                  className={card.iconColor}
                />
              </div>
            </div>

            <div className="relative mt-5">
              <p className="text-[12px] font-medium text-slate-500">
                {card.title}
              </p>

              <h2 className="mt-1.5 text-[24px] font-bold tracking-[-0.025em] text-slate-900">
                {carregando ? "..." : card.value}
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}