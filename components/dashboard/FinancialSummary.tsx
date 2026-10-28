
"use client";

import { useEffect, useMemo, useState } from "react";
import { DollarSign, TrendingUp, Percent, BarChart3, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = { dataInicio?: string; dataFim?: string };
type Venda = {
  faturamento: number | null; quantidade: number | null; custo_unitario: number | null;
  lucro: number | null; comissao: number | null; promocao: number | null;
  frete: number | null; tarifa_fixa: number | null; acos: number | null;
};
const moeda = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const percentual = (n: number) => `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const numero = (n: number | null) => Number.isFinite(Number(n ?? 0)) ? Number(n ?? 0) : 0;
const centavos = (n: number) => Math.round((n + Number.EPSILON) * 100);
function dataLocal(valor: string, fim = false) {
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setHours(fim ? 23 : 0, fim ? 59 : 0, fim ? 59 : 0, fim ? 999 : 0);
  return data;
}
function calcular(vendas: Venda[]) {
  let faturamento = 0, receitaLiquida = 0, lucro = 0, investido = 0;
  for (const venda of vendas) {
    const qtd = numero(venda.quantidade);
    const fatCent = centavos(numero(venda.faturamento));
    const promocaoCent = centavos((fatCent / 100) * numero(venda.promocao) / 100);
    const comissaoCent = centavos(((fatCent - promocaoCent) / 100) * numero(venda.comissao) / 100);
    const freteCent = centavos(numero(venda.frete)) * qtd;
    const tarifaCent = centavos(numero(venda.tarifa_fixa)) * qtd;
    faturamento += fatCent / 100;
    receitaLiquida += (fatCent - promocaoCent - comissaoCent - freteCent - tarifaCent) / 100;
    lucro += numero(venda.lucro);
    investido += numero(venda.custo_unitario) * qtd + centavos(numero(venda.faturamento) * numero(venda.acos) / 100) / 100;
  }
  return {
    receitaLiquida, lucro,
    margem: faturamento > 0 ? lucro / faturamento * 100 : 0,
    roi: investido > 0 ? lucro / investido * 100 : 0,
  };
}

export default function FinancialSummary({
  dataInicio,
  dataFim,
}: Props) {
  const [atuais, setAtuais] = useState<Venda[]>([]);
  const [anteriores, setAnteriores] = useState<Venda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true); setErro(null);
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!auth.user) throw new Error("Usuário não autenticado.");
        const hoje = new Date();
        const inicio = dataInicio ? dataLocal(dataInicio) : new Date(hoje);
        const fim = dataFim ? dataLocal(dataFim, true) : new Date(hoje);
        if (!dataInicio) { inicio.setHours(0, 0, 0, 0); inicio.setDate(inicio.getDate() - 6); }
        if (!dataFim) fim.setHours(23, 59, 59, 999);
        if (inicio > fim) throw new Error("Período inválido.");
        const duracao = fim.getTime() - inicio.getTime() + 1;
        const fimAnterior = new Date(inicio.getTime() - 1);
        const inicioAnterior = new Date(inicio.getTime() - duracao);
        const campos = "faturamento,quantidade,custo_unitario,lucro,comissao,promocao,frete,tarifa_fixa,acos";
        async function buscar(de: Date, ate: Date) {
          const resultado: Venda[] = [];
          const lote = 1000;
          for (let pagina = 0; ; pagina++) {
            const { data, error } = await supabase.from("vendas").select(campos)
              .eq("user_id", auth.user!.id)
              .gte("data_venda", de.toISOString())
              .lte("data_venda", ate.toISOString())
              .order("id", { ascending: true })
              .range(pagina * lote, (pagina + 1) * lote - 1);
            if (error) throw error;
            const registros = (data ?? []) as Venda[];
            resultado.push(...registros);
            if (registros.length < lote) break;
          }
          return resultado;
        }
        const [a, b] = await Promise.all([buscar(inicio, fim), buscar(inicioAnterior, fimAnterior)]);
        if (ativo) { setAtuais(a); setAnteriores(b); }
      } catch (e) {
        if (ativo) { setErro(e instanceof Error ? e.message : "Falha ao carregar resumo."); setAtuais([]); setAnteriores([]); }
      } finally { if (ativo) setCarregando(false); }
    }
    void carregar();
    return () => { ativo = false; };
  }, [dataInicio, dataFim]);

  const atual = useMemo(() => calcular(atuais), [atuais]);
  const anterior = useMemo(() => calcular(anteriores), [anteriores]);
  const itens = [
    { titulo: "Receita Líquida", valor: moeda(atual.receitaLiquida), atual: atual.receitaLiquida, anterior: anterior.receitaLiquida, Icone: DollarSign, cor: "text-blue-400 bg-blue-500/10" },
    { titulo: "Lucro Líquido", valor: moeda(atual.lucro), atual: atual.lucro, anterior: anterior.lucro, Icone: TrendingUp, cor: "text-emerald-400 bg-emerald-500/10" },
    { titulo: "Margem Média", valor: percentual(atual.margem), atual: atual.margem, anterior: anterior.margem, Icone: Percent, cor: "text-cyan-400 bg-cyan-500/10" },
    { titulo: "ROI", valor: percentual(atual.roi), atual: atual.roi, anterior: anterior.roi, Icone: BarChart3, cor: "text-orange-400 bg-orange-500/10" },
  ];
  return (
    <div className="flex h-full min-h-[260px] flex-col rounded-2xl border border-[#1B3451] bg-[#0B2039] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.15)] sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><BarChart3 size={18} /></span>
        <div><h2 className="text-[15px] font-bold text-white">Resumo Financeiro</h2><p className="mt-1 text-[11px] text-slate-400">Indicadores do período selecionado</p></div>
      </div>
      {erro ? <p role="alert" className="flex items-start gap-2 text-xs text-red-300"><AlertCircle size={16} className="shrink-0" />{erro}</p> : (
        <div className="grid flex-1 grid-cols-2 gap-3">
          {itens.map(({ titulo, valor, atual: valorAtual, anterior: valorAnterior, Icone, cor }) => {
            const variacao = valorAnterior !== 0 ? (valorAtual - valorAnterior) / Math.abs(valorAnterior) * 100 : null;
            return (
              <div key={titulo} className="flex min-w-0 flex-col rounded-xl border border-[#1D3856] bg-[#0E2743] p-3">
                <div className="flex items-center gap-2"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cor}`}><Icone size={17} /></span><span className="text-[10px] font-medium text-slate-300">{titulo}</span></div>
                <p className="mt-3 break-words text-[clamp(14px,1.35vw,20px)] font-bold tabular-nums text-white">{carregando ? "..." : valor}</p>
                <p className={`mt-auto pt-2 text-[10px] font-semibold ${variacao === null ? "text-slate-400" : variacao >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {carregando ? "..." : variacao === null ? "Sem base anterior" : `${variacao > 0 ? "+" : ""}${percentual(variacao)}`}
                </p>
                <p className="mt-0.5 text-[9px] text-slate-500">vs. período anterior</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
