
"use client";

import { useState } from "react";

import MainLayout from "@/components/layout/MainLayout";

import VendasCards from "@/components/dashboard/VendasCards";
import SalesChart from "@/components/dashboard/SalesChart";
import CategoryPerformance from "@/components/dashboard/CategoryPerformance";
import TopProducts from "@/components/dashboard/TopProducts";
import MarginRoiChart from "@/components/dashboard/MarginRoiChart";
import AdsConversion from "@/components/dashboard/AdsConversion";
import DateRangePicker from "@/components/dashboard/DateRangePicker";

// Formata a data no padrão YYYY-MM-DD,
// utilizando o horário local do usuário.
function formatarDataInput(data: Date): string {
  const ano = data.getFullYear();

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

// Período inicial: últimos 7 dias,
// incluindo o dia atual.
function obterPeriodoInicial() {
  const hoje = new Date();
  const inicio = new Date(hoje);

  inicio.setDate(hoje.getDate() - 6);

  return {
    inicio: formatarDataInput(inicio),
    fim: formatarDataInput(hoje),
  };
}

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState(
    obterPeriodoInicial
  );

  const dataInicio = periodo.inicio;
  const dataFim = periodo.fim;

  // Atualiza o período de todos os
  // indicadores e gráficos do Dashboard.
  function alterarPeriodo(
    inicio: string,
    fim: string
  ) {
    setPeriodo({
      inicio,
      fim,
    });
  }

  return (
    <MainLayout fullWidth dark>
      <main className="min-h-full bg-[radial-gradient(circle_at_top,#0d203c_0%,#07111f_42%,#050b14_100%)] text-white">
        <div className="mx-auto w-full max-w-[1920px] px-4 py-4 lg:px-6 xl:px-7">

          {/* CABEÇALHO DO DASHBOARD */}
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[23px] font-bold leading-tight tracking-[-0.035em] text-white">
                  Dashboard de Vendas
                </h1>

                <span
                  className="text-[17px]"
                  aria-hidden="true"
                >
                  ⚡
                </span>
              </div>

              <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-slate-400">
                Acompanhe suas vendas, faturamento,
                receita líquida, investimentos, custos,
                lucro, margem e ROI em tempo real.
              </p>
            </div>

            {/* FILTRO DE PERÍODO */}
            <div className="shrink-0">
              <DateRangePicker
                dataInicio={dataInicio}
                dataFim={dataFim}
                onChange={alterarPeriodo}
              />
            </div>
          </div>

          {/* INDICADORES FINANCEIROS

              1. Produtos Vendidos
              2. Faturamento
              3. Receita Líquida
              4. Valor Investido
              5. Custo das Vendas
              6. Lucro Líquido
              7. ROI
              8. Margem Média

              O layout dos oito cards é
              controlado pelo VendasCards.tsx.

              O cálculo corrigido da comissão
              também está no VendasCards.tsx.
          */}
          <section
            aria-label="Indicadores financeiros"
            className="mb-4 w-full min-w-0"
          >
            <VendasCards
              dataInicio={dataInicio}
              dataFim={dataFim}
            />
          </section>

          {/* GRÁFICOS PRINCIPAIS

              Em telas grandes:
              Faturamento ocupa mais espaço
              que Desempenho por Categoria.

              Não aplicar grid-cols-8 aqui.
          */}
          <section
            aria-label="Gráficos principais"
            className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.72fr)_minmax(0,1fr)]"
          >

            {/* GRÁFICO DE FATURAMENTO */}
            <div className="min-w-0 [&>div]:h-[285px]">
              <SalesChart
                dataInicio={dataInicio}
                dataFim={dataFim}
              />
            </div>

            {/* DESEMPENHO POR CATEGORIA */}
            <div className="min-w-0 [&>div]:h-[285px]">
              <CategoryPerformance
                dataInicio={dataInicio}
                dataFim={dataFim}
              />
            </div>

          </section>

          {/* GRÁFICOS INFERIORES */}
          <section
            aria-label="Análises complementares"
            className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]"
          >

            {/* PRODUTOS MAIS VENDIDOS */}
            <div className="min-w-0 [&>div]:h-[230px]">
              <TopProducts
                dataInicio={dataInicio}
                dataFim={dataFim}
              />
            </div>

            {/* MARGEM E ROI */}
            <div className="min-w-0 [&>div]:h-[230px]">
              <MarginRoiChart
                dataInicio={dataInicio}
                dataFim={dataFim}
              />
            </div>

            {/* CONVERSÃO DE ANÚNCIOS */}
            <div className="min-w-0 [&>div]:h-[230px]">
              <AdsConversion />
            </div>

          </section>

          <div className="h-3" />

        </div>
      </main>
    </MainLayout>
  );
}
