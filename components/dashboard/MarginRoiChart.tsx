"use client";

import { useEffect, useState } from "react";
import { BarChart3, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Venda = {
  data_venda: string;
  faturamento: number | null;
  custo_total: number | null;
  lucro: number | null;
};

type Dia = {
  data: string;
  label: string;
  faturamento: number;
  custo: number;
  lucro: number;
  margem: number;
  roi: number;
};

type Props = {
  dataInicio?: string;
  dataFim?: string;
};

export default function MarginRoiChart({
  dataInicio,
  dataFim,
}: Props) {
  const [dados, setDados] = useState<Dia[]>([]);
  const [carregando, setCarregando] = useState(true);
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
      data.setHours(23, 59, 59, 999);
    } else {
      data.setHours(0, 0, 0, 0);
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

  async function carregarDados() {
    setCarregando(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setDados([]);
        return;
      }

      /*
       * ============================================================
       * PERÍODO
       * ============================================================
       */

      const inicio = dataInicio
        ? criarDataLocal(dataInicio)
        : (() => {
            const data = new Date();

            data.setHours(
              0,
              0,
              0,
              0
            );

            data.setDate(
              data.getDate() - 6
            );

            return data;
          })();

      const fim = dataFim
        ? criarDataLocal(
            dataFim,
            true
          )
        : (() => {
            const data = new Date();

            data.setHours(
              23,
              59,
              59,
              999
            );

            return data;
          })();

      /*
       * Proteção contra intervalo inválido
       */

      if (inicio > fim) {
        console.error(
          "A data inicial não pode ser maior que a data final."
        );

        setDados([]);
        return;
      }

      /*
       * ============================================================
       * QUANTIDADE DE DIAS
       * ============================================================
       */

      const inicioSomenteData =
        new Date(inicio);

      inicioSomenteData.setHours(
        0,
        0,
        0,
        0
      );

      const fimSomenteData =
        new Date(fim);

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
       * CONSULTA
       * ============================================================
       */

      const {
        data,
        error,
      } = await supabase
        .from("vendas")
        .select(
          "data_venda, faturamento, custo_total, lucro"
        )
        .eq(
          "user_id",
          user.id
        )
        .gte(
          "data_venda",
          inicio.toISOString()
        )
        .lte(
          "data_venda",
          fim.toISOString()
        )
        .order(
          "data_venda",
          {
            ascending: true,
          }
        );

      if (error) {
        console.error(
          "Erro ao carregar margem e ROI:",
          error
        );

        setDados([]);
        return;
      }

      /*
       * ============================================================
       * CRIA OS DIAS DO PERÍODO
       * ============================================================
       */

      const listaDias: Dia[] =
        [];

      for (
        let index = 0;
        index < diasPeriodo;
        index++
      ) {
        const dataDia =
          new Date(inicio);

        dataDia.setDate(
          dataDia.getDate() +
            index
        );

        const chave =
          formatarChaveData(
            dataDia
          );

        listaDias.push({
          data: chave,

          label: dataDia
            .toLocaleDateString(
              "pt-BR",
              {
                day: "2-digit",
                month: "short",
              }
            )
            .replace(".", ""),

          faturamento: 0,
          custo: 0,
          lucro: 0,
          margem: 0,
          roi: 0,
        });
      }

      /*
       * ============================================================
       * AGRUPA AS VENDAS POR DIA
       * ============================================================
       */

      ((data || []) as Venda[]).forEach(
        (venda) => {
          const dataVenda =
            new Date(
              venda.data_venda
            );

          const chave =
            formatarChaveData(
              dataVenda
            );

          const dia =
            listaDias.find(
              (item) =>
                item.data ===
                chave
            );

          if (!dia) {
            return;
          }

          dia.faturamento +=
            Number(
              venda.faturamento ??
                0
            );

          dia.custo +=
            Number(
              venda.custo_total ??
                0
            );

          dia.lucro +=
            Number(
              venda.lucro ??
                0
            );
        }
      );

      /*
       * ============================================================
       * MARGEM E ROI DIÁRIOS
       * ============================================================
       */

      listaDias.forEach(
        (dia) => {
          dia.margem =
            dia.faturamento > 0
              ? (
                  dia.lucro /
                  dia.faturamento
                ) * 100
              : 0;

          dia.roi =
            dia.custo > 0
              ? (
                  dia.lucro /
                  dia.custo
                ) * 100
              : 0;
        }
      );

      setDados(listaDias);
    } catch (error) {
      console.error(
        "Erro inesperado ao carregar margem e ROI:",
        error
      );

      setDados([]);
    } finally {
      setCarregando(false);
    }
  }

  /*
   * ============================================================
   * ESCALA
   * ============================================================
   */

  const maiorValor = Math.max(
    ...dados.flatMap((dia) => [
      Math.abs(dia.margem),
      Math.abs(dia.roi),
    ]),
    100
  );

  /*
   * ============================================================
   * RESUMO DO PERÍODO
   * ============================================================
   */

  const lucroPeriodo =
    dados.reduce(
      (total, dia) =>
        total + dia.lucro,
      0
    );

  const faturamentoPeriodo =
    dados.reduce(
      (total, dia) =>
        total +
        dia.faturamento,
      0
    );

  const custoPeriodo =
    dados.reduce(
      (total, dia) =>
        total + dia.custo,
      0
    );

  const margemPeriodo =
    faturamentoPeriodo > 0
      ? (
          lucroPeriodo /
          faturamentoPeriodo
        ) * 100
      : 0;

  const roiPeriodo =
    custoPeriodo > 0
      ? (
          lucroPeriodo /
          custoPeriodo
        ) * 100
      : 0;

  /*
   * ============================================================
   * LABELS
   * ============================================================
   */

  function mostrarLabel(
    index: number
  ) {
    if (quantidadeDias <= 7) {
      return true;
    }

    if (quantidadeDias <= 15) {
      return (
        index % 2 === 0
      );
    }

    if (quantidadeDias <= 30) {
      return (
        index % 5 === 0
      );
    }

    if (quantidadeDias <= 60) {
      return (
        index % 10 === 0
      );
    }

    return (
      index % 15 === 0
    );
  }

  /*
   * ============================================================
   * LARGURA DAS BARRAS
   * ============================================================
   */

  function larguraDasBarras() {
    if (quantidadeDias <= 7) {
      return "w-4";
    }

    if (quantidadeDias <= 15) {
      return "w-2.5";
    }

    if (quantidadeDias <= 30) {
      return "w-1.5";
    }

    if (quantidadeDias <= 60) {
      return "w-[4px]";
    }

    return "w-[3px]";
  }

  const larguraBarra =
    larguraDasBarras();

  return (
    <div
      className="
        relative
        h-[250px]
        overflow-hidden
        rounded-[14px]
        border
        border-[#233754]
        bg-[#0d1b2f]
        px-3.5
        py-3
        shadow-[0_8px_24px_rgba(0,0,0,0.15)]
      "
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-blue-500/[0.025] to-transparent" />

      <div className="relative flex h-full flex-col">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-[13px] font-bold text-white">
              Margem e ROI
            </h2>

            <div className="mt-1 flex items-center gap-3">

              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />

                <span className="text-[8px] text-slate-500">
                  Margem (%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <span className="text-[8px] text-slate-500">
                  ROI (%)
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
              text-[8px]
              font-medium
              text-slate-400
            "
          >
            {quantidadeDias} dias

            <ChevronDown
              size={10}
            />
          </button>

        </div>

        {/* Gráfico */}
        <div className="relative mt-2 min-h-0 flex-1">

          {carregando ? (
            <div className="flex h-full items-center justify-center">

              <div className="flex items-center gap-2 text-[9px] text-slate-500">

                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />

                Carregando...

              </div>

            </div>
          ) : (
            <>

              {/* Linhas horizontais */}
              <div className="pointer-events-none absolute inset-0">

                <div className="absolute top-0 w-full border-t border-dashed border-[#22334c]" />

                <div className="absolute top-1/3 w-full border-t border-dashed border-[#22334c]" />

                <div className="absolute top-2/3 w-full border-t border-dashed border-[#22334c]" />

                <div className="absolute bottom-0 w-full border-t border-[#22334c]" />

              </div>

              <div className="relative flex h-full items-end gap-1">

                {dados.map(
                  (
                    dia,
                    index
                  ) => {
                    const alturaMargem =
                      Math.abs(
                        dia.margem
                      ) > 0
                        ? Math.max(
                            (
                              Math.abs(
                                dia.margem
                              ) /
                              maiorValor
                            ) *
                              100,
                            4
                          )
                        : 2;

                    const alturaRoi =
                      Math.abs(
                        dia.roi
                      ) > 0
                        ? Math.max(
                            (
                              Math.abs(
                                dia.roi
                              ) /
                              maiorValor
                            ) *
                              100,
                            4
                          )
                        : 2;

                    return (
                      <div
                        key={
                          dia.data
                        }
                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                      >

                        <div className="flex h-[120px] items-end gap-[2px]">

                          {/* Margem */}
                          <div
                            className={`${larguraBarra} rounded-t-[3px] ${
                              dia.margem >=
                              0
                                ? "bg-blue-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              height: `${alturaMargem}%`,
                            }}
                            title={`Margem: ${dia.margem.toFixed(
                              2
                            )}%`}
                          />

                          {/* ROI */}
                          <div
                            className={`${larguraBarra} rounded-t-[3px] ${
                              dia.roi >=
                              0
                                ? "bg-emerald-400"
                                : "bg-red-400"
                            }`}
                            style={{
                              height: `${alturaRoi}%`,
                            }}
                            title={`ROI: ${dia.roi.toFixed(
                              2
                            )}%`}
                          />

                        </div>

                        {mostrarLabel(
                          index
                        ) && (
                          <span className="mt-1.5 whitespace-nowrap text-[7px] text-slate-600">
                            {dia.label}
                          </span>
                        )}

                      </div>
                    );
                  }
                )}

              </div>

            </>
          )}

        </div>

        {/* Rodapé */}
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#233754]/70 pt-2">

          <div className="rounded-md bg-[#101e32] px-2 py-1.5">

            <p className="text-[7px] text-slate-600">
              Margem
            </p>

            <p
              className={`mt-0.5 text-[10px] font-bold ${
                margemPeriodo >= 0
                  ? "text-blue-400"
                  : "text-red-400"
              }`}
            >
              {margemPeriodo.toFixed(
                2
              )}
              %
            </p>

          </div>

          <div className="rounded-md bg-[#101e32] px-2 py-1.5">

            <p className="text-[7px] text-slate-600">
              ROI
            </p>

            <p
              className={`mt-0.5 text-[10px] font-bold ${
                roiPeriodo >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {roiPeriodo.toFixed(
                2
              )}
              %
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}