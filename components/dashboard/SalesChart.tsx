"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Venda = {
  data_venda: string;
  faturamento: number | null;
};

type Dia = {
  data: string;
  label: string;
  valor: number;
};

type Props = {
  dataInicio?: string;
  dataFim?: string;
};

type Ponto = Dia & {
  x: number;
  y: number;
};

export default function SalesChart({
  dataInicio,
  dataFim,
}: Props) {
  const [dadosAtuais, setDadosAtuais] = useState<Dia[]>([]);
  const [dadosAnteriores, setDadosAnteriores] = useState<Dia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [quantidadeDias, setQuantidadeDias] = useState(7);

  useEffect(() => {
    carregarDados();
  }, [dataInicio, dataFim]);

  function criarDataLocal(
    valor: string,
    finalDoDia = false
  ) {
    const [ano, mes, dia] = valor
      .split("-")
      .map(Number);

    const data = new Date(
      ano,
      mes - 1,
      dia
    );

    if (finalDoDia) {
      data.setHours(
        23,
        59,
        59,
        999
      );
    } else {
      data.setHours(
        0,
        0,
        0,
        0
      );
    }

    return data;
  }

  function formatarChaveData(
    data: Date
  ) {
    const ano =
      data.getFullYear();

    const mes = String(
      data.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
      data.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function criarDias(
    inicio: Date,
    quantidade: number
  ) {
    const resultado: Dia[] = [];

    for (
      let index = 0;
      index < quantidade;
      index++
    ) {
      const dataDia =
        new Date(inicio);

      dataDia.setDate(
        dataDia.getDate() +
          index
      );

      resultado.push({
        data:
          formatarChaveData(
            dataDia
          ),

        label: dataDia
          .toLocaleDateString(
            "pt-BR",
            {
              day: "2-digit",
              month: "short",
            }
          )
          .replace(".", ""),

        valor: 0,
      });
    }

    return resultado;
  }

  async function carregarDados() {
    setCarregando(true);
    setHoverIndex(null);

    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setDadosAtuais([]);
        setDadosAnteriores([]);
        return;
      }

      /*
       * ============================================================
       * PERÍODO ATUAL
       * ============================================================
       */

      const hoje = new Date();

      const inicioAtual =
        dataInicio
          ? criarDataLocal(
              dataInicio
            )
          : (() => {
              const data =
                new Date();

              data.setHours(
                0,
                0,
                0,
                0
              );

              data.setDate(
                data.getDate() -
                  6
              );

              return data;
            })();

      const fimAtual =
        dataFim
          ? criarDataLocal(
              dataFim,
              true
            )
          : (() => {
              const data =
                new Date();

              data.setHours(
                23,
                59,
                59,
                999
              );

              return data;
            })();

      if (
        inicioAtual >
        fimAtual
      ) {
        console.error(
          "A data inicial não pode ser maior que a data final."
        );

        setDadosAtuais([]);
        setDadosAnteriores([]);
        return;
      }

      /*
       * ============================================================
       * QUANTIDADE DE DIAS
       * ============================================================
       */

      const inicioSomenteData =
        new Date(
          inicioAtual
        );

      inicioSomenteData.setHours(
        0,
        0,
        0,
        0
      );

      const fimSomenteData =
        new Date(
          fimAtual
        );

      fimSomenteData.setHours(
        0,
        0,
        0,
        0
      );

      const diferencaMs =
        fimSomenteData.getTime() -
        inicioSomenteData.getTime();

      const diasPeriodo =
        Math.floor(
          diferencaMs /
            (
              1000 *
              60 *
              60 *
              24
            )
        ) + 1;

      setQuantidadeDias(
        diasPeriodo
      );

      /*
       * ============================================================
       * PERÍODO ANTERIOR
       *
       * Exemplo:
       *
       * Atual:
       * 06/08 até 12/08
       *
       * Anterior:
       * 30/07 até 05/08
       * ============================================================
       */

      const fimAnterior =
        new Date(
          inicioAtual
        );

      fimAnterior.setMilliseconds(
        -1
      );

      const inicioAnterior =
        new Date(
          inicioAtual
        );

      inicioAnterior.setDate(
        inicioAnterior.getDate() -
          diasPeriodo
      );

      /*
       * ============================================================
       * CONSULTA
       * ============================================================
       */

      const {
        data,
        error,
      } = await supabase
        .from("vendas")
        .select(
          "data_venda, faturamento"
        )
        .eq(
          "user_id",
          user.id
        )
        .gte(
          "data_venda",
          inicioAnterior.toISOString()
        )
        .lte(
          "data_venda",
          fimAtual.toISOString()
        )
        .order(
          "data_venda",
          {
            ascending: true,
          }
        );

      if (error) {
        console.error(
          "Erro ao carregar gráfico de vendas:",
          error
        );

        setDadosAtuais([]);
        setDadosAnteriores([]);
        return;
      }

      const vendas =
        (data || []) as Venda[];

      /*
       * ============================================================
       * CRIA OS DIAS DOS DOIS PERÍODOS
       * ============================================================
       */

      const atuais =
        criarDias(
          inicioAtual,
          diasPeriodo
        );

      const anteriores =
        criarDias(
          inicioAnterior,
          diasPeriodo
        );

      /*
       * ============================================================
       * DISTRIBUI FATURAMENTO
       * ============================================================
       */

      vendas.forEach(
        (venda) => {
          const dataVenda =
            new Date(
              venda.data_venda
            );

          const valor =
            Number(
              venda.faturamento ??
                0
            );

          if (
            dataVenda >=
              inicioAtual &&
            dataVenda <=
              fimAtual
          ) {
            const chave =
              formatarChaveData(
                dataVenda
              );

            const dia =
              atuais.find(
                (item) =>
                  item.data ===
                  chave
              );

            if (dia) {
              dia.valor +=
                valor;
            }
          } else if (
            dataVenda >=
              inicioAnterior &&
            dataVenda <=
              fimAnterior
          ) {
            const chave =
              formatarChaveData(
                dataVenda
              );

            const dia =
              anteriores.find(
                (item) =>
                  item.data ===
                  chave
              );

            if (dia) {
              dia.valor +=
                valor;
            }
          }
        }
      );

      setDadosAtuais(
        atuais
      );

      setDadosAnteriores(
        anteriores
      );
    } catch (error) {
      console.error(
        "Erro inesperado ao carregar gráfico de vendas:",
        error
      );

      setDadosAtuais([]);
      setDadosAnteriores([]);
    } finally {
      setCarregando(false);
    }
  }

  function formatarMoeda(
    valor: number
  ) {
    return valor.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  function formatarEixo(
    valor: number
  ) {
    if (valor <= 0) {
      return "R$ 0";
    }

    if (
      valor >=
      1000000
    ) {
      return `R$ ${(
        valor / 1000000
      )
        .toFixed(1)
        .replace(
          ".",
          ","
        )}M`;
    }

    if (
      valor >= 1000
    ) {
      return `R$ ${(
        valor / 1000
      )
        .toFixed(0)
        .replace(
          ".",
          ","
        )}k`;
    }

    return `R$ ${valor.toFixed(
      0
    )}`;
  }

  function calcularEscala(
    valor: number
  ) {
    if (valor <= 0) {
      return 0;
    }

    const magnitude =
      Math.pow(
        10,
        Math.floor(
          Math.log10(
            valor
          )
        )
      );

    const normalizado =
      valor /
      magnitude;

    if (
      normalizado <= 1
    ) {
      return magnitude;
    }

    if (
      normalizado <= 2
    ) {
      return (
        2 *
        magnitude
      );
    }

    if (
      normalizado <= 5
    ) {
      return (
        5 *
        magnitude
      );
    }

    return (
      10 *
      magnitude
    );
  }

  /*
   * ============================================================
   * TOTAIS
   * ============================================================
   */

  const faturamentoAtual =
    dadosAtuais.reduce(
      (
        total,
        item
      ) =>
        total +
        item.valor,
      0
    );

  const faturamentoAnterior =
    dadosAnteriores.reduce(
      (
        total,
        item
      ) =>
        total +
        item.valor,
      0
    );

  const variacao =
    faturamentoAnterior > 0
      ? (
          (
            faturamentoAtual -
            faturamentoAnterior
          ) /
          faturamentoAnterior
        ) * 100
      : faturamentoAtual > 0
      ? 100
      : 0;

  /*
   * ============================================================
   * ESCALA
   * ============================================================
   */

  const maiorFaturamento =
    Math.max(
      ...dadosAtuais.map(
        (item) =>
          item.valor
      ),

      ...dadosAnteriores.map(
        (item) =>
          item.valor
      ),

      0
    );

  const temVendas =
    maiorFaturamento > 0;

  const maiorValor =
    temVendas
      ? calcularEscala(
          maiorFaturamento
        )
      : 0;

  /*
   * ============================================================
   * SVG
   * ============================================================
   */

  const largura = 1000;
  const altura = 220;

  const paddingEsquerda =
    62;

  const paddingDireita =
    12;

  const paddingTopo =
    12;

  const paddingBaixo =
    32;

  const larguraGrafico =
    largura -
    paddingEsquerda -
    paddingDireita;

  const alturaGrafico =
    altura -
    paddingTopo -
    paddingBaixo;

  /*
   * ============================================================
   * PONTOS ATUAIS
   * ============================================================
   */

  const pontosAtuais =
    useMemo<Ponto[]>(
      () => {
        if (
          !dadosAtuais.length
        ) {
          return [];
        }

        return dadosAtuais.map(
          (
            item,
            index
          ) => {
            const x =
              paddingEsquerda +
              (
                index /
                Math.max(
                  dadosAtuais.length -
                    1,
                  1
                )
              ) *
                larguraGrafico;

            const y =
              temVendas
                ? paddingTopo +
                  alturaGrafico -
                  (
                    item.valor /
                    maiorValor
                  ) *
                    alturaGrafico
                : paddingTopo +
                  alturaGrafico;

            return {
              ...item,
              x,
              y,
            };
          }
        );
      },
      [
        dadosAtuais,
        maiorValor,
        larguraGrafico,
        alturaGrafico,
        temVendas,
      ]
    );

  /*
   * ============================================================
   * PONTOS ANTERIORES
   * ============================================================
   */

  const pontosAnteriores =
    useMemo<Ponto[]>(
      () => {
        if (
          !dadosAnteriores.length
        ) {
          return [];
        }

        return dadosAnteriores.map(
          (
            item,
            index
          ) => {
            const x =
              paddingEsquerda +
              (
                index /
                Math.max(
                  dadosAnteriores.length -
                    1,
                  1
                )
              ) *
                larguraGrafico;

            const y =
              temVendas
                ? paddingTopo +
                  alturaGrafico -
                  (
                    item.valor /
                    maiorValor
                  ) *
                    alturaGrafico
                : paddingTopo +
                  alturaGrafico;

            return {
              ...item,
              x,
              y,
            };
          }
        );
      },
      [
        dadosAnteriores,
        maiorValor,
        larguraGrafico,
        alturaGrafico,
        temVendas,
      ]
    );

  /*
   * ============================================================
   * LINHA SUAVE
   * ============================================================
   */

  function criarLinhaSuave(
    pontos: Ponto[]
  ) {
    if (
      !pontos.length
    ) {
      return "";
    }

    if (
      pontos.length ===
      1
    ) {
      return `M ${pontos[0].x} ${pontos[0].y}`;
    }

    let caminho =
      `M ${pontos[0].x} ${pontos[0].y}`;

    for (
      let i = 0;
      i <
      pontos.length - 1;
      i++
    ) {
      const atual =
        pontos[i];

      const proximo =
        pontos[i + 1];

      const meioX =
        (
          atual.x +
          proximo.x
        ) / 2;

      caminho += `
        C
        ${meioX} ${atual.y},
        ${meioX} ${proximo.y},
        ${proximo.x} ${proximo.y}
      `;
    }

    return caminho;
  }

  const linhaAtual =
    criarLinhaSuave(
      pontosAtuais
    );

  const linhaAnterior =
    criarLinhaSuave(
      pontosAnteriores
    );

  const areaAtual =
    pontosAtuais.length >
    0
      ? `${linhaAtual}
         L ${
           pontosAtuais[
             pontosAtuais.length -
               1
           ].x
         }
         ${
           paddingTopo +
           alturaGrafico
         }
         L ${
           pontosAtuais[0]
             .x
         }
         ${
           paddingTopo +
           alturaGrafico
         }
         Z`
      : "";

  const linhasEixo = [
    1,
    0.75,
    0.5,
    0.25,
    0,
  ];

  /*
   * ============================================================
   * QUANTIDADE DE LABELS
   * ============================================================
   */

  function mostrarLabel(
    index: number
  ) {
    if (
      quantidadeDias <= 7
    ) {
      return true;
    }

    if (
      quantidadeDias <= 15
    ) {
      return (
        index % 2 === 0
      );
    }

    if (
      quantidadeDias <= 30
    ) {
      return (
        index % 5 === 0
      );
    }

    if (
      quantidadeDias <= 60
    ) {
      return (
        index % 10 ===
        0
      );
    }

    return (
      index % 15 === 0
    );
  }

  return (
    <div
      className="
        relative
        h-[310px]
        overflow-hidden
        rounded-[14px]
        border
        border-[#233754]
        bg-[#0d1b2f]
        px-4
        py-3
        shadow-[0_8px_24px_rgba(0,0,0,0.15)]
      "
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-blue-500/[0.035] to-transparent" />

      <div className="relative flex h-full flex-col">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-bold text-white">
              Faturamento
            </h2>

            <div className="mt-1 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-[2px] w-4 rounded-full bg-blue-500" />

                <span className="text-[8px] text-slate-500">
                  Período atual
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-4 border-t border-dashed border-slate-500" />

                <span className="text-[8px] text-slate-500">
                  Período anterior
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="
              flex
              h-7
              items-center
              gap-1
              rounded-md
              border
              border-[#28405e]
              bg-[#11243d]
              px-2
              text-[9px]
              font-medium
              text-slate-400
            "
          >
            {quantidadeDias} dias

            <ChevronDown
              size={11}
            />
          </button>
        </div>

        {/* Gráfico */}
        <div className="relative mt-2 min-h-0 flex-1">
          {carregando ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />

                Carregando...
              </div>
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${largura} ${altura}`}
              preserveAspectRatio="none"
              className="h-full w-full overflow-visible"
              onMouseLeave={() =>
                setHoverIndex(
                  null
                )
              }
            >
              <defs>
                <linearGradient
                  id="salesAreaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#2563EB"
                    stopOpacity="0.26"
                  />

                  <stop
                    offset="70%"
                    stopColor="#2563EB"
                    stopOpacity="0.05"
                  />

                  <stop
                    offset="100%"
                    stopColor="#2563EB"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {/* Linhas horizontais */}
              {linhasEixo.map(
                (
                  percentual,
                  index
                ) => {
                  const y =
                    paddingTopo +
                    alturaGrafico -
                    percentual *
                      alturaGrafico;

                  const valor =
                    temVendas
                      ? maiorValor *
                        percentual
                      : 0;

                  return (
                    <g
                      key={
                        index
                      }
                    >
                      <line
                        x1={
                          paddingEsquerda
                        }
                        y1={y}
                        x2={
                          largura -
                          paddingDireita
                        }
                        y2={y}
                        stroke="#243651"
                        strokeWidth="1"
                        strokeDasharray="3 5"
                        opacity="0.75"
                      />

                      <text
                        x="0"
                        y={y + 4}
                        fill="#64748b"
                        fontSize="15"
                      >
                        {formatarEixo(
                          valor
                        )}
                      </text>
                    </g>
                  );
                }
              )}

              {/* Período anterior */}
              {linhaAnterior && (
                <path
                  d={
                    linhaAnterior
                  }
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="1.5"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.65"
                />
              )}

              {/* Área período atual */}
              {areaAtual && (
                <path
                  d={areaAtual}
                  fill="url(#salesAreaGradient)"
                />
              )}

              {/* Linha atual */}
              {linhaAtual && (
                <path
                  d={
                    linhaAtual
                  }
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Pontos atuais */}
              {pontosAtuais.map(
                (
                  ponto,
                  index
                ) => {
                  const ativo =
                    hoverIndex ===
                    index;

                  return (
                    <g
                      key={
                        ponto.data
                      }
                    >
                      <rect
                        x={
                          index ===
                          0
                            ? paddingEsquerda
                            : (
                                pontosAtuais[
                                  index -
                                    1
                                ].x +
                                ponto.x
                              ) /
                              2
                        }
                        y={
                          paddingTopo
                        }
                        width={
                          index ===
                          pontosAtuais.length -
                            1
                            ? largura -
                              paddingDireita -
                              ponto.x
                            : (
                                pontosAtuais[
                                  index +
                                    1
                                ].x -
                                ponto.x
                              ) /
                              2
                        }
                        height={
                          alturaGrafico
                        }
                        fill="transparent"
                        onMouseEnter={() =>
                          setHoverIndex(
                            index
                          )
                        }
                      />

                      {ativo && (
                        <line
                          x1={
                            ponto.x
                          }
                          y1={
                            paddingTopo
                          }
                          x2={
                            ponto.x
                          }
                          y2={
                            paddingTopo +
                            alturaGrafico
                          }
                          stroke="#475569"
                          strokeWidth="1"
                          strokeDasharray="4 5"
                        />
                      )}

                      <circle
                        cx={
                          ponto.x
                        }
                        cy={
                          ponto.y
                        }
                        r={
                          ativo
                            ? 5
                            : 3
                        }
                        fill={
                          ativo
                            ? "#ffffff"
                            : "#3B82F6"
                        }
                        stroke="#2563EB"
                        strokeWidth={
                          ativo
                            ? 3
                            : 1.5
                        }
                      />

                      {mostrarLabel(
                        index
                      ) && (
                        <text
                          x={
                            ponto.x
                          }
                          y={
                            altura -
                            7
                          }
                          textAnchor="middle"
                          fill={
                            ativo
                              ? "#93C5FD"
                              : "#64748B"
                          }
                          fontSize="14"
                        >
                          {
                            ponto.label
                          }
                        </text>
                      )}
                    </g>
                  );
                }
              )}
            </svg>
          )}

          {/* Tooltip */}
          {!carregando &&
            hoverIndex !==
              null &&
            pontosAtuais[
              hoverIndex
            ] && (
              <div
                className="
                  pointer-events-none
                  absolute
                  z-20
                  min-w-[145px]
                  -translate-x-1/2
                  -translate-y-full
                  rounded-lg
                  border
                  border-[#2b405d]
                  bg-[#091525]
                  px-2.5
                  py-2
                  shadow-[0_12px_30px_rgba(0,0,0,0.35)]
                "
                style={{
                  left: `${
                    (
                      pontosAtuais[
                        hoverIndex
                      ].x /
                      largura
                    ) *
                    100
                  }%`,

                  top: `${
                    (
                      pontosAtuais[
                        hoverIndex
                      ].y /
                      altura
                    ) *
                    100
                  }%`,
                }}
              >
                <p className="text-[8px] text-slate-500">
                  {
                    pontosAtuais[
                      hoverIndex
                    ].label
                  }
                </p>

                <div className="mt-1 flex items-center justify-between gap-4">
                  <span className="text-[8px] text-blue-400">
                    Atual
                  </span>

                  <span className="text-[10px] font-bold text-white">
                    {formatarMoeda(
                      pontosAtuais[
                        hoverIndex
                      ].valor
                    )}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between gap-4">
                  <span className="text-[8px] text-slate-500">
                    Anterior
                  </span>

                  <span className="text-[9px] font-semibold text-slate-300">
                    {formatarMoeda(
                      pontosAnteriores[
                        hoverIndex
                      ]?.valor ??
                        0
                    )}
                  </span>
                </div>
              </div>
            )}
        </div>

        {/* Rodapé */}
        <div className="mt-1 flex items-center justify-between border-t border-[#233754]/60 pt-2">
          <div>
            <span className="text-[8px] text-slate-600">
              Faturamento no período
            </span>

            {!carregando && (
              <span
                className={`ml-2 text-[8px] font-semibold ${
                  variacao >
                  0
                    ? "text-emerald-400"
                    : variacao <
                      0
                    ? "text-red-400"
                    : "text-slate-500"
                }`}
              >
                {variacao >
                0
                  ? "+"
                  : ""}

                {variacao
                  .toFixed(
                    1
                  )
                  .replace(
                    ".",
                    ","
                  )}
                %
              </span>
            )}
          </div>

          <span className="text-[11px] font-bold text-white">
            {carregando
              ? "..."
              : formatarMoeda(
                  faturamentoAtual
                )}
          </span>
        </div>
      </div>
    </div>
  );
}