
"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  dataInicio?: string;
  dataFim?: string;
};

type Venda = {
  data_venda: string;
  faturamento: number | null;
  promocao: number | null;
  lucro: number | null;
};

type Dia = {
  data: string;
  label: string;
  faturamento: number;
  lucro: number;
};

type Ponto = {
  x: number;
  y: number;
};

const LARGURA = 1000;
const ALTURA = 220;
const ESQUERDA = 75;
const DIREITA = 20;
const TOPO = 12;
const BAIXO = 30;

const LARGURA_GRAFICO = LARGURA - ESQUERDA - DIREITA;
const ALTURA_GRAFICO = ALTURA - TOPO - BAIXO;

function numero(valor: number | null): number {
  const resultado = Number(valor ?? 0);
  return Number.isFinite(resultado) ? resultado : 0;
}

function centavos(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100);
}

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function moedaEixo(valor: number): string {
  const absoluto = Math.abs(valor);
  const sinal = valor < 0 ? "-" : "";

  if (absoluto >= 1000000) {
    return `${sinal}R$ ${(absoluto / 1000000)
      .toFixed(1)
      .replace(".", ",")}M`;
  }

  if (absoluto >= 1000) {
    return `${sinal}R$ ${(absoluto / 1000)
      .toFixed(1)
      .replace(".", ",")} mil`;
  }

  return `${sinal}R$ ${absoluto.toFixed(0)}`;
}

function criarDataLocal(
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

function chaveData(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function quantidadeDiasEntre(
  inicio: Date,
  fim: Date
): number {
  const inicioUTC = Date.UTC(
    inicio.getFullYear(),
    inicio.getMonth(),
    inicio.getDate()
  );

  const fimUTC = Date.UTC(
    fim.getFullYear(),
    fim.getMonth(),
    fim.getDate()
  );

  return Math.round(
    (fimUTC - inicioUTC) / 86400000
  ) + 1;
}

function criarDias(
  inicio: Date,
  quantidade: number
): Dia[] {
  return Array.from({ length: quantidade }, (_, index) => {
    const data = new Date(inicio);
    data.setDate(data.getDate() + index);

    return {
      data: chaveData(data),
      label: data
        .toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        })
        .replace(".", ""),
      faturamento: 0,
      lucro: 0,
    };
  });
}

function faturamentoAposPromocao(venda: Venda): number {
  const bruto = centavos(numero(venda.faturamento));

  const desconto = centavos(
    (bruto / 100) * (numero(venda.promocao) / 100)
  );

  return (bruto - desconto) / 100;
}

function escalaArredondada(valor: number): number {
  if (valor <= 0) return 0;

  const magnitude = Math.pow(
    10,
    Math.floor(Math.log10(valor))
  );

  const normalizado = valor / magnitude;

  if (normalizado <= 1) return magnitude;
  if (normalizado <= 2) return 2 * magnitude;
  if (normalizado <= 5) return 5 * magnitude;

  return 10 * magnitude;
}

function criarLinha(pontos: Ponto[]): string {
  if (!pontos.length) return "";

  let caminho = `M ${pontos[0].x} ${pontos[0].y}`;

  for (let i = 0; i < pontos.length - 1; i++) {
    const atual = pontos[i];
    const proximo = pontos[i + 1];
    const meio = (atual.x + proximo.x) / 2;

    caminho += ` C ${meio} ${atual.y}, ${meio} ${proximo.y}, ${proximo.x} ${proximo.y}`;
  }

  return caminho;
}

function deveMostrarData(
  index: number,
  quantidade: number
): boolean {
  if (quantidade <= 7) return true;
  if (quantidade <= 15) return index % 2 === 0;
  if (quantidade <= 30) return index % 5 === 0;
  if (quantidade <= 60) return index % 10 === 0;

  return index % 15 === 0;
}

