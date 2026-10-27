
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Wallet,
  Percent,
  Receipt,
  Target,
  ChevronDown,
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

type Props = {
  dataInicio?: string;
  dataFim?: string;
};

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

type DetalheVenda = {
  id: number;
  faturamento: number;
  promocao: number;
  comissao: number;
  frete: number;
  tarifaFixa: number;
  receitaLiquida: number;
};

const vazio = (): Resumo => ({
  quantidade: 0,
  faturamento: 0,
  receitaLiquida: 0,
  valorInvestido: 0,
  investimentoProdutos: 0,
  investimentoAds: 0,
  comissoes: 0,
  promocoes: 0,
  fretes: 0,
  tarifasFixas: 0,
  custo: 0,
  lucro: 0,
  roi: 0,
  margem: 0,
});

function numero(valor: number | null | undefined): number {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function centavos(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100);
}

function reais(valorEmCentavos: number): number {
  return valorEmCentavos / 100;
}

function arredondarMoeda(valor: number): number {
  return reais(centavos(valor));
}

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function percentual(valor: number): string {
  return `${valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function dataLocal(valor: string, fim = false): Date {
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);

  data.setHours(
    fim ? 23 : 0,
    fim ? 59 : 0,
    fim ? 59 : 0,
    fim ? 999 : 0
  );

  return data;
}

// Calcula a receita líquida de uma venda.
// A promoção é arredondada primeiro.
// A comissão incide sobre o faturamento após a promoção.
function calcularDetalhe(venda: Venda): DetalheVenda {
  const qtd = numero(venda.quantidade);

  const faturamentoCentavos = centavos(
    numero(venda.faturamento)
  );

  const promocaoCentavos = centavos(
    reais(faturamentoCentavos) *
      numero(venda.promocao) / 100
  );

  const baseComissaoCentavos =
    faturamentoCentavos - promocaoCentavos;

  const comissaoCentavos = centavos(
    reais(baseComissaoCentavos) *
      numero(venda.comissao) / 100
  );

  const freteCentavos =
    centavos(numero(venda.frete)) * qtd;

  const tarifaFixaCentavos =
    centavos(numero(venda.tarifa_fixa)) * qtd;

  const receitaLiquidaCentavos =
    faturamentoCentavos -
    promocaoCentavos -
    comissaoCentavos -
    freteCentavos -
    tarifaFixaCentavos;

  return {
    id: venda.id,
    faturamento: reais(faturamentoCentavos),
    promocao: reais(promocaoCentavos),
    comissao: reais(comissaoCentavos),
    frete: reais(freteCentavos),
    tarifaFixa: reais(tarifaFixaCentavos),
    receitaLiquida: reais(receitaLiquidaCentavos),
  };
}

function resumoDasVendas(vendas: Venda[]): Resumo {
  const total = vendas.reduce((acc, venda) => {
    const qtd = numero(venda.quantidade);
    const faturamento = numero(venda.faturamento);
    const detalhe = calcularDetalhe(venda);

    const adsReais = arredondarMoeda(
      faturamento * numero(venda.acos) / 100
    );

    const produtosReais =
      numero(venda.custo_unitario) * qtd;

    acc.quantidade += qtd;
    acc.faturamento += detalhe.faturamento;
    acc.receitaLiquida += detalhe.receitaLiquida;
    acc.comissoes += detalhe.comissao;
    acc.promocoes += detalhe.promocao;
    acc.fretes += detalhe.frete;
    acc.tarifasFixas += detalhe.tarifaFixa;

    acc.investimentoProdutos += produtosReais;
    acc.investimentoAds += adsReais;

    // Estes valores vêm do banco.
    // Não são recalculados aqui para evitar
    // alterações silenciosas no histórico.
    acc.custo += numero(venda.custo_total);
    acc.lucro += numero(venda.lucro);

    return acc;
  }, vazio());

  total.valorInvestido =
    total.investimentoProdutos +
    total.investimentoAds;

  total.roi =
    total.valorInvestido > 0
      ? (total.lucro / total.valorInvestido) * 100
      : 0;

  total.margem =
    total.faturamento > 0
      ? (total.lucro / total.faturamento) * 100
      : 0;

  return total;
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

function Indicador({
  titulo,
  valor,
  anterior,
  atual,
  icone,
  cor,
  detalhe,
  carregando,
}: CardProps) {
  const variacao = anterior !== 0
    ? ((atual - anterior) / Math.abs(anterior)) * 100
    : null;

  const SubIcon = variacao === null || Math.abs(variacao) < 0.005
    ? Minus
    : variacao > 0 ? TrendingUp : TrendingDown;

  const textoVariacao = variacao === null
    ? "Sem base anterior"
    : `${variacao > 0 ? "+" : ""}${percentual(variacao)}`;

  const corVariacao = variacao === null
    ? "text-slate-400"
    : variacao > 0 ? "text-emerald-400"
    : variacao < 0 ? "text-rose-400"
    : "text-slate-400";

  return (
    <article className="group relative flex h-[156px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#1D3857] bg-[linear-gradient(145deg,#0D223B_0%,#07172B_100%)] px-3.5 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.17)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#345A7B]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.025] to-transparent" />
      <div className="relative flex min-w-0 items-center gap-2.5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/5 ${cor}`}>
          {icone}
        </div>
        <p className="min-w-0 text-[11px] font-medium leading-[1.25] text-slate-200">
          {titulo}
        </p>
      </div>

      <p className="relative mt-2.5 truncate text-[clamp(15px,1.12vw,22px)] font-bold tracking-[-0.035em] text-white tabular-nums" title={carregando ? undefined : valor}>
        {carregando ? "..." : valor}
      </p>

      {detalhe && (
        <p className="relative mt-0.5 line-clamp-2 text-[9px] leading-[1.3] text-slate-400" title={detalhe}>
          {carregando ? "..." : detalhe}
        </p>
      )}

      <div className="relative mt-auto flex items-end justify-between gap-1 pt-1.5">
        <div className="min-w-0">
          <p className={`flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold ${corVariacao}`}>
            <SubIcon size={12} className="shrink-0" />
            {carregando ? "..." : textoVariacao}
          </p>
          <p className="mt-0.5 text-[9px] text-slate-500">vs. período anterior</p>
        </div>
        <div aria-hidden="true" className={`flex h-7 shrink-0 items-end gap-[3px] opacity-65 ${cor.split(" ").find(c => c.startsWith("text-")) ?? "text-orange-400"}`}>
          {[9, 16, 12, 23].map((altura, i) => (
            <span key={i} className="w-[4px] rounded-t-[2px] bg-current" style={{ height: `${altura}px` }} />
          ))}
        </div>
      </div>
    </article>
  );
}

