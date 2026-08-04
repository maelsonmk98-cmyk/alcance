"use client";

import { useEffect, useState } from "react";
import {
  Package,
  TrendingUp,
  DollarSign,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Produto = {
  custo: number | null;
  preco_venda: number | null;
  comissao: number | null;
  impostos: number | null;
  embalagem: number | null;
  frete: number | null;
  outras_despesas: number | null;
};

export default function DashboardCards() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarProdutos() {
      const { data, error } = await supabase
        .from("produtos")
        .select(
          "custo, preco_venda, comissao, impostos, embalagem, frete, outras_despesas"
        );

      if (error) {
        console.error("Erro ao carregar produtos do dashboard:", error);
        setProdutos([]);
      } else {
        setProdutos(data || []);
      }

      setCarregando(false);
    }

    carregarProdutos();
  }, []);

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function calcularLucro(produto: Produto) {
    const custo = Number(produto.custo ?? 0);
    const venda = Number(produto.preco_venda ?? 0);
    const comissao = Number(produto.comissao ?? 0);
    const impostos = Number(produto.impostos ?? 0);
    const embalagem = Number(produto.embalagem ?? 0);
    const frete = Number(produto.frete ?? 0);
    const outrasDespesas = Number(produto.outras_despesas ?? 0);

    const valorComissao = venda * (comissao / 100);
    const valorImpostos = venda * (impostos / 100);

    return (
      venda -
      custo -
      valorComissao -
      valorImpostos -
      embalagem -
      frete -
      outrasDespesas
    );
  }

  const totalProdutos = produtos.length;

  const faturamento = produtos.reduce(
    (total, produto) =>
      total + Number(produto.preco_venda ?? 0),
    0
  );

  const lucroLiquido = produtos.reduce(
    (total, produto) => total + calcularLucro(produto),
    0
  );

  const margemMedia =
    faturamento > 0
      ? (lucroLiquido / faturamento) * 100
      : 0;

  const cards = [
    {
      title: "Total de Produtos",
      value: carregando ? "..." : totalProdutos.toString(),
      description: "Produtos cadastrados",
      icon: Package,
      iconBg: "bg-[#071E49]/[0.06]",
      iconColor: "text-[#071E49]",
    },
    {
      title: "Margem Média",
      value: carregando ? "..." : `${margemMedia.toFixed(2)}%`,
      description: "Margem dos produtos",
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Lucro Líquido",
      value: carregando ? "..." : formatarMoeda(lucroLiquido),
      description: "Lucro acumulado",
      icon: DollarSign,
      iconBg: "bg-[#F47B20]/10",
      iconColor: "text-[#F47B20]",
    },
    {
      title: "Faturamento",
      value: carregando ? "..." : formatarMoeda(faturamento),
      description: "Faturamento total",
      icon: Wallet,
      iconBg: "bg-[#071E49]/[0.06]",
      iconColor: "text-[#071E49]",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-300 transition group-hover:bg-slate-100 group-hover:text-slate-500">
                <ArrowUpRight size={14} />
              </div>
            </div>

            <div className="relative mt-5">
              <p className="text-[12px] font-medium text-slate-500">
                {card.title}
              </p>

              <h2 className="mt-1.5 text-[24px] font-bold tracking-[-0.025em] text-slate-900">
                {card.value}
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
