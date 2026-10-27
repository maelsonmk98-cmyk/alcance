"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ShoppingCart, DollarSign, TrendingUp, TrendingDown, Minus,
  BarChart3, Wallet, Percent, Receipt, Target,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Venda = {
  id: number;
  data_venda: string;
  quantidade: number | null;
  faturamento: number | null;
  custo_total: number | null;
  lucro: number | null;
  custo_unitario: number | null;
  comissao: number | null;
  frete: number | null;
  promocao: number | null;
  tarifa_fixa: number | null;
  acos: number | null;
};

type Props = { dataInicio?: string; dataFim?: string };
type Resumo = {
  quantidade: number;
  faturamento: number;
  receitaLiquida: number;
  valorInvestido: number;
  investimentoProdutos: number;
  investimentoAds: number;
  comissoes: number;
  promocoes: number;
  fretes: number;
  tarifasFixas: number;
  custo: number;
  lucro: number;
  roi: number;
  margem: number;
};

const vazio = (): Resumo => ({
  quantidade: 0, faturamento: 0, receitaLiquida: 0,
  valorInvestido: 0, investimentoProdutos: 0, investimentoAds: 0,
  comissoes: 0, promocoes: 0, fretes: 0, tarifasFixas: 0,
  custo: 0, lucro: 0, roi: 0, margem: 0,
});

