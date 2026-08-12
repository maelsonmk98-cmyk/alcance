"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  ChevronRight,
  Package,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Venda = {
  nome_produto: string | null;
  sku: string | null;
  quantidade: number | null;
  faturamento: number | null;
  data_venda: string;
};

type ProdutoAgrupado = {
  nome: string;
  sku: string;
  unidades: number;
  faturamento: number;
};

type Props = {
  dataInicio?: string;
  dataFim?: string;
};

export default function TopProducts({
  dataInicio,
  dataFim,
}: Props) {
  const [produtos, setProdutos] = useState<ProdutoAgrupado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [quantidadeDias, setQuantidadeDias] = useState(7);

  useEffect(() => {
    carregarProdutos();
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

      /*
       * ============================================================
       * PERÍODO
       * ============================================================
       */

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

        setProdutos([]);
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
       * CONSULTA
       * ============================================================
       */

      const { data, error } = await supabase
        .from("vendas")
        .select(
          "nome_produto, sku, quantidade, faturamento, data_venda"
        )
        .eq("user_id", user.id)
        .gte(
          "data_venda",
          inicioAtual.toISOString()
        )
        .lte(
          "data_venda",
          fimAtual.toISOString()
        )
        .order("data_venda", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Erro ao carregar produtos mais vendidos:",
          error
        );

        setProdutos([]);
        return;
      }

      /*
       * ============================================================
       * AGRUPAMENTO
       * ============================================================
       */

      const agrupado =
        new Map<string, ProdutoAgrupado>();

      ((data || []) as Venda[]).forEach(
        (venda) => {
          const sku =
            venda.sku?.trim() ||
            "Sem SKU";

          const nome =
            venda.nome_produto?.trim() ||
            "Produto sem nome";

          const chave =
            `${sku}-${nome}`;

          const existente =
            agrupado.get(chave);

          if (existente) {
            existente.unidades +=
              Number(
                venda.quantidade ?? 0
              );

            existente.faturamento +=
              Number(
                venda.faturamento ?? 0
              );
          } else {
            agrupado.set(
              chave,
              {
                nome,
                sku,

                unidades: Number(
                  venda.quantidade ?? 0
                ),

                faturamento: Number(
                  venda.faturamento ?? 0
                ),
              }
            );
          }
        }
      );

      /*
       * ============================================================
       * RANKING
       * ============================================================
       */

      const ranking =
        Array.from(
          agrupado.values()
        )
          .sort((a, b) => {
            if (
              b.unidades !==
              a.unidades
            ) {
              return (
                b.unidades -
                a.unidades
              );
            }

            return (
              b.faturamento -
              a.faturamento
            );
          })
          .slice(0, 5);

      setProdutos(ranking);
    } catch (error) {
      console.error(
        "Erro inesperado ao carregar produtos mais vendidos:",
        error
      );

      setProdutos([]);
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

  const rankingCores = [
    "bg-amber-500/15 text-amber-400 border-amber-500/10",
    "bg-slate-400/10 text-slate-300 border-slate-400/10",
    "bg-orange-500/10 text-orange-400 border-orange-500/10",
    "bg-[#17263a] text-slate-500 border-[#25364d]",
    "bg-[#17263a] text-slate-500 border-[#25364d]",
  ];

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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-amber-500/[0.025] to-transparent" />

      <div className="relative flex h-full flex-col">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-bold text-white">
              Produtos Mais Vendidos
            </h2>

            <p className="mt-0.5 text-[8px] text-slate-600">
              Ranking do período • {quantidadeDias} dias
            </p>
          </div>

          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/10 bg-amber-500/10">
            <Trophy
              size={13}
              className="text-amber-400"
            />
          </div>
        </div>

        {/* Cabeçalho tabela */}
        <div className="mt-2.5 grid grid-cols-[1fr_42px_84px] items-center gap-2 border-b border-[#233754]/70 pb-1.5">
          <span className="text-[7px] font-medium uppercase tracking-[0.08em] text-slate-600">
            Produto
          </span>

          <span className="text-right text-[7px] font-medium uppercase tracking-[0.08em] text-slate-600">
            Unid.
          </span>

          <span className="text-right text-[7px] font-medium uppercase tracking-[0.08em] text-slate-600">
            Faturamento
          </span>
        </div>

        {/* Conteúdo */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {carregando ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-[9px] text-slate-500">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-700 border-t-amber-400" />

                Carregando...
              </div>
            </div>
          ) : produtos.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#233754] bg-[#101e32]">
                <Package
                  size={16}
                  className="text-slate-600"
                />
              </div>

              <p className="mt-2 text-[9px] font-medium text-slate-400">
                Nenhuma venda registrada
              </p>

              <p className="mt-0.5 text-[7px] text-slate-600">
                O ranking aparecerá após as primeiras vendas
              </p>
            </div>
          ) : (
            <div>
              {produtos.map(
                (
                  produto,
                  index
                ) => (
                  <div
                    key={`${produto.sku}-${index}`}
                    className="
                      grid
                      grid-cols-[1fr_42px_84px]
                      items-center
                      gap-2
                      border-b
                      border-[#17263a]
                      py-[5px]
                      last:border-b-0
                    "
                  >
                    <div className="flex min-w-0 items-center gap-2">

                      <div
                        className={`
                          flex
                          h-[21px]
                          w-[21px]
                          shrink-0
                          items-center
                          justify-center
                          rounded-md
                          border
                          text-[8px]
                          font-bold
                          ${rankingCores[index]}
                        `}
                      >
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[8px] font-medium text-slate-200">
                          {produto.nome}
                        </p>

                        <p className="mt-0.5 truncate text-[7px] text-slate-600">
                          SKU: {produto.sku}
                        </p>
                      </div>
                    </div>

                    <span className="text-right text-[8px] font-semibold text-slate-300">
                      {produto.unidades.toLocaleString(
                        "pt-BR"
                      )}
                    </span>

                    <span className="truncate text-right text-[8px] font-bold text-white">
                      {formatarMoeda(
                        produto.faturamento
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="
            mt-2
            flex
            h-7
            w-full
            items-center
            justify-center
            gap-1
            rounded-md
            border
            border-[#28405e]
            bg-[#102039]
            text-[8px]
            font-medium
            text-slate-400
            transition
            hover:border-blue-500/30
            hover:bg-[#132844]
            hover:text-slate-200
          "
        >
          Ver todos os produtos

          <ChevronRight size={10} />
        </button>
      </div>
    </div>
  );
}