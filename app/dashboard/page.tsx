
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

function formatarDataInput(data: Date) {
  const ano = data.getFullYear();

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

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
      <div className="min-h-full bg-[radial-gradient(circle_at_top,#0d203c_0%,#07111f_42%,#050b14_100%)] text-white">
        <div className="mx-auto w-full max-w-[1920px] px-5 py-3 lg:px-6 xl:px-7">

          {/* CABEÇALHO */}
          <div className="mb-2.5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[23px] font-bold leading-tight tracking-[-0.035em] text-white">
                  Dashboard de Vendas
                </h1>

                <span className="text-[17px]">
                  ⚡
                </span>
              </div>

              <p className="mt-0.5 text-[9px] text-slate-500">
                Acompanhe suas vendas, faturamento,
                receita líquida, investimentos, custos,
                lucro, margem e ROI em tempo real.
              </p>
            </div>

            {/* FILTRO DE PERÍODO */}
            <DateRangePicker
              dataInicio={dataInicio}
              dataFim={dataFim}
              onChange={alterarPeriodo}
            />
          </div>

          {/* INDICADORES FINANCEIROS */}
          {/*
            O componente VendasCards deverá conter:

            1. Produtos Vendidos
            2. Faturamento
            3. Receita Líquida
            4. Valor Investido
            5. Custo das Vendas
            6. Lucro Líquido
            7. ROI
            8. Margem Média

            Os valores continuam sendo carregados
            pelo próprio componente VendasCards.
          */}
          <div className="mb-2.5 w-full">
            <VendasCards
              dataInicio={dataInicio}
              dataFim={dataFim}
            />
          </div>

          {/* GRÁFICOS PRINCIPAIS */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-8">

            {/* FATURAMENTO */}
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
          </div>

          {/* GRÁFICOS INFERIORES */}
          <div className="mt-2.5 grid grid-cols-1 gap-2.5 xl:grid-cols-[1fr_1fr_1.2fr]">

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

            {/* CONVERSÃO DOS ANÚNCIOS */}
            <div className="min-w-0 [&>div]:h-[230px]">
              <AdsConversion />
            </div>
          </div>

          <div className="h-2" />
        </div>
      </div>
    </MainLayout>
  );
}
