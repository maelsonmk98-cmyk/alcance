"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Produto = {
  estoque: number | null;
  custo: number | null;
  preco_venda: number | null;
  comissao: number | null;
  impostos: number | null;
  embalagem: number | null;
  frete: number | null;
  outras_despesas: number | null;
};

type Faixa = {
  label: string;
  quantidade: number;
  percentual: number;
  barra: string;
  ponto: string;
};

export default function MarginChart() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarProdutos() {
      const { data, error } = await supabase
        .from("produtos")
        .select(
          "estoque, custo, preco_venda, comissao, impostos, embalagem, frete, outras_despesas"
        );

      if (error) {
        console.error(
          "Erro ao carregar produtos para o gráfico:",
          error
        );
        setProdutos([]);
      } else {
        setProdutos(data || []);
      }

      setCarregando(false);
    }

    carregarProdutos();
  }, []);

  function calcularMargem(produto: Produto) {
    const custo = Number(produto.custo ?? 0);
    const venda = Number(produto.preco_venda ?? 0);
    const comissao = Number(produto.comissao ?? 0);
    const impostos = Number(produto.impostos ?? 0);
    const embalagem = Number(produto.embalagem ?? 0);
    const frete = Number(produto.frete ?? 0);
    const outras = Number(produto.outras_despesas ?? 0);

    if (venda <= 0) return 0;

    const lucro =
      venda -
      custo -
      venda * (comissao / 100) -
      venda * (impostos / 100) -
      embalagem -
      frete -
      outras;

    return (lucro / venda) * 100;
  }

  /*
   * ============================================================
   * DISTRIBUIÇÃO POR QUANTIDADE DE PRODUTOS
   * ============================================================
   *
   * Cada SKU pode possuir várias unidades em estoque.
   *
   * Exemplo:
   *
   * SKU A = 10 unidades com margem de 25%
   *
   * As 10 unidades entram na faixa de 20% a 30%.
   *
   * Não contamos apenas 1 SKU.
   */

  let totalProdutos = 0;
  let acima30 = 0;
  let entre20e30 = 0;
  let entre10e20 = 0;
  let abaixo10 = 0;

  produtos.forEach((produto) => {
    const quantidade = Math.max(
      0,
      Number(produto.estoque ?? 0)
    );

    const margem = calcularMargem(produto);

    totalProdutos += quantidade;

    if (margem > 30) {
      acima30 += quantidade;
    } else if (margem >= 20) {
      entre20e30 += quantidade;
    } else if (margem >= 10) {
      entre10e20 += quantidade;
    } else {
      abaixo10 += quantidade;
    }
  });

  const percentualAcima30 =
    totalProdutos === 0
      ? 0
      : (acima30 / totalProdutos) * 100;

  const percentualEntre20e30 =
    totalProdutos === 0
      ? 0
      : (entre20e30 / totalProdutos) * 100;

  const percentualEntre10e20 =
    totalProdutos === 0
      ? 0
      : (entre10e20 / totalProdutos) * 100;

  const percentualAbaixo10 =
    totalProdutos === 0
      ? 0
      : (abaixo10 / totalProdutos) * 100;

  /*
   * ============================================================
   * GRÁFICO CIRCULAR
   * ============================================================
   */

  const raio = 55;
  const circunferencia = 2 * Math.PI * raio;

  const offset =
    circunferencia -
    (percentualAcima30 / 100) * circunferencia;

  /*
   * ============================================================
   * FAIXAS
   * ============================================================
   */

  const faixas: Faixa[] = [
    {
      label: "Acima de 30%",
      quantidade: acima30,
      percentual: percentualAcima30,
      barra: "bg-emerald-500",
      ponto: "bg-emerald-500",
    },
    {
      label: "Entre 20% e 30%",
      quantidade: entre20e30,
      percentual: percentualEntre20e30,
      barra: "bg-blue-500",
      ponto: "bg-blue-500",
    },
    {
      label: "Entre 10% e 20%",
      quantidade: entre10e20,
      percentual: percentualEntre10e20,
      barra: "bg-orange-500",
      ponto: "bg-orange-500",
    },
    {
      label: "Abaixo de 10%",
      quantidade: abaixo10,
      percentual: percentualAbaixo10,
      barra: "bg-red-500",
      ponto: "bg-red-500",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
      {/* CABEÇALHO */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-slate-900">
            Margem por Faixa
          </h2>

          <p className="mt-1 text-[12px] text-slate-500">
            Distribuição das margens por quantidade de produtos.
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
          <TrendingUp
            size={17}
            strokeWidth={2}
            className="text-emerald-600"
          />
        </div>
      </div>

      {/* GRÁFICO CIRCULAR */}
      <div className="flex justify-center py-7">
        <div className="relative h-36 w-36">
          <svg
            width="144"
            height="144"
            viewBox="0 0 144 144"
            className="-rotate-90"
          >
            <circle
              cx="72"
              cy="72"
              r={raio}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />

            <circle
              cx="72"
              cy="72"
              r={raio}
              fill="none"
              stroke="#10b981"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circunferencia}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset .6s ease",
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[29px] font-bold text-slate-900">
              {carregando
                ? "..."
                : `${percentualAcima30.toFixed(0)}%`}
            </p>

            <p className="text-[11px] text-slate-500">
              acima de 30%
            </p>
          </div>
        </div>
      </div>

      {/* FAIXAS */}
      <div className="space-y-4">
        {faixas.map((faixa) => (
          <div key={faixa.label}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${faixa.ponto}`}
                />

                <span className="text-sm text-slate-600">
                  {faixa.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {carregando
                    ? "..."
                    : faixa.quantidade.toLocaleString("pt-BR")}
                </span>

                <span className="text-xs text-slate-400">
                  {carregando
                    ? ""
                    : `(${faixa.percentual.toFixed(0)}%)`}
                </span>
              </div>
            </div>

            <div className="h-2 rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${faixa.barra}`}
                style={{
                  width: `${faixa.percentual}%`,
                  transition: "width .6s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* RODAPÉ */}
      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400">
          Baseado em{" "}
          {carregando
            ? "..."
            : totalProdutos.toLocaleString("pt-BR")}{" "}
          unidades em estoque
        </p>
      </div>
    </div>
  );
}