export default function VendasCards({
  dataInicio,
  dataFim,
}: Props) {
  const [vendasAtuais, setVendasAtuais] =
    useState<Venda[]>([]);

  const [vendasAnteriores, setVendasAnteriores] =
    useState<Venda[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarDetalhes, setMostrarDetalhes] =
    useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setErro(null);

      try {
        const { data: auth, error: erroAuth } =
          await supabase.auth.getUser();

        if (erroAuth) throw erroAuth;

        if (!auth.user) {
          throw new Error("Usuário não autenticado.");
        }

        const userId = auth.user.id;
        const hoje = new Date();

        const fimAtual = dataFim
          ? dataLocal(dataFim, true)
          : new Date(hoje);

        if (!dataFim) {
          fimAtual.setHours(23, 59, 59, 999);
        }

        const inicioAtual = dataInicio
          ? dataLocal(dataInicio)
          : new Date(hoje);

        if (!dataInicio) {
          inicioAtual.setHours(0, 0, 0, 0);
          inicioAtual.setDate(
            inicioAtual.getDate() - 6
          );
        }

        if (inicioAtual > fimAtual) {
          throw new Error(
            "O início do período não pode ser posterior ao fim."
          );
        }

        const duracao =
          fimAtual.getTime() -
          inicioAtual.getTime() + 1;

        const fimAnterior = new Date(
          inicioAtual.getTime() - 1
        );

        const inicioAnterior = new Date(
          inicioAtual.getTime() - duracao
        );

        const campos = [
          "id",
          "data_venda",
          "quantidade",
          "faturamento",
          "custo_total",
          "lucro",
          "custo_unitario",
          "comissao",
          "frete",
          "promocao",
          "tarifa_fixa",
          "acos",
        ].join(",");

        async function buscarTodas(
          inicio: Date,
          fim: Date
        ): Promise<Venda[]> {
          const todas: Venda[] = [];
          const lote = 1000;

          for (let pagina = 0; ; pagina++) {
            const { data, error } = await supabase
              .from("vendas")
              .select(campos)
              .eq("user_id", userId)
              .gte(
                "data_venda",
                inicio.toISOString()
              )
              .lte(
                "data_venda",
                fim.toISOString()
              )
              .order("id", { ascending: true })
              .range(
                pagina * lote,
                (pagina + 1) * lote - 1
              );

            if (error) throw error;

            const registros =
              (data ?? []) as unknown as Venda[];

            todas.push(...registros);

            if (registros.length < lote) {
              break;
            }
          }

          return todas;
        }

        const [atuais, anteriores] =
          await Promise.all([
            buscarTodas(inicioAtual, fimAtual),
            buscarTodas(
              inicioAnterior,
              fimAnterior
            ),
          ]);

        if (!ativo) return;

        setVendasAtuais(atuais);
        setVendasAnteriores(anteriores);
      } catch (e) {
        if (!ativo) return;

        setErro(
          e instanceof Error
            ? e.message
            : "Não foi possível carregar os indicadores."
        );

        setVendasAtuais([]);
        setVendasAnteriores([]);
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, [dataInicio, dataFim]);

  const atual = useMemo(
    () => resumoDasVendas(vendasAtuais),
    [vendasAtuais]
  );

  const anterior = useMemo(
    () => resumoDasVendas(vendasAnteriores),
    [vendasAnteriores]
  );

  const detalhes = useMemo(
    () => vendasAtuais.map(calcularDetalhe),
    [vendasAtuais]
  );

  const cards: Omit<CardProps, "carregando">[] = [
    {
      titulo: "Produtos Vendidos",
      valor: atual.quantidade.toLocaleString("pt-BR"),
      atual: atual.quantidade,
      anterior: anterior.quantidade,
      icone: <ShoppingCart size={20} />,
      cor: "bg-blue-500/10 text-blue-400",
    },
    {
      titulo: "Faturamento",
      valor: moeda(atual.faturamento),
      atual: atual.faturamento,
      anterior: anterior.faturamento,
      icone: <DollarSign size={20} />,
      cor: "bg-violet-500/10 text-violet-400",
    },
    {
      titulo: "Receita Líquida",
      valor: moeda(atual.receitaLiquida),
      atual: atual.receitaLiquida,
      anterior: anterior.receitaLiquida,
      icone: <Receipt size={20} />,
      cor: "bg-cyan-500/10 text-cyan-400",
    },
    {
      titulo: "Valor Investido",
      valor: moeda(atual.valorInvestido),
      atual: atual.valorInvestido,
      anterior: anterior.valorInvestido,
      icone: <Target size={20} />,
      cor: "bg-orange-500/10 text-orange-400",
      detalhe:
        `Produtos: ${moeda(atual.investimentoProdutos)} ` +
        `· Ads: ${moeda(atual.investimentoAds)}`,
    },
    {
      titulo: "Custo das Vendas",
      valor: moeda(atual.custo),
      atual: atual.custo,
      anterior: anterior.custo,
      icone: <Wallet size={20} />,
      cor: "bg-amber-500/10 text-amber-400",
    },
    {
      titulo: "Lucro Líquido",
      valor: moeda(atual.lucro),
      atual: atual.lucro,
      anterior: anterior.lucro,
      icone: <TrendingUp size={20} />,
      cor: "bg-emerald-500/10 text-emerald-400",
    },
    {
      titulo: "ROI",
      valor: percentual(atual.roi),
      atual: atual.roi,
      anterior: anterior.roi,
      icone: <BarChart3 size={20} />,
      cor: "bg-orange-500/10 text-orange-400",
    },
    {
      titulo: "Margem Média",
      valor: percentual(atual.margem),
      atual: atual.margem,
      anterior: anterior.margem,
      icone: <Percent size={20} />,
      cor: "bg-teal-500/10 text-teal-400",
    },
  ];

  return (
    <section className="space-y-2">
      {erro && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          Erro ao carregar indicadores: {erro}
        </div>
      )}

      {/* OITO CARDS COMPACTOS */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 2xl:grid-cols-8">
        {cards.map((card) => (
          <Indicador
            key={card.titulo}
            {...card}
            carregando={carregando}
          />
        ))}
      </div>

      {/* DETALHAMENTO DOS DESCONTOS */}
      <div className="rounded-xl border border-[#1B3451] bg-[#0B2039]">
        <button
          type="button"
          onClick={() =>
            setMostrarDetalhes((valor) => !valor)
          }
          aria-expanded={mostrarDetalhes}
          className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-xs font-semibold text-slate-300 transition-colors hover:text-white"
        >
          <span>
            Conferir descontos e Receita Líquida
            {" "}({vendasAtuais.length} vendas)
          </span>

          <ChevronDown
            size={16}
            className={
              mostrarDetalhes ? "rotate-180" : ""
            }
          />
        </button>

        {mostrarDetalhes && (
          <div className="border-t border-[#1B3352] px-4 py-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-slate-400">
                Receita Líquida calculada
              </span>

              <strong className="text-emerald-400">
                {moeda(atual.receitaLiquida)}
              </strong>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1B3352] text-slate-400">
                    <th className="px-2 py-2">Venda</th>
                    <th className="px-2 py-2">Faturamento</th>
                    <th className="px-2 py-2">Promoção</th>
                    <th className="px-2 py-2">Comissão</th>
                    <th className="px-2 py-2">Frete</th>
                    <th className="px-2 py-2">Tarifa fixa</th>
                    <th className="px-2 py-2">Receita líquida</th>
                  </tr>
                </thead>

                <tbody>
                  {detalhes.map((venda) => (
                    <tr
                      key={venda.id}
                      className="border-b border-[#1B3352]/60 text-slate-300"
                    >
                      <td className="px-2 py-2">
                        #{venda.id}
                      </td>

                      <td className="px-2 py-2">
                        {moeda(venda.faturamento)}
                      </td>

                      <td className="px-2 py-2">
                        - {moeda(venda.promocao)}
                      </td>

                      <td className="px-2 py-2">
                        - {moeda(venda.comissao)}
                      </td>

                      <td className="px-2 py-2">
                        - {moeda(venda.frete)}
                      </td>

                      <td className="px-2 py-2">
                        - {moeda(venda.tarifaFixa)}
                      </td>

                      <td className="px-2 py-2 font-bold text-emerald-400">
                        {moeda(venda.receitaLiquida)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="font-bold text-white">
                    <td className="px-2 py-3">TOTAL</td>
                    <td className="px-2 py-3">
                      {moeda(atual.faturamento)}
                    </td>
                    <td className="px-2 py-3">
                      - {moeda(atual.promocoes)}
                    </td>
                    <td className="px-2 py-3">
                      - {moeda(atual.comissoes)}
                    </td>
                    <td className="px-2 py-3">
                      - {moeda(atual.fretes)}
                    </td>
                    <td className="px-2 py-3">
                      - {moeda(atual.tarifasFixas)}
                    </td>
                    <td className="px-2 py-3 text-emerald-400">
                      {moeda(atual.receitaLiquida)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="mt-3 text-[10px] text-slate-500">
              A promoção é calculada sobre o faturamento
              bruto e arredondada para centavos.
              A comissão é calculada sobre o faturamento
              após a promoção e também arredondada
              para centavos. Frete e tarifa fixa são
              multiplicados pela quantidade vendida.
              Os valores são calculados com base nos
              dados cadastrados no Alcance.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
