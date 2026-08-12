"use client";

import { useEffect, useMemo, useState } from "react";
import { PieChart } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Venda = {
  produto_id: number | null;
  faturamento: number | null;
  data_venda: string;
};

type Produto = {
  id: number;
  categoria: string | null;
};

type Categoria = {
  nome: string;
  valor: number;
  percentual: number;
};

type Props = {
  dataInicio?: string;
  dataFim?: string;
};

const CORES = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#A855F7",
  "#64748B",
];

export default function CategoryPerformance({
  dataInicio,
  dataFim,
}: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
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

  async function carregarDados() {
    setCarregando(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCategorias([]);
        return;
      }

      /*
       * ============================================================
       * PERÍODO
       * ============================================================
       */

      const hoje = new Date();

      const inicioAtual = dataInicio
        ? criarDataLocal(dataInicio)
        : (() => {
            const data = new Date();

            data.setHours(0, 0, 0, 0);
            data.setDate(data.getDate() - 6);

            return data;
          })();

      const fimAtual = dataFim
        ? criarDataLocal(dataFim, true)
        : (() => {
            const data = new Date();

            data.setHours(23, 59, 59, 999);

            return data;
          })();

      if (inicioAtual > fimAtual) {
        console.error(
          "A data inicial não pode ser maior que a data final."
        );

        setCategorias([]);
        return;
      }

      const inicioSomenteData = new Date(inicioAtual);
      inicioSomenteData.setHours(0, 0, 0, 0);

      const fimSomenteData = new Date(fimAtual);
      fimSomenteData.setHours(0, 0, 0, 0);

      const diferencaMs =
        fimSomenteData.getTime() -
        inicioSomenteData.getTime();

      const diasPeriodo =
        Math.floor(
          diferencaMs /
            (1000 * 60 * 60 * 24)
        ) + 1;

      setQuantidadeDias(diasPeriodo);

      /*
       * ============================================================
       * VENDAS DO PERÍODO
       * ============================================================
       */

      const {
        data: vendasData,
        error: vendasError,
      } = await supabase
        .from("vendas")
        .select(
          "produto_id, faturamento, data_venda"
        )
        .eq("user_id", user.id)
        .gte(
          "data_venda",
          inicioAtual.toISOString()
        )
        .lte(
          "data_venda",
          fimAtual.toISOString()
        );

      if (vendasError) {
        console.error(
          "Erro ao carregar vendas por categoria:",
          vendasError
        );

        setCategorias([]);
        return;
      }

      const vendas =
        (vendasData || []) as Venda[];

      /*
       * ============================================================
       * PRODUTOS DAS VENDAS
       * ============================================================
       */

      const produtoIds = Array.from(
        new Set(
          vendas
            .map(
              (venda) =>
                venda.produto_id
            )
            .filter(
              (id): id is number =>
                typeof id === "number" &&
                Number.isFinite(id)
            )
        )
      );

      if (produtoIds.length === 0) {
        setCategorias([]);
        return;
      }

      /*
       * ============================================================
       * BUSCA CATEGORIAS
       * ============================================================
       */

      const {
        data: produtosData,
        error: produtosError,
      } = await supabase
        .from("produtos")
        .select("id, categoria")
        .eq("user_id", user.id)
        .in("id", produtoIds);

      if (produtosError) {
        console.error(
          "Erro ao carregar categorias:",
          produtosError
        );

        setCategorias([]);
        return;
      }

      const produtos =
        (produtosData || []) as Produto[];

      const categoriaPorProduto =
        new Map<number, string>();

      produtos.forEach((produto) => {
        categoriaPorProduto.set(
          produto.id,
          produto.categoria?.trim() ||
            "Sem categoria"
        );
      });

      /*
       * ============================================================
       * AGRUPAMENTO
       * ============================================================
       */

      const agrupado =
        new Map<string, number>();

      vendas.forEach((venda) => {
        const categoria =
          venda.produto_id
            ? categoriaPorProduto.get(
                venda.produto_id
              ) || "Sem categoria"
            : "Sem categoria";

        agrupado.set(
          categoria,
          (agrupado.get(categoria) || 0) +
            Number(
              venda.faturamento ?? 0
            )
        );
      });

      const total = Array.from(
        agrupado.values()
      ).reduce(
        (soma, valor) =>
          soma + valor,
        0
      );

      const ordenadas =
        Array.from(
          agrupado.entries()
        )
          .map(
            ([nome, valor]) => ({
              nome,
              valor,
              percentual:
                total > 0
                  ? (valor / total) * 100
                  : 0,
            })
          )
          .sort(
            (a, b) =>
              b.valor - a.valor
          );

      /*
       * ============================================================
       * TOP 4 + OUTROS
       * ============================================================
       */

      if (ordenadas.length > 5) {
        const principais =
          ordenadas.slice(0, 4);

        const restantes =
          ordenadas.slice(4);

        const valorOutros =
          restantes.reduce(
            (soma, item) =>
              soma + item.valor,
            0
          );

        principais.push({
          nome: "Outros",
          valor: valorOutros,
          percentual:
            total > 0
              ? (valorOutros / total) * 100
              : 0,
        });

        setCategorias(principais);
      } else {
        setCategorias(ordenadas);
      }
    } catch (error) {
      console.error(
        "Erro inesperado ao carregar categorias:",
        error
      );

      setCategorias([]);
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

  const total = categorias.reduce(
    (soma, categoria) =>
      soma + categoria.valor,
    0
  );

  /*
   * ============================================================
   * DONUT
   * ============================================================
   */

  const raio = 58;

  const circunferencia =
    2 * Math.PI * raio;

  const segmentos = useMemo(() => {
    if (total <= 0) {
      return [];
    }

    let acumulado = 0;

    return categorias.map(
      (categoria, index) => {
        const proporcao =
          categoria.valor / total;

        const tamanho =
          proporcao * circunferencia;

        const item = {
          ...categoria,

          cor:
            CORES[
              index % CORES.length
            ],

          dasharray: `${tamanho} ${
            circunferencia - tamanho
          }`,

          dashoffset:
            -acumulado,
        };

        acumulado += tamanho;

        return item;
      }
    );
  }, [
    categorias,
    total,
    circunferencia,
  ]);

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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-violet-500/[0.035] to-transparent" />

      <div className="relative flex h-full flex-col">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-bold text-white">
              Desempenho por Categoria
            </h2>

            <p className="mt-0.5 text-[8px] text-slate-600">
              Participação no faturamento • {quantidadeDias} dias
            </p>
          </div>

          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-500/10 bg-violet-500/10">
            <PieChart
              size={13}
              className="text-violet-400"
            />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="mt-2 min-h-0 flex-1">
          {carregando ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-violet-400" />

                Carregando...
              </div>
            </div>
          ) : total <= 0 ? (
            <div className="grid h-full grid-cols-[150px_1fr] items-center gap-3">
              <div className="relative flex items-center justify-center">
                <svg
                  width="138"
                  height="138"
                  viewBox="0 0 150 150"
                >
                  <circle
                    cx="75"
                    cy="75"
                    r="52"
                    fill="none"
                    stroke="#192b42"
                    strokeWidth="20"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[12px] font-bold text-white">
                    R$ 0,00
                  </p>

                  <p className="text-[8px] text-slate-600">
                    Total
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Categoria 1",
                  "Categoria 2",
                  "Categoria 3",
                  "Categoria 4",
                  "Outros",
                ].map(
                  (
                    nome,
                    index
                  ) => (
                    <div
                      key={nome}
                      className="flex items-center gap-2"
                    >
                      <span
                        className="h-2 w-2 rounded-full opacity-25"
                        style={{
                          backgroundColor:
                            CORES[
                              index %
                                CORES.length
                            ],
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-slate-700">
                            {nome}
                          </span>

                          <span className="text-[8px] text-slate-700">
                            0,0%
                          </span>
                        </div>

                        <div className="mt-0.5 text-[9px] font-semibold text-slate-700">
                          R$ 0,00
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="grid h-full grid-cols-[155px_1fr] items-center gap-4">

              {/* Donut */}
              <div className="relative flex items-center justify-center">
                <svg
                  width="145"
                  height="145"
                  viewBox="0 0 150 150"
                  className="-rotate-90"
                >
                  <circle
                    cx="75"
                    cy="75"
                    r={raio}
                    fill="none"
                    stroke="#192b42"
                    strokeWidth="20"
                  />

                  {segmentos.map(
                    (segmento) => (
                      <circle
                        key={
                          segmento.nome
                        }
                        cx="75"
                        cy="75"
                        r={raio}
                        fill="none"
                        stroke={
                          segmento.cor
                        }
                        strokeWidth="20"
                        strokeDasharray={
                          segmento.dasharray
                        }
                        strokeDashoffset={
                          segmento.dashoffset
                        }
                      />
                    )
                  )}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="max-w-[95px] truncate text-center text-[11px] font-bold text-white">
                    {formatarMoeda(
                      total
                    )}
                  </p>

                  <p className="text-[8px] text-slate-600">
                    Total
                  </p>
                </div>
              </div>

              {/* Legenda */}
              <div className="space-y-2.5">
                {categorias.map(
                  (
                    categoria,
                    index
                  ) => (
                    <div
                      key={
                        categoria.nome
                      }
                      className="flex items-center gap-2"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            CORES[
                              index %
                                CORES.length
                            ],
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[8px] text-slate-400">
                              {
                                categoria.nome
                              }
                            </p>

                            <p className="mt-0.5 truncate text-[9px] font-bold text-white">
                              {formatarMoeda(
                                categoria.valor
                              )}
                            </p>
                          </div>

                          <span className="text-[8px] text-slate-500">
                            {categoria.percentual.toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="mt-1 border-t border-[#233754]/60 pt-2">
          <p className="text-center text-[8px] text-slate-600">
            Distribuição por categoria • {quantidadeDias} dias
          </p>
        </div>
      </div>
    </div>
  );
}