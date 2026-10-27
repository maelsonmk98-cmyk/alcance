"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    <section className="relative flex h-full min-h-[260px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#203A58] bg-[linear-gradient(145deg,#0C2038,#08182B)] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.17)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-amber-500/[0.035] to-transparent" />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[14px] font-bold tracking-tight text-white">Produtos Mais Vendidos</h2>
            <p className="mt-1 text-[10px] text-slate-400">Ranking por unidades vendidas · {quantidadeDias} dias</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/10 text-amber-400">
            <Trophy size={17} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_42px_88px] gap-2 border-b border-[#29415C] pb-2 text-[9px] font-semibold uppercase tracking-[0.07em] text-slate-400">
          <span>Produto</span>
          <span className="text-right">Unid.</span>
          <span className="text-right">Faturamento</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {carregando ? (
            <div className="flex h-full min-h-[115px] items-center justify-center gap-2 text-xs text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-orange-400" />
              Carregando produtos...
            </div>
          ) : produtos.length === 0 ? (
            <div className="flex min-h-[115px] flex-col items-center justify-center gap-2 text-center">
              <Package size={22} className="text-slate-500" />
              <p className="text-xs font-medium text-slate-300">Nenhuma venda registrada no período</p>
              <p className="text-[10px] text-slate-500">O ranking aparecerá quando houver vendas.</p>
            </div>
          ) : (
            produtos.map((produto, index) => (
              <div
                key={`${produto.sku}-${produto.nome}-${index}`}
                className="grid grid-cols-[minmax(0,1fr)_42px_88px] items-center gap-2 border-b border-[#203650]/70 py-2.5 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold ${rankingCores[index]}`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-slate-100" title={produto.nome}>{produto.nome}</p>
                    <p className="mt-0.5 truncate text-[9px] text-slate-500" title={produto.sku}>SKU: {produto.sku}</p>
                  </div>
                </div>
                <span className="text-right text-[11px] font-semibold tabular-nums text-slate-200">{produto.unidades.toLocaleString("pt-BR")}</span>
                <span className="text-right text-[11px] font-bold tabular-nums text-white">{formatarMoeda(produto.faturamento)}</span>
              </div>
            ))
          )}
        </div>

        <Link
          href="/produtos"
          className="mt-3 flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#2A4362] bg-[#112942] text-[11px] font-semibold text-slate-300 transition hover:border-orange-500/40 hover:bg-[#18334F] hover:text-white"
        >
          Ver todos os produtos <ChevronRight size={14} />
        </Link>
      </div>
    </section>
  );
}