function numero(valor: number | null | undefined): number {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function dataLocal(valor: string, fim = false): Date {
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setHours(fim ? 23 : 0, fim ? 59 : 0, fim ? 59 : 0, fim ? 999 : 0);
  return data;
}

function resumoDasVendas(vendas: Venda[]): Resumo {
  const total = vendas.reduce((acc, venda) => {
    const qtd = numero(venda.quantidade);
    const faturamento = numero(venda.faturamento);

    // Campos comissao, promocao e acos são percentuais (14 = 14%).
    const comissaoReais = faturamento * numero(venda.comissao) / 100;
    const promocaoReais = faturamento * numero(venda.promocao) / 100;
    const adsReais = faturamento * numero(venda.acos) / 100;

    // Valores monetários por unidade, como no formulário de vendas.
    const freteReais = numero(venda.frete) * qtd;
    const tarifaFixaReais = numero(venda.tarifa_fixa) * qtd;
    const produtosReais = numero(venda.custo_unitario) * qtd;

    acc.quantidade += qtd;
    acc.faturamento += faturamento;
    acc.comissoes += comissaoReais;
    acc.promocoes += promocaoReais;
    acc.fretes += freteReais;
    acc.tarifasFixas += tarifaFixaReais;
    acc.investimentoProdutos += produtosReais;
    acc.investimentoAds += adsReais;
    acc.custo += numero(venda.custo_total);
    // Lucro já registrado no banco; não subtrair Ads novamente.
    acc.lucro += numero(venda.lucro);
    return acc;
  }, vazio());

  total.receitaLiquida = total.faturamento - total.comissoes - total.promocoes
    - total.fretes - total.tarifasFixas;
  total.valorInvestido = total.investimentoProdutos + total.investimentoAds;
  total.roi = total.valorInvestido > 0 ? total.lucro / total.valorInvestido * 100 : 0;
  total.margem = total.faturamento > 0 ? total.lucro / total.faturamento * 100 : 0;
  return total;
}

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function percentual(valor: number) {
  return `${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

type CardProps = {
  titulo: string;
  valor: string;
  anterior: number;
  atual: number;
  icone: ReactNode;
  cor: string;
  detalhe?: string;
  carregando: boolean;
};

function Indicador({ titulo, valor, anterior, atual, icone, cor, detalhe, carregando }: CardProps) {
  const variacao = anterior !== 0 ? ((atual - anterior) / Math.abs(anterior)) * 100 : null;
  const SubIcon = variacao === null || Math.abs(variacao) < 0.005
    ? Minus : variacao > 0 ? TrendingUp : TrendingDown;
  const textoVariacao = variacao === null
    ? "Sem base anterior" : `${variacao > 0 ? "+" : ""}${percentual(variacao)}`;

  return (
    <div className="flex min-w-0 min-h-[148px] flex-col rounded-2xl border border-[#1B3352] bg-[#0B1E35] px-3 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
      <div className="flex min-w-0 items-center gap-2">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cor}`}>
          {icone}
        </div>
        <p className="min-w-0 text-[10px] font-medium leading-tight text-slate-300">{titulo}</p>
      </div>

      <p className="mt-3 whitespace-nowrap text-[clamp(13px,1.1vw,21px)] font-bold tracking-tight text-white tabular-nums">
        {carregando ? "..." : valor}
      </p>

      {detalhe && (
        <p className="mt-1 text-[9px] leading-snug text-slate-400">{carregando ? "..." : detalhe}</p>
      )}

      <div className="mt-auto pt-3">
        <p className={`flex items-center gap-1 text-[10px] font-semibold ${variacao === null ? "text-slate-400" : variacao >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          <SubIcon size={12} />
          {carregando ? "..." : textoVariacao}
        </p>
        <p className="mt-0.5 text-[9px] text-slate-500">vs. período anterior</p>
      </div>
    </div>
  );
}

export default function VendasCards({ dataInicio, dataFim }: Props) {
  const [vendasAtuais, setVendasAtuais] = useState<Venda[]>([]);
  const [vendasAnteriores, setVendasAnteriores] = useState<Venda[]>([]);
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
        const fimAtual = dataFim ? dataLocal(dataFim, true) : new Date(hoje);
        if (!dataFim) fimAtual.setHours(23, 59, 59, 999);
        const inicioAtual = dataInicio ? dataLocal(dataInicio) : new Date(hoje);
        if (!dataInicio) {
          inicioAtual.setHours(0, 0, 0, 0);
          inicioAtual.setDate(inicioAtual.getDate() - 6);
        }
        if (inicioAtual > fimAtual) throw new Error("O início do período não pode ser posterior ao fim.");

        const duracao = fimAtual.getTime() - inicioAtual.getTime() + 1;
        const fimAnterior = new Date(inicioAtual.getTime() - 1);
        const inicioAnterior = new Date(inicioAtual.getTime() - duracao);
        const campos = "id,data_venda,quantidade,faturamento,custo_total,lucro,custo_unitario,comissao,frete,promocao,tarifa_fixa,acos";

        // Paginação para não perder vendas quando o período tiver mais de 1000 linhas.
        async function buscarTodas(inicio: Date, fim: Date): Promise<Venda[]> {
          const todas: Venda[] = [];
          const lote = 1000;
          for (let pagina = 0; ; pagina++) {
            const { data, error } = await supabase.from("vendas")
              .select(campos)
              .eq("user_id", auth.user!.id)
              .gte("data_venda", inicio.toISOString())
              .lte("data_venda", fim.toISOString())
              .order("id", { ascending: true })
              .range(pagina * lote, (pagina + 1) * lote - 1);
            if (error) throw error;
            const registros = (data ?? []) as unknown as Venda[];
            todas.push(...registros);
            if (registros.length < lote) break;
          }
          return todas;
        }

        const [atuais, anteriores] = await Promise.all([
          buscarTodas(inicioAtual, fimAtual),
          buscarTodas(inicioAnterior, fimAnterior),
        ]);
        if (!ativo) return;
        setVendasAtuais(atuais);
        setVendasAnteriores(anteriores);
      } catch (e) {
        if (!ativo) return;
        setErro(e instanceof Error ? e.message : "Não foi possível carregar os indicadores.");
        setVendasAtuais([]);
        setVendasAnteriores([]);
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    void carregar();
    return () => { ativo = false; };
  }, [dataInicio, dataFim]);

  const atual = useMemo(() => resumoDasVendas(vendasAtuais), [vendasAtuais]);
  const anterior = useMemo(() => resumoDasVendas(vendasAnteriores), [vendasAnteriores]);

  const cards: Omit<CardProps, "carregando">[] = [
    { titulo: "Produtos Vendidos", valor: atual.quantidade.toLocaleString("pt-BR"), atual: atual.quantidade, anterior: anterior.quantidade, icone: <ShoppingCart size={20} />, cor: "bg-blue-500/10 text-blue-400" },
    { titulo: "Faturamento", valor: moeda(atual.faturamento), atual: atual.faturamento, anterior: anterior.faturamento, icone: <DollarSign size={20} />, cor: "bg-violet-500/10 text-violet-400" },
    { titulo: "Receita Líquida", valor: moeda(atual.receitaLiquida), atual: atual.receitaLiquida, anterior: anterior.receitaLiquida, icone: <Receipt size={20} />, cor: "bg-cyan-500/10 text-cyan-400" },
    { titulo: "Valor Investido", valor: moeda(atual.valorInvestido), atual: atual.valorInvestido, anterior: anterior.valorInvestido, icone: <Target size={20} />, cor: "bg-orange-500/10 text-orange-400", detalhe: `Produtos: ${moeda(atual.investimentoProdutos)} · Ads: ${moeda(atual.investimentoAds)}` },
    { titulo: "Custo das Vendas", valor: moeda(atual.custo), atual: atual.custo, anterior: anterior.custo, icone: <Wallet size={20} />, cor: "bg-amber-500/10 text-amber-400" },
    { titulo: "Lucro Líquido", valor: moeda(atual.lucro), atual: atual.lucro, anterior: anterior.lucro, icone: <TrendingUp size={20} />, cor: "bg-emerald-500/10 text-emerald-400" },
    { titulo: "ROI", valor: percentual(atual.roi), atual: atual.roi, anterior: anterior.roi, icone: <BarChart3 size={20} />, cor: "bg-orange-500/10 text-orange-400" },
    { titulo: "Margem Média", valor: percentual(atual.margem), atual: atual.margem, anterior: anterior.margem, icone: <Percent size={20} />, cor: "bg-teal-500/10 text-teal-400" },
  ];

  return (
    <section className="space-y-2">
      {erro && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Erro ao carregar indicadores: {erro}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-8">
        {cards.map(card => (
          <Indicador key={card.titulo} {...card} carregando={carregando} />
        ))}
      </div>
    </section>
  );
}
