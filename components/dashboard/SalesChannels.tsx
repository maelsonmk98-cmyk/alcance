
"use client";

import { useEffect, useMemo, useState } from "react";
import { PieChart, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = { dataInicio?: string; dataFim?: string };
type VendaCanal = { canal_venda: string | null; faturamento: number | null };
type Canal = { nome: string; valor: number; cor: string };
const CORES = ["#2563EB", "#F97316", "#FBBF24", "#10B981", "#8B5CF6", "#64748B"];
const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const porcentagem = (valor: number) => `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;

function dataLocal(valor: string, fim = false) {
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setHours(fim ? 23 : 0, fim ? 59 : 0, fim ? 59 : 0, fim ? 999 : 0);
  return data;
}

export default function SalesChannels({
  dataInicio,
  dataFim,
}: Props) {
  const [vendas, setVendas] = useState<VendaCanal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const { data: auth, error: erroAuth } = await supabase.auth.getUser();
        if (erroAuth) throw erroAuth;
        if (!auth.user) throw new Error("Usuário não autenticado.");
        const hoje = new Date();
        const inicio = dataInicio ? dataLocal(dataInicio) : new Date(hoje);
        const fim = dataFim ? dataLocal(dataFim, true) : new Date(hoje);
        if (!dataInicio) { inicio.setHours(0, 0, 0, 0); inicio.setDate(inicio.getDate() - 6); }
        if (!dataFim) fim.setHours(23, 59, 59, 999);
        if (inicio > fim) throw new Error("Período inválido.");
        const resultado: VendaCanal[] = [];
        const lote = 1000;
        for (let pagina = 0; ; pagina++) {
          const { data, error } = await supabase.from("vendas")
            .select("canal_venda,faturamento")
            .eq("user_id", auth.user.id)
            .gte("data_venda", inicio.toISOString())
            .lte("data_venda", fim.toISOString())
            .order("id", { ascending: true })
            .range(pagina * lote, (pagina + 1) * lote - 1);
          if (error) throw error;
          const registros = (data ?? []) as VendaCanal[];
          resultado.push(...registros);
          if (registros.length < lote) break;
        }
        if (ativo) setVendas(resultado);
      } catch (e) {
        if (ativo) { setErro(e instanceof Error ? e.message : "Não foi possível carregar os canais."); setVendas([]); }
      } finally { if (ativo) setCarregando(false); }
    }
    void carregar();
    return () => { ativo = false; };
  }, [dataInicio, dataFim]);

  const canais = useMemo(() => {
    const agrupados = new Map<string, number>();
    for (const venda of vendas) {
      const nome = venda.canal_venda?.trim() || "Não informado";
      const valor = Number(venda.faturamento ?? 0);
      agrupados.set(nome, (agrupados.get(nome) ?? 0) + (Number.isFinite(valor) ? valor : 0));
    }
    return [...agrupados.entries()]
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .map((canal, i): Canal => ({ ...canal, cor: CORES[i % CORES.length] }));
  }, [vendas]);
  const total = canais.reduce((soma, canal) => soma + canal.valor, 0);
  let acumulado = 0;
  const gradiente = canais.filter((canal) => canal.valor > 0 && total > 0).map((canal) => {
    const inicio = acumulado;
    acumulado += (canal.valor / total) * 100;
    return `${canal.cor} ${inicio}% ${acumulado}%`;
  }).join(", ");

  return (
    <div className="flex h-full min-h-[315px] min-w-0 flex-col rounded-2xl border border-[#1B3451] bg-[#0B2039] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.15)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-[15px] font-bold text-white">Canais de Venda</h2><p className="mt-1 text-[11px] text-slate-400">Participação no faturamento do período</p></div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><PieChart size={18} /></span>
      </div>
      {erro ? (
        <div role="alert" className="mt-6 flex items-start gap-2 text-xs text-red-300"><AlertCircle size={16} className="shrink-0" />{erro}</div>
      ) : carregando ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-400">Carregando canais...</div>
      ) : canais.length === 0 || total <= 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400"><PieChart size={28} className="mb-3 opacity-50" /><p className="text-sm">Sem faturamento no período</p><p className="mt-1 text-xs text-slate-500">Registre vendas para visualizar os canais.</p></div>
      ) : (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center gap-6 sm:flex-row sm:gap-5">
          <div className="relative aspect-square w-[min(54%,195px)] shrink-0 sm:w-[46%]" role="img" aria-label={`Distribuição de faturamento por canal. Total ${moeda(total)}`}>
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${gradiente})` }} />
            <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-[#0B2039] text-center">
              <span className="text-[10px] text-slate-400">Faturamento</span>
              <strong className="mt-1 text-[clamp(12px,1.3vw,19px)] font-bold text-white">{moeda(total)}</strong>
              <span className="mt-1 text-[10px] text-slate-500">Total</span>
            </div>
          </div>
          <div className="w-full min-w-0 flex-1 space-y-3">
            {canais.map((canal) => {
              const parte = (canal.valor / total) * 100;
              return (
                <div key={canal.nome}>
                  <div className="flex min-w-0 items-center justify-between gap-2 text-[11px]">
                    <span className="flex min-w-0 items-center gap-2 text-slate-300"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: canal.cor }} /><span className="truncate" title={canal.nome}>{canal.nome}</span></span>
                    <span className="shrink-0 text-slate-400">{porcentagem(parte)}</span>
                  </div>
                  <p className="mt-1 pl-[18px] text-[12px] font-bold text-white">{moeda(canal.valor)}</p>
                  <div className="ml-[18px] mt-1 h-1 rounded-full bg-[#263B55]"><div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, parte))}%`, backgroundColor: canal.cor }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
