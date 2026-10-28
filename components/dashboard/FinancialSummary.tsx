
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Percent,
  BarChart3,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  dataInicio?: string;
  dataFim?: string;
};

type Venda = {
  faturamento: number | null;
  quantidade: number | null;
  custo_unitario: number | null;
  lucro: number | null;
  comissao: number | null;
  promocao: number | null;
  frete: number | null;
  tarifa_fixa: number | null;
  acos: number | null;
};

type Resumo = {
  faturamento: number;
  receitaLiquida: number;
  lucro: number;
  investido: number;
  margem: number;
  roi: number;
};

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

function numero(valor: number | null): number {
  const convertido = Number(valor ?? 0);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
}

function centavos(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100);
}

function dataLocal(
  valor: string,
  fim = false
): Date {
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

function calcular(vendas: Venda[]): Resumo {
  let faturamentoCentavos = 0;
  let receitaLiquidaCentavos = 0;
  let lucroCentavos = 0;
  let investimentoCentavos = 0;

  for (const venda of vendas) {
    const quantidade = numero(venda.quantidade);

    // Faturamento é o valor total do registro.
    // Não multiplicar pela quantidade novamente.
    const brutoCentavos = centavos(
      numero(venda.faturamento)
    );

    // Promoção é percentual do faturamento bruto.
    const promocaoCentavos = centavos(
      (brutoCentavos / 100) *
        (numero(venda.promocao) / 100)
    );

    const faturamentoVendaCentavos =
      brutoCentavos - promocaoCentavos;

    // Comissão sobre o faturamento após promoção.
    const comissaoCentavos = centavos(
      (faturamentoVendaCentavos / 100) *
        (numero(venda.comissao) / 100)
    );

    // Frete e tarifa fixa são valores por unidade.
    const freteCentavos =
      centavos(numero(venda.frete)) * quantidade;

    const tarifaCentavos =
      centavos(numero(venda.tarifa_fixa)) * quantidade;

    const receitaVendaCentavos =
      faturamentoVendaCentavos -
      comissaoCentavos -
      freteCentavos -
      tarifaCentavos;

    // Lucro já está calculado no banco.
    const lucroVendaCentavos = centavos(
      numero(venda.lucro)
    );

    // Custo dos produtos vendidos.
    const custoProdutosCentavos = centavos(
      numero(venda.custo_unitario) * quantidade
    );

    // Ads calculado pelo ACOS individual.
    // Base: faturamento bruto, conforme a regra
    // atual utilizada no sistema.
    const adsCentavos = centavos(
      numero(venda.faturamento) *
        (numero(venda.acos) / 100)
    );

    faturamentoCentavos += faturamentoVendaCentavos;
    receitaLiquidaCentavos += receitaVendaCentavos;
    lucroCentavos += lucroVendaCentavos;

    investimentoCentavos +=
      custoProdutosCentavos + adsCentavos;
  }

  const faturamento = faturamentoCentavos / 100;
  const receitaLiquida =
    receitaLiquidaCentavos / 100;
  const lucro = lucroCentavos / 100;
  const investido = investimentoCentavos / 100;

  return {
    faturamento,
    receitaLiquida,
    lucro,
    investido,
    margem:
      faturamento > 0
        ? (lucro / faturamento) * 100
        : 0,
    roi:
      investido > 0
        ? (lucro / investido) * 100
        : 0,
  };
}

function calcularVariacao(
  atual: number,
  anterior: number
): number | null {
  if (anterior === 0) return null;

  return (
    ((atual - anterior) / Math.abs(anterior)) * 100
  );
}

function calcularDiferencaPontos(
  atual: number,
  anterior: number
): number {
  return atual - anterior;
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
      setCarregando(true);
      setErro(null);

      try {
        const {
          data: auth,
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!auth.user) {
          throw new Error("Usuário não autenticado.");
        }

        const userId = auth.user.id;
        const hoje = new Date();

        const inicio = dataInicio
          ? dataLocal(dataInicio)
          : new Date(hoje);

        const fim = dataFim
          ? dataLocal(dataFim, true)
          : new Date(hoje);

        if (!dataInicio) {
          inicio.setHours(0, 0, 0, 0);
          inicio.setDate(inicio.getDate() - 6);
        }

        if (!dataFim) {
          fim.setHours(23, 59, 59, 999);
        }

        if (inicio > fim) {
          throw new Error("Período inválido.");
        }

        // Período anterior com a mesma duração.
        const duracao =
          fim.getTime() - inicio.getTime() + 1;

        const fimAnterior = new Date(
          inicio.getTime() - 1
        );

        const inicioAnterior = new Date(
          inicio.getTime() - duracao
        );

       const campos =
  "faturamento,quantidade,custo_unitario,lucro,comissao,promocao,frete,tarifa_fixa,acos" as const;
  

        async function buscar(
          de: Date,
          ate: Date
        ): Promise<Venda[]> {
          const resultado: Venda[] = [];
          const lote = 1000;

          for (let pagina = 0; ; pagina++) {
            const { data, error } = await supabase
              .from("vendas")
              .select(campos)
              .eq("user_id", userId)
              .gte(
                "data_venda",
                de.toISOString()
              )
              .lte(
                "data_venda",
                ate.toISOString()
              )
              .order("id", {
                ascending: true,
              })
              .range(
                pagina * lote,
                (pagina + 1) * lote - 1
              );

            if (error) throw error;

            const registros = (data ?? []) as Venda[];

            resultado.push(...registros);

            if (registros.length < lote) {
              break;
            }
          }

          return resultado;
        }

        const [vendasAtuais, vendasAnteriores] =
          await Promise.all([
            buscar(inicio, fim),
            buscar(inicioAnterior, fimAnterior),
          ]);

        if (!ativo) return;

        setAtuais(vendasAtuais);
        setAnteriores(vendasAnteriores);
      } catch (e) {
        if (!ativo) return;

        setErro(
          e instanceof Error
            ? e.message
            : "Falha ao carregar resumo financeiro."
        );

        setAtuais([]);
        setAnteriores([]);
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
    () => calcular(atuais),
    [atuais]
  );

  const anterior = useMemo(
    () => calcular(anteriores),
    [anteriores]
  );

  const itens = [
    {
      titulo: "Receita Líquida",
      valor: moeda(atual.receitaLiquida),
      atual: atual.receitaLiquida,
      anterior: anterior.receitaLiquida,
      Icone: DollarSign,
      cor: "text-blue-400 bg-blue-500/10",
      tipo: "percentual",
    },
    {
      titulo: "Lucro Líquido",
      valor: moeda(atual.lucro),
      atual: atual.lucro,
      anterior: anterior.lucro,
      Icone: TrendingUp,
      cor: "text-emerald-400 bg-emerald-500/10",
      tipo: "percentual",
    },
    {
      titulo: "Margem",
      valor: percentual(atual.margem),
      atual: atual.margem,
      anterior: anterior.margem,
      Icone: Percent,
      cor: "text-cyan-400 bg-cyan-500/10",
      tipo: "pontos",
    },
    {
      titulo: "ROI",
      valor: percentual(atual.roi),
      atual: atual.roi,
      anterior: anterior.roi,
      Icone: BarChart3,
      cor: "text-orange-400 bg-orange-500/10",
      tipo: "pontos",
    },
  ];

  return (
    <section className="flex h-full min-h-[340px] min-w-0 flex-col rounded-2xl border border-[#1B3451] bg-[#0B2039] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.15)] sm:p-5">
      {/* CABEÇALHO */}
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
          <BarChart3 size={18} />
        </span>

        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-white">
            Resumo Financeiro
          </h2>

          <p className="mt-1 text-[11px] text-slate-400">
            Indicadores do período selecionado
          </p>
        </div>
      </div>

      {erro ? (
        <div
          role="alert"
          className="flex flex-1 items-center justify-center gap-2 text-xs text-red-300"
        >
          <AlertCircle size={17} />
          {erro}
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-3">
          {itens.map((item) => {
            const {
              titulo,
              valor,
              atual: valorAtual,
              anterior: valorAnterior,
              Icone,
              cor,
              tipo,
            } = item;

            const diferenca =
              tipo === "pontos"
                ? calcularDiferencaPontos(
                    valorAtual,
                    valorAnterior
                  )
                : calcularVariacao(
                    valorAtual,
                    valorAnterior
                  );

            const semBase =
              tipo === "percentual" &&
              diferenca === null;

            const positivo =
              diferenca !== null && diferenca > 0;

            const negativo =
              diferenca !== null && diferenca < 0;

            const corVariacao = semBase
              ? "text-slate-400"
              : positivo
                ? "text-emerald-400"
                : negativo
                  ? "text-red-400"
                  : "text-slate-400";

            return (
              <div
                key={titulo}
                className="flex min-w-0 flex-col rounded-xl border border-[#1D3856] bg-[#0E2743] p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cor}`}
                  >
                    <Icone size={17} />
                  </span>

                  <span className="text-[10px] font-medium text-slate-300">
                    {titulo}
                  </span>
                </div>

                <p className="mt-3 break-words text-[clamp(14px,1.35vw,20px)] font-bold tabular-nums text-white">
                  {carregando ? "..." : valor}
                </p>

                <div className="mt-auto pt-3">
                  <div
                    className={`flex items-center gap-1 text-[10px] font-semibold ${corVariacao}`}
                  >
                    {carregando ? null : positivo ? (
                      <ArrowUpRight size={14} />
                    ) : negativo ? (
                      <ArrowDownRight size={14} />
                    ) : (
                      <Minus size={13} />
                    )}

                    <span>
                      {carregando
                        ? "..."
                        : semBase
                          ? "Sem base anterior"
                          : tipo === "pontos"
                            ? `${
                                diferenca! > 0 ? "+" : ""
                              }${diferenca!.toLocaleString(
                                "pt-BR",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )} p.p.`
                            : `${
                                diferenca! > 0 ? "+" : ""
                              }${percentual(diferenca!)}`}
                    </span>
                  </div>

                  <p className="mt-1 text-[9px] text-slate-500">
                    vs. período anterior
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
