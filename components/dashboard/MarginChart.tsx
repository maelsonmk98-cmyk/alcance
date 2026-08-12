"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  TrendingUp,
  PieChart,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Produto = {
  categoria: string | null;
  estoque: number | null;
  custo: number | null;
  preco_venda: number | null;
  comissao: number | null;
  impostos: number | null;
  embalagem: number | null;
  frete: number | null;
  outras_despesas: number | null;
  acos: number | null;
  promocao: number | null;
};

type Faixa = {
  label: string;
  quantidade: number;
  percentual: number;
  cor: string;
  barra: string;
  texto: string;
};

type Categoria = {
  nome: string;
  quantidade: number;
  percentual: number;
  cor: string;
};

const CORES_CATEGORIA = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#A855F7",
  "#F97316",
  "#06B6D4",
];

export default function MarginChart() {
  const [produtos, setProdutos] =
    useState<Produto[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    async function carregarProdutos() {
      setCarregando(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setProdutos([]);
          return;
        }

        const { data, error } =
          await supabase
            .from("produtos")
            .select(
              `
              categoria,
              estoque,
              custo,
              preco_venda,
              comissao,
              impostos,
              embalagem,
              frete,
              outras_despesas,
              acos,
              promocao
              `
            )
            .eq("user_id", user.id);

        if (error) {
          console.error(
            "Erro ao carregar produtos para os gráficos:",
            error
          );

          setProdutos([]);
          return;
        }

        setProdutos(
          (data || []) as Produto[]
        );
      } catch (error) {
        console.error(
          "Erro inesperado ao carregar gráficos:",
          error
        );

        setProdutos([]);
      } finally {
        setCarregando(false);
      }
    }

    carregarProdutos();
  }, []);

  function calcularMargem(
    produto: Produto
  ) {
    const custo = Number(
      produto.custo ?? 0
    );

    const venda = Number(
      produto.preco_venda ?? 0
    );

    const comissao = Number(
      produto.comissao ?? 0
    );

    const impostos = Number(
      produto.impostos ?? 0
    );

    const embalagem = Number(
      produto.embalagem ?? 0
    );

    const frete = Number(
      produto.frete ?? 0
    );

    const outras = Number(
      produto.outras_despesas ?? 0
    );

    const acos = Number(
      produto.acos ?? 0
    );

    const promocao = Number(
      produto.promocao ?? 0
    );

    if (venda <= 0) {
      return 0;
    }

    const lucro =
      venda -
      custo -
      venda * (comissao / 100) -
      venda * (impostos / 100) -
      embalagem -
      frete -
      outras -
      venda * (acos / 100) -
      venda * (promocao / 100);

    return (
      (lucro / venda) * 100
    );
  }

  // ============================================================
  // TOTAL DE UNIDADES
  // ============================================================

  const totalProdutos =
    produtos.reduce(
      (total, produto) =>
        total +
        Math.max(
          0,
          Number(
            produto.estoque ?? 0
          )
        ),
      0
    );

  // ============================================================
  // CATEGORIAS
  // ============================================================

  const categorias =
    useMemo<Categoria[]>(
      () => {
        const mapa =
          new Map<string, number>();

        produtos.forEach(
          (produto) => {
            const quantidade =
              Math.max(
                0,
                Number(
                  produto.estoque ?? 0
                )
              );

            const categoria =
              produto.categoria?.trim() ||
              "Sem categoria";

            mapa.set(
              categoria,
              (mapa.get(categoria) || 0) +
                quantidade
            );
          }
        );

        const lista =
          Array.from(
            mapa.entries()
          )
            .map(
              ([nome, quantidade]) => ({
                nome,
                quantidade,
              })
            )
            .sort(
              (a, b) =>
                b.quantidade -
                a.quantidade
            );

        let resultado =
          lista;

        if (lista.length > 5) {
          const principais =
            lista.slice(0, 4);

          const outros =
            lista
              .slice(4)
              .reduce(
                (total, item) =>
                  total +
                  item.quantidade,
                0
              );

          resultado = [
            ...principais,
            {
              nome: "Outros",
              quantidade: outros,
            },
          ];
        }

        return resultado.map(
          (
            categoria,
            index
          ) => ({
            ...categoria,

            percentual:
              totalProdutos > 0
                ? (categoria.quantidade /
                    totalProdutos) *
                  100
                : 0,

            cor:
              CORES_CATEGORIA[
                index %
                  CORES_CATEGORIA.length
              ],
          })
        );
      },
      [
        produtos,
        totalProdutos,
      ]
    );

  // ============================================================
  // DONUT CATEGORIAS
  // ============================================================

  const raioCategoria = 44;

  const circunferenciaCategoria =
    2 *
    Math.PI *
    raioCategoria;

  const segmentosCategoria =
    useMemo(() => {
      if (totalProdutos <= 0) {
        return [];
      }

      let acumulado = 0;

      return categorias.map(
        (categoria) => {
          const tamanho =
            (categoria.quantidade /
              totalProdutos) *
            circunferenciaCategoria;

          const item = {
            ...categoria,

            dasharray: `${tamanho} ${
              circunferenciaCategoria -
              tamanho
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
      totalProdutos,
      circunferenciaCategoria,
    ]);

  // ============================================================
  // MARGEM POR FAIXA
  // ============================================================

  let acima30 = 0;
  let entre20e30 = 0;
  let entre10e20 = 0;
  let abaixo10 = 0;

  produtos.forEach(
    (produto) => {
      const quantidade =
        Math.max(
          0,
          Number(
            produto.estoque ?? 0
          )
        );

      const margem =
        calcularMargem(
          produto
        );

      if (margem > 30) {
        acima30 +=
          quantidade;
      } else if (
        margem >= 20
      ) {
        entre20e30 +=
          quantidade;
      } else if (
        margem >= 10
      ) {
        entre10e20 +=
          quantidade;
      } else {
        abaixo10 +=
          quantidade;
      }
    }
  );

  function percentual(
    quantidade: number
  ) {
    return totalProdutos > 0
      ? (quantidade /
          totalProdutos) *
          100
      : 0;
  }

  const faixas: Faixa[] = [
    {
      label:
        "Acima de 30%",
      quantidade:
        acima30,
      percentual:
        percentual(
          acima30
        ),
      cor: "#10B981",
      barra:
        "bg-emerald-500",
      texto:
        "text-emerald-400",
    },

    {
      label:
        "Entre 20% e 30%",
      quantidade:
        entre20e30,
      percentual:
        percentual(
          entre20e30
        ),
      cor: "#3B82F6",
      barra:
        "bg-blue-500",
      texto:
        "text-blue-400",
    },

    {
      label:
        "Entre 10% e 20%",
      quantidade:
        entre10e20,
      percentual:
        percentual(
          entre10e20
        ),
      cor: "#F59E0B",
      barra:
        "bg-amber-500",
      texto:
        "text-amber-400",
    },

    {
      label:
        "Abaixo de 10%",
      quantidade:
        abaixo10,
      percentual:
        percentual(
          abaixo10
        ),
      cor: "#EF4444",
      barra:
        "bg-red-500",
      texto:
        "text-red-400",
    },
  ];

  // ============================================================
  // DONUT MARGEM
  // ============================================================

  const raioMargem = 39;

  const circunferenciaMargem =
    2 *
    Math.PI *
    raioMargem;

  const percentualAcima30 =
    percentual(acima30);

  const offsetMargem =
    circunferenciaMargem -
    (percentualAcima30 /
      100) *
      circunferenciaMargem;

  return (
    <div
  className="
    grid
    h-full
    min-h-0
    grid-rows-[185px_minmax(0,1fr)]
    gap-3
  "
>
      {/* ======================================================
          DISTRIBUIÇÃO POR CATEGORIA
      ====================================================== */}
      <div
        className="
          relative
          h-full
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
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-violet-500/[0.03] to-transparent" />

        <div className="relative flex h-full flex-col">

          {/* CABEÇALHO */}
          <div className="flex shrink-0 items-center justify-between">
            <div>
              <h2 className="text-[13px] font-bold text-white">
                Distribuição por Categoria
              </h2>

              <p className="mt-0.5 text-[7px] text-slate-600">
                Participação no estoque por categoria
              </p>
            </div>

            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-500/10 bg-violet-500/10">
              <PieChart
                size={13}
                className="text-violet-400"
              />
            </div>
          </div>

          {/* CONTEÚDO */}
          <div className="grid min-h-0 flex-1 grid-cols-[115px_1fr] items-center gap-3">

            {/* DONUT */}
            <div className="relative flex items-center justify-center">
              <svg
                width="102"
                height="102"
                viewBox="0 0 110 110"
                className="-rotate-90"
              >
                <circle
                  cx="55"
                  cy="55"
                  r={raioCategoria}
                  fill="none"
                  stroke="#17263a"
                  strokeWidth="13"
                />

                {segmentosCategoria.map(
                  (segmento) => (
                    <circle
                      key={
                        segmento.nome
                      }
                      cx="55"
                      cy="55"
                      r={
                        raioCategoria
                      }
                      fill="none"
                      stroke={
                        segmento.cor
                      }
                      strokeWidth="13"
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
                <p className="text-[16px] font-bold text-white">
                  {carregando
                    ? "..."
                    : totalProdutos.toLocaleString(
                        "pt-BR"
                      )}
                </p>

                <p className="text-[7px] text-slate-600">
                  unidades
                </p>
              </div>
            </div>

            {/* LEGENDA */}
            <div className="min-w-0 space-y-1.5">
              {carregando ? (
                <p className="text-[8px] text-slate-500">
                  Carregando...
                </p>
              ) : categorias.length === 0 ? (
                <p className="text-[8px] text-slate-500">
                  Nenhuma categoria disponível
                </p>
              ) : (
                categorias.map(
                  (
                    categoria
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
                            categoria.cor,
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[7px] text-slate-400">
                            {
                              categoria.nome
                            }
                          </span>

                          <span className="text-[7px] font-semibold text-slate-300">
                            {categoria.percentual.toFixed(
                              0
                            )}
                            %
                          </span>
                        </div>

                        <p className="text-[8px] font-semibold text-white">
                          {categoria.quantidade.toLocaleString(
                            "pt-BR"
                          )}{" "}
                          un.
                        </p>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>

          {/* RODAPÉ */}
          <div className="shrink-0 border-t border-[#233754]/70 pt-1.5">
            <p className="text-center text-[6px] text-slate-600">
              Distribuição considerando a quantidade atual em estoque
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          MARGEM POR FAIXA
      ====================================================== */}
      <div
        className="
          relative
          h-full
          min-h-0
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
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-emerald-500/[0.03] to-transparent" />

        <div className="relative flex h-full min-h-0 flex-col">

          {/* CABEÇALHO */}
          <div className="flex shrink-0 items-center justify-between">
            <div>
              <h2 className="text-[13px] font-bold text-white">
                Margem por Faixa
              </h2>

              <p className="mt-0.5 text-[7px] text-slate-600">
                Distribuição da rentabilidade do estoque
              </p>
            </div>

            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/10 bg-emerald-500/10">
              <TrendingUp
                size={13}
                className="text-emerald-400"
              />
            </div>
          </div>

          {/* CONTEÚDO */}
          <div className="grid min-h-0 flex-1 grid-cols-[100px_1fr] items-center gap-3">

            {/* DONUT */}
            <div className="relative flex items-center justify-center">
              <svg
                width="92"
                height="92"
                viewBox="0 0 100 100"
                className="-rotate-90"
              >
                <circle
                  cx="50"
                  cy="50"
                  r={raioMargem}
                  fill="none"
                  stroke="#17263a"
                  strokeWidth="10"
                />

                <circle
                  cx="50"
                  cy="50"
                  r={raioMargem}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={
                    circunferenciaMargem
                  }
                  strokeDashoffset={
                    offsetMargem
                  }
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p
                  className={`text-[15px] font-bold ${
                    percentualAcima30 >
                    0
                      ? "text-emerald-400"
                      : "text-slate-500"
                  }`}
                >
                  {carregando
                    ? "..."
                    : `${percentualAcima30.toFixed(
                        0
                      )}%`}
                </p>

                <p className="text-[6px] text-slate-600">
                  acima de 30%
                </p>
              </div>
            </div>

            {/* BARRAS */}
            <div className="space-y-2">
              {faixas.map(
                (faixa) => (
                  <div
                    key={
                      faixa.label
                    }
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">

                      <div className="flex min-w-0 items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              faixa.cor,
                          }}
                        />

                        <span className="truncate text-[7px] text-slate-500">
                          {
                            faixa.label
                          }
                        </span>
                      </div>

                      <span
                        className={`shrink-0 text-[7px] font-bold ${faixa.texto}`}
                      >
                        {carregando
                          ? "..."
                          : `${faixa.quantidade} (${faixa.percentual.toFixed(
                              0
                            )}%)`}
                      </span>
                    </div>

                    <div className="h-[4px] overflow-hidden rounded-full bg-[#17263a]">
                      <div
                        className={`h-full rounded-full ${faixa.barra}`}
                        style={{
                          width: `${Math.min(
                            faixa.percentual,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* RODAPÉ */}
          <div className="shrink-0 border-t border-[#233754]/70 pt-1.5">
            <p className="text-center text-[6px] text-slate-600">
              Baseado em{" "}
              {carregando
                ? "..."
                : totalProdutos.toLocaleString(
                    "pt-BR"
                  )}{" "}
              unidades em estoque
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}