export default function SalesChart({
  dataInicio,
  dataFim,
}: Props) {
  const gradientId = useId().replace(/:/g, "");

  const [dadosAtuais, setDadosAtuais] = useState<Dia[]>([]);
  const [dadosAnteriores, setDadosAnteriores] = useState<Dia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      setCarregando(true);
      setErro(null);
      setHoverIndex(null);

      try {
        const { data: auth, error: erroAuth } =
          await supabase.auth.getUser();

        if (erroAuth) throw erroAuth;

        if (!auth.user) {
          throw new Error("Usuário não autenticado.");
        }

        const hoje = new Date();

        const inicioAtual = dataInicio
          ? criarDataLocal(dataInicio)
          : new Date(hoje);

        const fimAtual = dataFim
          ? criarDataLocal(dataFim, true)
          : new Date(hoje);

        if (!dataInicio) {
          inicioAtual.setHours(0, 0, 0, 0);
          inicioAtual.setDate(inicioAtual.getDate() - 6);
        }

        if (!dataFim) {
          fimAtual.setHours(23, 59, 59, 999);
        }

        if (inicioAtual > fimAtual) {
          throw new Error(
            "A data inicial não pode ser maior que a final."
          );
        }

        const quantidade = quantidadeDiasEntre(
          inicioAtual,
          fimAtual
        );

        const inicioAnterior = new Date(inicioAtual);
        inicioAnterior.setDate(
          inicioAnterior.getDate() - quantidade
        );

        const fimAnterior = new Date(inicioAtual);
        fimAnterior.setMilliseconds(-1);

        const atuais = criarDias(
          inicioAtual,
          quantidade
        );

        const anteriores = criarDias(
          inicioAnterior,
          quantidade
        );

        const mapaAtual = new Map(
          atuais.map((dia) => [dia.data, dia])
        );

        const mapaAnterior = new Map(
          anteriores.map((dia) => [dia.data, dia])
        );

        const vendas: Venda[] = [];
        const lote = 1000;

        for (let pagina = 0; ; pagina++) {
          const { data, error } = await supabase
            .from("vendas")
            .select(
              "data_venda,faturamento,promocao,lucro"
            )
            .eq("user_id", auth.user.id)
            .gte(
              "data_venda",
              inicioAnterior.toISOString()
            )
            .lte(
              "data_venda",
              fimAtual.toISOString()
            )
            .order("data_venda", {
              ascending: true,
            })
            .order("id", {
              ascending: true,
            })
            .range(
              pagina * lote,
              (pagina + 1) * lote - 1
            );

          if (error) throw error;

          const registros = (data ?? []) as Venda[];

          vendas.push(...registros);

          if (registros.length < lote) break;
        }

        for (const venda of vendas) {
          const dataVenda = new Date(venda.data_venda);
          const chave = chaveData(dataVenda);

          let dia: Dia | undefined;

          if (
            dataVenda >= inicioAtual &&
            dataVenda <= fimAtual
          ) {
            dia = mapaAtual.get(chave);
          } else if (
            dataVenda >= inicioAnterior &&
            dataVenda <= fimAnterior
          ) {
            dia = mapaAnterior.get(chave);
          }

          if (!dia) continue;

          dia.faturamento += faturamentoAposPromocao(venda);

          // Preserva o lucro líquido já registrado
          // na venda, sem recalcular os custos.
          dia.lucro += numero(venda.lucro);
        }

        if (!ativo) return;

        setDadosAtuais(atuais);
        setDadosAnteriores(anteriores);
      } catch (e) {
        if (!ativo) return;

        setErro(
          e instanceof Error
            ? e.message
            : "Não foi possível carregar o gráfico."
        );

        setDadosAtuais([]);
        setDadosAnteriores([]);
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregarDados();

    return () => {
      ativo = false;
    };
  }, [dataInicio, dataFim]);

  const quantidadeDias = dadosAtuais.length;

  const totais = useMemo(() => {
    const faturamento = dadosAtuais.reduce(
      (total, dia) => total + dia.faturamento,
      0
    );

    const lucro = dadosAtuais.reduce(
      (total, dia) => total + dia.lucro,
      0
    );

    const anterior = dadosAnteriores.reduce(
      (total, dia) => total + dia.faturamento,
      0
    );

    return { faturamento, lucro, anterior };
  }, [dadosAtuais, dadosAnteriores]);

  const temBaseAnterior = totais.anterior > 0;

  const variacao = temBaseAnterior
    ? ((totais.faturamento - totais.anterior) /
        totais.anterior) *
      100
    : 0;

  const escala = useMemo(() => {
    const valores = dadosAtuais.flatMap((dia) => [
      dia.faturamento,
      dia.lucro,
    ]);

    const minimo = Math.min(0, ...valores);
    const maximo = Math.max(0, ...valores);

    const superior = escalaArredondada(maximo);

    const inferior =
      minimo < 0
        ? -escalaArredondada(Math.abs(minimo))
        : 0;

    const finalSuperior =
      superior === inferior ? superior + 1 : superior;

    return {
      minimo: inferior,
      maximo: finalSuperior,
      amplitude: finalSuperior - inferior,
    };
  }, [dadosAtuais]);

  function posicaoY(valor: number): number {
    return (
      TOPO +
      ((escala.maximo - valor) / escala.amplitude) *
        ALTURA_GRAFICO
    );
  }

  function criarPontos(
    dados: Dia[],
    campo: "faturamento" | "lucro"
  ): Ponto[] {
    return dados.map((dia, index) => ({
      x:
        ESQUERDA +
        (index / Math.max(dados.length - 1, 1)) *
          LARGURA_GRAFICO,
      y: posicaoY(dia[campo]),
    }));
  }

  const pontosFaturamento = criarPontos(
    dadosAtuais,
    "faturamento"
  );

  const pontosLucro = criarPontos(
    dadosAtuais,
    "lucro"
  );

  const linhaFaturamento = criarLinha(
    pontosFaturamento
  );

  const linhaLucro = criarLinha(pontosLucro);

  const areaFaturamento =
    pontosFaturamento.length > 0
      ? `${linhaFaturamento}
         L ${pontosFaturamento[pontosFaturamento.length - 1].x} ${posicaoY(0)}
         L ${pontosFaturamento[0].x} ${posicaoY(0)}
         Z`
      : "";

  const temMovimento = dadosAtuais.some(
    (dia) => dia.faturamento !== 0 || dia.lucro !== 0
  );

  const diaSelecionado =
    hoverIndex !== null
      ? dadosAtuais[hoverIndex]
      : undefined;

  const posicaoTooltip =
    hoverIndex !== null && pontosFaturamento[hoverIndex]
      ? Math.min(
          88,
          Math.max(
            12,
            (pontosFaturamento[hoverIndex].x / LARGURA) *
              100
          )
        )
      : 50;

  return (
    <div className="relative flex h-full min-h-[260px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#1B3451] bg-[#0B2039] p-3 shadow-[0_12px_32px_rgba(0,0,0,0.15)] sm:p-3.5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-orange-500/[0.035] to-transparent" />

      {/* CABEÇALHO */}
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
            <TrendingUp size={17} />
          </span>

          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-white">
              Faturamento e Lucro Líquido
            </h2>

            <p className="mt-1 text-[11px] text-slate-400">
              Evolução financeira no período selecionado
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#28405E] bg-[#11243D] px-3 py-2 text-[11px] text-slate-300">
          <CalendarDays
            size={14}
            className="text-orange-400"
          />

          <span>
            {quantidadeDias || "—"} dias
          </span>
        </div>
      </div>

      {/* LEGENDA */}
      <div className="relative mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex items-center gap-2">
          <span className="h-[3px] w-5 rounded-full bg-orange-500" />
          <span className="text-[11px] text-slate-300">
            Faturamento
          </span>
          <span className="text-[11px] font-bold text-white">
            {carregando ? "..." : moeda(totais.faturamento)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-[3px] w-5 rounded-full bg-blue-500" />
          <span className="text-[11px] text-slate-300">
            Lucro líquido
          </span>
          <span
            className={`text-[11px] font-bold ${
              totais.lucro < 0
                ? "text-red-400"
                : "text-white"
            }`}
          >
            {carregando ? "..." : moeda(totais.lucro)}
          </span>
        </div>
      </div>

      {/* GRÁFICO */}
      <div className="relative mt-2 h-[160px] min-h-[160px] flex-1">
        {erro ? (
          <div
            role="alert"
            className="flex h-full items-center justify-center gap-2 text-sm text-red-300"
          >
            <AlertCircle size={18} />
            {erro}
          </div>
        ) : carregando ? (
          <div className="flex h-full items-center justify-center gap-2 text-xs text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-orange-400" />
            Carregando gráfico...
          </div>
        ) : !temMovimento ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <TrendingUp
              size={28}
              className="mb-3 text-slate-600"
            />
            <p className="text-sm text-slate-300">
              Sem movimentação no período
            </p>
            <p className="mt-1 text-xs text-slate-500">
              As vendas registradas aparecerão aqui.
            </p>
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${LARGURA} ${ALTURA}`}
              preserveAspectRatio="none"
              className="h-full w-full overflow-visible"
              role="img"
              aria-label="Gráfico de faturamento e lucro líquido por dia"
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient
                  id={gradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#F97316"
                    stopOpacity="0.23"
                  />
                  <stop
                    offset="100%"
                    stopColor="#F97316"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {/* LINHAS HORIZONTAIS */}
              {[0, 0.25, 0.5, 0.75, 1].map(
                (fracao) => {
                  const valor =
                    escala.minimo +
                    escala.amplitude * fracao;

                  const y = posicaoY(valor);

                  return (
                    <g key={fracao}>
                      <line
                        x1={ESQUERDA}
                        y1={y}
                        x2={LARGURA - DIREITA}
                        y2={y}
                        stroke="#263B55"
                        strokeWidth="1"
                        strokeDasharray="4 6"
                        opacity="0.8"
                      />

                      <text
                        x="0"
                        y={y + 5}
                        fill="#7C8DA4"
                        fontSize="12"
                      >
                        {moedaEixo(valor)}
                      </text>
                    </g>
                  );
                }
              )}

              {/* LINHA DO ZERO */}
              <line
                x1={ESQUERDA}
                y1={posicaoY(0)}
                x2={LARGURA - DIREITA}
                y2={posicaoY(0)}
                stroke="#526781"
                strokeWidth="1"
                opacity="0.6"
              />

              {/* ÁREA DO FATURAMENTO */}
              {areaFaturamento && (
                <path
                  d={areaFaturamento}
                  fill={`url(#${gradientId})`}
                />
              )}

              {/* FATURAMENTO - LARANJA */}
              <path
                d={linhaFaturamento}
                fill="none"
                stroke="#F97316"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* LUCRO - AZUL */}
              <path
                d={linhaLucro}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* PONTOS */}
              {pontosFaturamento.map((ponto, index) => {
                const pontoLucro = pontosLucro[index];
                const ativo = hoverIndex === index;

                const xAnterior =
                  index === 0
                    ? ESQUERDA
                    : (pontosFaturamento[index - 1].x +
                        ponto.x) /
                      2;

                const xProximo =
                  index === pontosFaturamento.length - 1
                    ? LARGURA - DIREITA
                    : (ponto.x +
                        pontosFaturamento[index + 1].x) /
                      2;

                return (
                  <g key={dadosAtuais[index].data}>
                    {ativo && (
                      <line
                        x1={ponto.x}
                        y1={TOPO}
                        x2={ponto.x}
                        y2={TOPO + ALTURA_GRAFICO}
                        stroke="#64748B"
                        strokeDasharray="5 5"
                        opacity="0.8"
                      />
                    )}

                    <circle
                      cx={ponto.x}
                      cy={ponto.y}
                      r={ativo ? 5 : 3}
                      fill={ativo ? "#FFFFFF" : "#F97316"}
                      stroke="#F97316"
                      strokeWidth="2"
                    />

                    <circle
                      cx={pontoLucro.x}
                      cy={pontoLucro.y}
                      r={ativo ? 5 : 3}
                      fill={ativo ? "#FFFFFF" : "#3B82F6"}
                      stroke="#3B82F6"
                      strokeWidth="2"
                    />

                    {deveMostrarData(
                      index,
                      quantidadeDias
                    ) && (
                      <text
                        x={ponto.x}
                        y={ALTURA - 8}
                        textAnchor="middle"
                        fill={
                          ativo ? "#FDBA74" : "#8191A8"
                        }
                        fontSize="12"
                      >
                        {dadosAtuais[index].label}
                      </text>
                    )}

                    {/* ÁREA DE INTERAÇÃO */}
                    <rect
                      x={xAnterior}
                      y={TOPO}
                      width={Math.max(
                        1,
                        xProximo - xAnterior
                      )}
                      height={ALTURA_GRAFICO}
                      fill="transparent"
                      onMouseEnter={() =>
                        setHoverIndex(index)
                      }
                    />
                  </g>
                );
              })}
            </svg>

            {/* TOOLTIP */}
            {diaSelecionado && (
              <div
                className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-xl border border-[#304966] bg-[#071629] px-3 py-2.5 shadow-[0_15px_35px_rgba(0,0,0,0.4)]"
                style={{
                  left: `${posicaoTooltip}%`,
                  top: 8,
                }}
              >
                <p className="mb-2 text-[11px] font-semibold text-slate-200">
                  {diaSelecionado.label}
                </p>

                <div className="flex items-center justify-between gap-5 text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    Faturamento
                  </span>

                  <strong className="text-white">
                    {moeda(diaSelecionado.faturamento)}
                  </strong>
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-5 text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Lucro
                  </span>

                  <strong
                    className={
                      diaSelecionado.lucro < 0
                        ? "text-red-400"
                        : "text-white"
                    }
                  >
                    {moeda(diaSelecionado.lucro)}
                  </strong>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* RODAPÉ */}
      <div className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#233754] pt-2">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-slate-400">
            Comparação de faturamento:
          </span>

          {carregando ? (
            <span className="text-slate-500">...</span>
          ) : !temBaseAnterior ? (
            <span className="text-slate-400">
              Sem base anterior
            </span>
          ) : (
            <span
              className={`font-semibold ${
                variacao > 0
                  ? "text-emerald-400"
                  : variacao < 0
                  ? "text-red-400"
                  : "text-slate-400"
              }`}
            >
              {variacao > 0 ? "+" : ""}
              {variacao.toFixed(1).replace(".", ",")}% vs.
              período anterior
            </span>
          )}
        </div>

        <span className="text-[12px] font-bold text-white">
          {carregando
            ? "..."
            : moeda(totais.faturamento)}
        </span>
      </div>
    </div>
  );
}