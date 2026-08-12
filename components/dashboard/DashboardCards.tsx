"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Boxes,
  TrendingUp,
  DollarSign,
  Wallet,
  Percent,
  ArrowUpRight,
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
      const { data, error } = await supabase
        .from("produtos")
        .select(
          "sku, estoque, custo, preco_venda, comissao, impostos, embalagem, frete, outras_despesas, acos, promocao"
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
    const acos = Number(produto.acos ?? 0);
    const promocao = Number(produto.promocao ?? 0);

    const valorComissao = venda * (comissao / 100);
    const valorImpostos = venda * (impostos / 100);
    const valorAcos = venda * (acos / 100);
    const valorPromocao = venda * (promocao / 100);

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

  // ============================================================
  // QUANTIDADES
  // ============================================================

  const skus = new Set(
    produtos
      .map((produto) => produto.sku?.trim())
      .filter((sku) => sku)
  );

  const totalSkus = skus.size;

  const totalProdutos = produtos.reduce(
    (total, produto) => total + Number(produto.estoque ?? 0),
    0
  );

  // ============================================================
  // CÁLCULOS FINANCEIROS
  // ============================================================

  const valorInvestido = produtos.reduce((total, produto) => {
    const custo = Number(produto.custo ?? 0);
    const quantidade = Number(produto.estoque ?? 0);

    return total + custo * quantidade;
  }, 0);

  const faturamento = produtos.reduce((total, produto) => {
    const venda = Number(produto.preco_venda ?? 0);
    const quantidade = Number(produto.estoque ?? 0);

    return total + venda * quantidade;
  }, 0);

  const lucroLiquido = produtos.reduce((total, produto) => {
    const quantidade = Number(produto.estoque ?? 0);
    const lucroUnitario = calcularLucro(produto);

    return total + lucroUnitario * quantidade;
  }, 0);

  const margemMedia =
    faturamento > 0 ? (lucroLiquido / faturamento) * 100 : 0;

  const roi =
    valorInvestido > 0 ? (lucroLiquido / valorInvestido) * 100 : 0;

  // ============================================================
  // CARDS
  // ============================================================

  const cards = [
    {
      title: "SKUs Cadastrados",
      value: carregando ? "..." : totalSkus.toString(),
      description: "Produtos diferentes cadastrados",
      icon: Package,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
      glow: "group-hover:shadow-blue-500/10",
      accent: "from-blue-500/10",
    },
    {
      title: "Produtos em Estoque",
      value: carregando
        ? "..."
        : totalProdutos.toLocaleString("pt-BR"),
      description: "Unidades disponíveis em estoque",
      icon: Boxes,
      iconBg: "bg-cyan-500/15",
      iconColor: "text-cyan-400",
      glow: "group-hover:shadow-cyan-500/10",
      accent: "from-cyan-500/10",
    },
    {
      title: "Valor Investido",
      value: carregando ? "..." : formatarMoeda(valorInvestido),
      description: "Capital aplicado no estoque",
      icon: Wallet,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-400",
      glow: "group-hover:shadow-amber-500/10",
      accent: "from-amber-500/10",
    },
    {
      title: "Lucro Líquido",
      value: carregando ? "..." : formatarMoeda(lucroLiquido),
      description: "Lucro estimado sobre o estoque",
      icon: DollarSign,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      glow: "group-hover:shadow-emerald-500/10",
      accent: "from-emerald-500/10",
    },
    {
      title: "ROI",
      value: carregando ? "..." : `${roi.toFixed(2)}%`,
      description: "Retorno sobre investimento",
      icon: Percent,
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-400",
      glow: "group-hover:shadow-violet-500/10",
      accent: "from-violet-500/10",
    },
    {
      title: "Margem Média",
      value: carregando ? "..." : `${margemMedia.toFixed(2)}%`,
      description: "Margem média dos produtos",
      icon: TrendingUp,
      iconBg: "bg-[#F47B20]/15",
      iconColor: "text-[#F47B20]",
      glow: "group-hover:shadow-orange-500/10",
      accent: "from-orange-500/10",
    },
    {
      title: "Faturamento Potencial",
      value: carregando ? "..." : formatarMoeda(faturamento),
      description: "Valor potencial do estoque",
      icon: Wallet,
      iconBg: "bg-indigo-500/15",
      iconColor: "text-indigo-400",
      glow: "group-hover:shadow-indigo-500/10",
      accent: "from-indigo-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
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
              shadow-[0_8px_30px_rgba(0,0,0,0.18)]
              transition-all
              duration-300
              hover:-translate-y-1
              hover:border-slate-600
              hover:shadow-2xl
              ${card.glow}
            `}
          >
            {/* Glow superior */}
            <div
              className={`
                pointer-events-none
                absolute
                inset-x-0
                top-0
                h-24
                bg-gradient-to-b
                ${card.accent}
                to-transparent
                opacity-80
              `}
            />

            {/* Brilho lateral */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/[0.025] blur-2xl transition-all duration-300 group-hover:bg-white/[0.05]" />

            <div className="relative flex h-full flex-col justify-between">
              <div>
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
                      size={21}
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

                <p className="mt-5 text-[12px] font-medium text-slate-400">
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
                  {card.value}
                </h2>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                <p className="text-[10px] text-slate-500">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}