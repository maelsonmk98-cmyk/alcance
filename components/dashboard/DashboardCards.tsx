"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Boxes,
  TrendingUp,
  DollarSign,
  Wallet,
  Percent,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Produto = {
  sku: string | null;
  estoque: number | null;
  custo: number | null;
  preco_venda: number | null;
  comissao: number | null;
  impostos: number | null;
  embalagem: number | null;
  frete: number | null;
  outras_despesas: number | null;
  acos: number | null;
  promocao: number | null;
};

export default function DashboardCards() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setProdutos([]);
          return;
        }

        const { data, error } = await supabase
          .from("produtos")
          .select(
            "sku, estoque, custo, preco_venda, comissao, impostos, embalagem, frete, outras_despesas, acos, promocao"
          )
          .eq("user_id", user.id);

        if (error) {
          console.error(
            "Erro ao carregar produtos do dashboard:",
            error
          );
          setProdutos([]);
          return;
        }

        setProdutos(data || []);
      } catch (error) {
        console.error(
          "Erro inesperado ao carregar dashboard:",
          error
        );
        setProdutos([]);
      } finally {
        setCarregando(false);
      }
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
    const outrasDespesas = Number(
      produto.outras_despesas ?? 0
    );

    const acos = Number(produto.acos ?? 0);
    const promocao = Number(produto.promocao ?? 0);

    const valorComissao =
      venda * (comissao / 100);

    const valorImpostos =
      venda * (impostos / 100);

    const valorAcos =
      venda * (acos / 100);

    const valorPromocao =
      venda * (promocao / 100);

    return (
      venda -
      custo -
      valorComissao -
      valorImpostos -
      embalagem -
      frete -
      outrasDespesas -
      valorAcos -
      valorPromocao
    );
  }

  // ============================
  // QUANTIDADES
  // ============================

  const skus = new Set(
    produtos
      .map((produto) => produto.sku?.trim())
      .filter(Boolean)
  );

  const totalSkus = skus.size;

  const totalProdutos = produtos.reduce(
    (total, produto) =>
      total + Number(produto.estoque ?? 0),
    0
  );

  // ============================
  // FINANCEIRO
  // ============================

  const valorInvestido = produtos.reduce(
    (total, produto) => {
      const custo = Number(produto.custo ?? 0);
      const quantidade = Number(
        produto.estoque ?? 0
      );

      return total + custo * quantidade;
    },
    0
  );

  const faturamento = produtos.reduce(
    (total, produto) => {
      const venda = Number(
        produto.preco_venda ?? 0
      );

      const quantidade = Number(
        produto.estoque ?? 0
      );

      return total + venda * quantidade;
    },
    0
  );

  const lucroLiquido = produtos.reduce(
    (total, produto) => {
      const quantidade = Number(
        produto.estoque ?? 0
      );

      return (
        total +
        calcularLucro(produto) * quantidade
      );
    },
    0
  );

  const margemMedia =
    faturamento > 0
      ? (lucroLiquido / faturamento) * 100
      : 0;

  const roi =
    valorInvestido > 0
      ? (lucroLiquido / valorInvestido) * 100
      : 0;

  // ============================
  // CARDS
  // ============================

  const cards = [
    {
      title: "SKUs Cadastrados",
      value: totalSkus.toLocaleString("pt-BR"),
      variation: "12,5%",
      icon: Package,
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      lineColor: "#3b82f6",
    },
    {
      title: "Produtos em Estoque",
      value: totalProdutos.toLocaleString("pt-BR"),
      variation: "8,3%",
      icon: Boxes,
      iconBg: "bg-cyan-500/20",
      iconColor: "text-cyan-400",
      lineColor: "#22d3ee",
    },
    {
      title: "Valor Investido",
      value: formatarMoeda(valorInvestido),
      variation: "15,7%",
      icon: Wallet,
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-400",
      lineColor: "#f59e0b",
    },
    {
      title: "Lucro Líquido",
      value: formatarMoeda(lucroLiquido),
      variation: "22,4%",
      icon: DollarSign,
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
      lineColor: "#10b981",
    },
    {
      title: "ROI",
      value: `${roi.toFixed(2)}%`,
      variation: "18,3%",
      icon: Percent,
      iconBg: "bg-violet-500/20",
      iconColor: "text-violet-400",
      lineColor: "#a855f7",
    },
    {
      title: "Margem Média",
      value: `${margemMedia.toFixed(2)}%`,
      variation: "6,1%",
      icon: TrendingUp,
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-400",
      lineColor: "#f97316",
    },
    {
      title: "Faturamento Potencial",
      value: formatarMoeda(faturamento),
      variation: "14,3%",
      icon: Wallet,
      iconBg: "bg-indigo-500/20",
      iconColor: "text-indigo-400",
      lineColor: "#6366f1",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
      {cards.map((card, index) => {
        const Icon = card.icon;

        const pontos = [
          "2,31 12,25 22,28 30,19 40,23 50,15 60,20 70,13 80,18 90,8 98,11 108,5",
          "2,30 12,29 22,25 30,28 40,17 50,22 60,12 70,19 80,9 90,14 100,5 108,9",
          "2,31 12,28 22,25 30,17 40,23 50,12 60,18 70,7 80,15 90,5 100,11 108,3",
          "2,31 12,30 22,23 30,26 40,16 50,22 60,11 70,17 80,8 90,14 100,5 108,2",
          "2,30 12,29 22,25 30,17 40,21 50,12 60,19 70,8 80,13 90,5 100,10 108,3",
          "2,31 12,28 22,25 30,19 40,23 50,13 60,18 70,9 80,14 90,6 100,11 108,3",
          "2,30 12,27 22,29 30,18 40,22 50,13 60,17 70,8 80,15 90,5 100,10 108,2",
        ];

        return (
          <div
            key={card.title}
            className="
              group
              relative
              h-[174px]
              overflow-hidden
              rounded-[14px]
              border
              border-[#233754]
              bg-[#0d1b2f]
              px-3.5
              py-3
              shadow-[0_8px_24px_rgba(0,0,0,0.16)]
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:border-[#345078]
            "
          >
            {/* brilho superior */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-blue-500/[0.035] to-transparent" />

            <div className="relative flex h-full flex-col">
              {/* Ícone + título */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-[9px]
                    border
                    border-white/[0.04]
                    ${card.iconBg}
                  `}
                >
                  <Icon
                    size={15}
                    strokeWidth={2}
                    className={card.iconColor}
                  />
                </div>

                <p className="min-w-0 text-[9px] font-medium leading-tight text-slate-400">
                  {card.title}
                </p>
              </div>

              {/* Valor */}
              <h2 className="mt-3 truncate text-[20px] font-bold leading-none tracking-[-0.04em] text-white">
                {carregando ? "..." : card.value}
              </h2>

              {/* Variação */}
              <div className="mt-2 flex items-center gap-1">
                <TrendingUp
                  size={10}
                  className="text-emerald-400"
                />

                <span className="text-[8px] font-semibold text-emerald-400">
                  {card.variation}
                </span>
              </div>

              <p className="mt-0.5 text-[7px] text-slate-600">
                vs. período anterior
              </p>

              {/* Mini gráfico */}
              <div className="mt-auto h-[34px] w-full">
                <svg
                  viewBox="0 0 110 34"
                  preserveAspectRatio="none"
                  className="h-full w-full overflow-visible"
                >
                  <defs>
                    <linearGradient
                      id={`gradient-${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={card.lineColor}
                        stopOpacity="0.28"
                      />

                      <stop
                        offset="100%"
                        stopColor={card.lineColor}
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>

                  <polygon
                    points={`2,34 ${pontos[index]} 108,34`}
                    fill={`url(#gradient-${index})`}
                  />

                  <polyline
                    points={pontos[index]}
                    fill="none"
                    stroke={card.lineColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}