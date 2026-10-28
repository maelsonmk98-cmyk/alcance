"use client";

import { useEffect, useMemo, useState } from "react";
import { PieChart, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = { dataInicio?: string; dataFim?: string };
type VendaCanal = { canal_venda: string | null; faturamento: number | null; promocao: number | null };
type Canal = { nome: string; valor: number; cor: string };

const CORES = ["#2563EB", "#F97316", "#FBBF24", "#10B981", "#8B5CF6", "#64748B"];

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const porcentagem = (valor: number) => `${valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

function numero(valor: number | null): number {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function centavos(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100);
}

function dataLocal(valor: string, fim = false): Date {
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setHours(fim ? 23 : 0, fim ? 59 : 0, fim ? 59 : 0, fim ? 999 : 0);
  return data;
}

// Faturamento da venda já inclui todas as unidades; a promoção é percentual.
function calcularFaturamento(venda: VendaCanal): number {
  const brutoCentavos = centavos(numero(venda.faturamento));
  const promocaoCentavos = centavos((brutoCentavos / 100) * (numero(venda.promocao) / 100));
  return (brutoCentavos - promocaoCentavos) / 100;
}

export default function SalesChannels({ dataInicio, dataFim }: Props) {
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

        if (!dataInicio) {
          inicio.setHours(0, 0, 0, 0);
          inicio.setDate(inicio.getDate() - 6);
        }
        if (!dataFim) fim.setHours(23, 59, 59, 999);
        if (inicio > fim) throw new Error("Período inválido.");

        const resultado: VendaCanal[] = [];
        const lote = 1000;

        for (let pagina = 0; ; pagina++) {
          const { data, error } = await supabase
            .from("vendas")
            .select("canal_venda,faturamento,promocao")
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
        if (ativo) {
          setErro(e instanceof Error ? e.message : "Não foi possível carregar os canais.");
          setVendas([]);
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregar();
    return () => { ativo = false; };
  }, [dataInicio, dataFim]);

  const canais = useMemo(() => {
    const agrupados = new Map<string, number>();
    for (const venda of vendas) {
      const nome = venda.canal_venda?.trim() || "Não informado";
      const valor = calcularFaturamento(venda);
      agrupados.set(nome, (agrupados.get(nome) ?? 0) + valor);
    }
    return [...agrupados.entries()]
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .map((canal, i): Canal => ({ ...canal, cor: CORES[i % CORES.length] }));
  }, [vendas]);

  const total = canais.reduce((soma, canal) => soma + canal.valor, 0);
  let acumulado = 0;
  const gradiente = canais
    .filter((canal) => canal.valor > 0 && total > 0)
    .map((canal) => {
      const inicio = acumulado;
      acumulado += (canal.valor / total) * 100;
      return `${canal.cor} ${inicio}% ${acumulado}%`;
    })
    .join(", ");

  return (
    <div className="flex h-full min-h-[260px] min-w-0 flex-col rounded-2xl border border-[#1B3451] bg-[#0B2039] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[13px] font-bold text-white sm:text-sm">Canais de Venda</h2>
          <p className="mt-0.5 text-[10px] leading-tight text-slate-400">Participação no faturamento após promoções</p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
          <PieChart size={16} />
        </span>
      </div>

      {erro ? (
        <div role="alert" className="mt-4 flex items-start gap-2 text-xs text-red-300">
          <AlertCircle size={15} className="shrink-0" />
          {erro}
        </div>
      ) : carregando ? (
        <div className="flex flex-1 items-center justify-center text-xs text-slate-400">Carregando canais...</div>
      ) : canais.length === 0 || total <= 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
          <PieChart size={23} className="mb-2 opacity-50" />
          <p className="text-xs">Sem faturamento no período</p>
          <p className="mt-1 text-[10px] text-slate-500">Registre vendas para visualizar os canais.</p>
        </div>
      ) : canais.length === 1 ? (
        <div className="flex flex-1 flex-col justify-center gap-4 py-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400">Faturamento do canal</p>
              <strong className="mt-1 block text-[25px] font-bold leading-none tracking-tight text-white">
                {moeda(total)}
              </strong>
            </div>
            <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-sm font-bold text-blue-300">
              100,0%
            </span>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-slate-200">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                <span className="truncate" title={canais[0].nome}>{canais[0].nome}</span>
              </span>
              <span className="shrink-0 font-semibold text-white">{moeda(canais[0].valor)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#263B55]">
              <div className="h-full w-full rounded-full" style={{ backgroundColor: canais[0].cor }} />
            </div>
          </div>
          {canais[0].nome === "Não informado" && (
            <p className="text-[10px] leading-relaxed text-slate-500">
              As vendas deste período ainda não possuem um canal identificado.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3 flex min-h-0 flex-1 flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <div
            className="relative aspect-square w-[142px] max-w-[45%] shrink-0 sm:w-[min(40%,150px)] sm:max-w-none"
            role="img"
            aria-label={`Distribuição de faturamento por canal. Total ${moeda(total)}`}
          >
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${gradiente})` }} />
            <div className="absolute inset-[23%] flex flex-col items-center justify-center rounded-full bg-[#0B2039] px-1 text-center">
              <span className="text-[9px] text-slate-400">Faturamento</span>
              <strong className="mt-0.5 max-w-full text-[clamp(10px,1vw,14px)] font-bold leading-tight text-white" title={moeda(total)}>
                {moeda(total)}
              </strong>
            </div>
          </div>

          <div className="max-h-[175px] w-full min-w-0 flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {canais.map((canal) => {
              const parte = (canal.valor / total) * 100;
              return (
                <div key={canal.nome}>
                  <div className="flex min-w-0 items-center justify-between gap-2 text-[10px]">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: canal.cor }} />
                      <span className="truncate" title={canal.nome}>{canal.nome}</span>
                    </span>
                    <span className="shrink-0 font-medium text-slate-300">{porcentagem(parte)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 pl-3.5">
                    <strong className="shrink-0 text-[11px] text-white">{moeda(canal.valor)}</strong>
                    <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-[#263B55]">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, parte))}%`, backgroundColor: canal.cor }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
