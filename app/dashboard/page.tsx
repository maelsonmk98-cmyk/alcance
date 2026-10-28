
"use client";

import { useState } from "react";
import { BarChart3, CalendarDays } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import VendasCards from "@/components/dashboard/VendasCards";
import SalesChart from "@/components/dashboard/SalesChart";
import CategoryPerformance from "@/components/dashboard/CategoryPerformance";
import TopProducts from "@/components/dashboard/TopProducts";
import SalesChannels from "@/components/dashboard/SalesChannels";
import FinancialSummary from "@/components/dashboard/FinancialSummary";
import DateRangePicker from "@/components/dashboard/DateRangePicker";

function formatarDataInput(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function obterPeriodoInicial() {
  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - 6);
  return { inicio: formatarDataInput(inicio), fim: formatarDataInput(hoje) };
}

type PeriodoRapido = 7 | 30 | 90 | null;

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState(obterPeriodoInicial);
  const [periodoRapido, setPeriodoRapido] = useState<PeriodoRapido>(7);
  const { inicio: dataInicio, fim: dataFim } = periodo;

  function alterarPeriodo(inicio: string, fim: string) {
    setPeriodo({ inicio, fim });
    setPeriodoRapido(null);
  }

  function selecionarPeriodo(dias: 7 | 30 | 90) {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - dias + 1);
    setPeriodo({ inicio: formatarDataInput(inicio), fim: formatarDataInput(hoje) });
    setPeriodoRapido(dias);
  }

  return (
    <MainLayout fullWidth dark>
      <main className="relative min-h-full overflow-hidden bg-[#061426] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(ellipse_at_75%_0%,rgba(249,115,22,0.07),transparent_48%),radial-gradient(ellipse_at_12%_0%,rgba(37,99,235,0.08),transparent_55%)]" />
        <div className="relative mx-auto w-full max-w-[1920px] space-y-4 px-4 py-5 lg:px-6 xl:px-7">
          <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-300/80">Visão geral do negócio</p>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400"><BarChart3 size={23} strokeWidth={2.5} /></div>
                <h1 className="text-[25px] font-bold leading-tight tracking-[-0.04em] sm:text-[29px]">Dashboard de Vendas</h1>
              </div>
              <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-slate-400">Acompanhe vendas, faturamento, receita líquida, investimentos, custos, lucro, margem e ROI com dados reais.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-h-10 items-center gap-2 rounded-xl border border-[#203854] bg-[#0C2039] px-2 text-slate-300">
                <CalendarDays size={16} className="shrink-0 text-slate-400" />
                <DateRangePicker dataInicio={dataInicio} dataFim={dataFim} onChange={alterarPeriodo} />
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-[#203854] bg-[#0C2039] p-1">
                {([7, 30, 90] as const).map((dias) => (
                  <button key={dias} type="button" onClick={() => selecionarPeriodo(dias)} aria-pressed={periodoRapido === dias}
                    className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition-all ${periodoRapido === dias ? "bg-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.25)]" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                    {dias} dias
                  </button>
                ))}
              </div>
            </div>
          </header>

          <section aria-label="Indicadores financeiros" className="min-w-0">
            <VendasCards dataInicio={dataInicio} dataFim={dataFim} />
          </section>

          <section aria-label="Visão de faturamento e canais" className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
            <div className="min-w-0 [&>div]:h-full [&>div]:min-h-[315px]">
              <SalesChart dataInicio={dataInicio} dataFim={dataFim} />
            </div>
            <div className="min-w-0">
              <SalesChannels dataInicio={dataInicio} dataFim={dataFim} />
            </div>
          </section>

          <section aria-label="Análises complementares" className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            <div className="min-w-0 [&>div]:h-full"><TopProducts dataInicio={dataInicio} dataFim={dataFim} /></div>
            <div className="min-w-0 [&>div]:h-full"><CategoryPerformance dataInicio={dataInicio} dataFim={dataFim} /></div>
            <div className="min-w-0 lg:col-span-2 2xl:col-span-1"><FinancialSummary dataInicio={dataInicio} dataFim={dataFim} /></div>
          </section>
          <div className="h-2" />
        </div>
      </main>
    </MainLayout>
  );
}
