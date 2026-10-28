
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronRight,
  Package,
  Trophy,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  dataInicio?: string;
  dataFim?: string;
};

type Venda = {
  produto_id: number | null;
  nome_produto: string | null;
  sku: string | null;
  quantidade: number | null;
  faturamento: number | null;
  promocao: number | null;
};

type ProdutoAgrupado = {
  chave: string;
  nome: string;
  sku: string;
  unidades: number;
  faturamentoCentavos: number;
  percentual: number;
};

const CORES_RANKING = [
  "border-amber-500/20 bg-amber-500/15 text-amber-400",
  "border-slate-400/20 bg-slate-400/10 text-slate-300",
  "border-orange-500/20 bg-orange-500/10 text-orange-400",
  "border-[#25364D] bg-[#17263A] text-slate-400",
  "border-[#25364D] bg-[#17263A] text-slate-400",
];

function numero(valor: number | null): number {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function centavos(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100);
}

function faturamentoLiquidoPromocao(
  venda: Venda
): number {
  const bruto = centavos(numero(venda.faturamento));

  const desconto = centavos(
    (bruto / 100) * (numero(venda.promocao) / 100)
  );

  return bruto - desconto;
}

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function percentual(valor: number): string {
  return `${valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
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

  return (
    Math.round((fimUTC - inicioUTC) / 86400000) + 1
  );
}

export default function TopProducts({
  dataInicio,
  dataFim,
}: Props) {
  const [produtos, setProdutos] = useState<
    ProdutoAgrupado[]
  >([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [quantidadeDias, setQuantidadeDias] = useState(7);

  const [totalFaturamentoCentavos, setTotalFaturamentoCentavos] =
    useState(0);

  const [totalUnidades, setTotalUnidades] = useState(0);

  useEffect(() => {
    let ativo = true;

    async function carregarProdutos() {
      setCarregando(true);
      setErro(null);

      try {
        const { data: auth, error: erroAuth } =
          await supabase.auth.getUser();

        if (erroAuth) throw erroAuth;

        if (!auth.user) {
          throw new Error("Usuário não autenticado.");
        }

        const hoje = new Date();

        const inicio = dataInicio
          ? criarDataLocal(dataInicio)
          : new Date(hoje);

        const fim = dataFim
          ? criarDataLocal(dataFim, true)
          : new Date(hoje);

        if (!dataInicio) {
          inicio.setHours(0, 0, 0, 0);
          inicio.setDate(inicio.getDate() - 6);
        }

        if (!dataFim) {
          fim.setHours(23, 59, 59, 999);
        }

        if (inicio > fim) {
          throw new Error(
            "A data inicial não pode ser maior que a final."
          );
        }

        const dias = quantidadeDiasEntre(inicio, fim);

        const vendas: Venda[] = [];
        const lote = 1000;

        // Paginação para não perder registros.
        for (let pagina = 0; ; pagina++) {
          const { data, error } = await supabase
            .from("vendas")
            .select(
              "produto_id,nome_produto,sku,quantidade,faturamento,promocao"
            )
            .eq("user_id", auth.user.id)
            .gte("data_venda", inicio.toISOString())
            .lte("data_venda", fim.toISOString())
            .order("id", { ascending: true })
            .range(
              pagina * lote,
              (pagina + 1) * lote - 1
            );

          if (error) throw error;

          const registros = (data ?? []) as Venda[];
          vendas.push(...registros);

          if (registros.length < lote) break;
        }

        const agrupados = new Map<
          string,
          ProdutoAgrupado
        >();

        let faturamentoTotal = 0;
        let unidadesTotais = 0;

        for (const venda of vendas) {
          const nome =
            venda.nome_produto?.trim() ||
            "Produto sem nome";

          const sku = venda.sku?.trim() || "Sem SKU";

          // Usa o ID quando disponível, evitando
          // separar o mesmo produto por mudança de nome.
          const chave =
            venda.produto_id !== null
              ? `id:${venda.produto_id}`
              : `sku:${sku}|nome:${nome}`;

          const unidades = numero(venda.quantidade);

          // O faturamento já representa o total
          // do registro, não o valor unitário.
          const faturamento = faturamentoLiquidoPromocao(
            venda
          );

          faturamentoTotal += faturamento;
          unidadesTotais += unidades;

          const existente = agrupados.get(chave);

          if (existente) {
            existente.unidades += unidades;
            existente.faturamentoCentavos += faturamento;
          } else {
            agrupados.set(chave, {
              chave,
              nome,
              sku,
              unidades,
              faturamentoCentavos: faturamento,
              percentual: 0,
            });
          }
        }

        const ranking = Array.from(
          agrupados.values()
        )
          .map((produto) => ({
            ...produto,
            percentual:
              faturamentoTotal > 0
                ? (produto.faturamentoCentavos /
                    faturamentoTotal) *
                  100
                : 0,
          }))
          .sort((a, b) => {
            if (b.unidades !== a.unidades) {
              return b.unidades - a.unidades;
            }

            return (
              b.faturamentoCentavos -
              a.faturamentoCentavos
            );
          })
          .slice(0, 5);

        if (!ativo) return;

        setProdutos(ranking);
        setTotalFaturamentoCentavos(faturamentoTotal);
        setTotalUnidades(unidadesTotais);
        setQuantidadeDias(dias);
      } catch (e) {
        if (!ativo) return;

        setErro(
          e instanceof Error
            ? e.message
            : "Não foi possível carregar os produtos."
        );

        setProdutos([]);
        setTotalFaturamentoCentavos(0);
        setTotalUnidades(0);
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregarProdutos();

    return () => {
      ativo = false;
    };
  }, [dataInicio, dataFim]);

  const maiorQuantidade = useMemo(
    () =>
      Math.max(
        0,
        ...produtos.map((produto) => produto.unidades)
      ),
    [produtos]
  );

  return (
    <section className="relative flex h-full min-h-[340px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#1B3451] bg-[#0B2039] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.15)] sm:p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-500/[0.035] to-transparent" />

      {/* CABEÇALHO */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-white">
            Produtos Mais Vendidos
          </h2>

          <p className="mt-1 text-[11px] text-slate-400">
            Ranking por unidades vendidas • {quantidadeDias} dias
          </p>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/10 text-amber-400">
          <Trophy size={18} />
        </span>
      </div>

      {/* CABEÇALHO DA LISTA */}
      <div className="relative mt-5 grid grid-cols-[minmax(0,1fr)_42px_96px] gap-2 border-b border-[#29415C] pb-2 text-[9px] font-semibold uppercase tracking-[0.07em] text-slate-400">
        <span>Produto</span>
        <span className="text-right">Unid.</span>
        <span className="text-right">Faturamento</span>
      </div>

      {/* RANKING */}
      <div className="relative min-h-[150px] flex-1">
        {erro ? (
          <div
            role="alert"
            className="flex h-full items-center justify-center gap-2 text-xs text-red-300"
          >
            <AlertCircle size={17} />
            {erro}
          </div>
        ) : carregando ? (
          <div className="flex h-full items-center justify-center gap-2 text-xs text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-orange-400" />
            Carregando produtos...
          </div>
        ) : produtos.length === 0 ? (
          <div className="flex h-full min-h-[150px] flex-col items-center justify-center text-center">
            <Package
              size={26}
              className="mb-3 text-slate-500"
            />

            <p className="text-xs font-semibold text-slate-200">
              Nenhuma venda registrada no período
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              O ranking aparecerá quando houver vendas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#203650]/70">
            {produtos.map((produto, index) => {
              const largura =
                maiorQuantidade > 0
                  ? (produto.unidades /
                      maiorQuantidade) *
                    100
                  : 0;

              return (
                <div
                  key={produto.chave}
                  className="grid grid-cols-[minmax(0,1fr)_42px_96px] items-center gap-2 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold ${
                        CORES_RANKING[index] ??
                        CORES_RANKING[4]
                      }`}
                    >
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-[11px] font-semibold text-slate-100"
                        title={produto.nome}
                      >
                        {produto.nome}
                      </p>

                      <p
                        className="mt-0.5 truncate text-[10px] text-slate-500"
                        title={produto.sku}
                      >
                        SKU: {produto.sku}
                      </p>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1A304B]">
                        <div
                          className="h-full rounded-full bg-orange-500 transition-[width] duration-500"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, largura)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <span className="text-right text-[11px] font-semibold tabular-nums text-slate-200">
                    {produto.unidades.toLocaleString(
                      "pt-BR"
                    )}
                  </span>

                  <div className="text-right">
                    <p className="text-[11px] font-bold tabular-nums text-white">
                      {moeda(
                        produto.faturamentoCentavos / 100
                      )}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500">
                      {percentual(produto.percentual)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RESUMO */}
      {!carregando && !erro && produtos.length > 0 && (
        <div className="relative mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#233754] pt-3">
          <div>
            <p className="text-[10px] text-slate-400">
              Unidades vendidas no período
            </p>

            <p className="mt-1 text-[15px] font-bold tabular-nums text-white">
              {totalUnidades.toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-400">
              Faturamento total
            </p>

            <p className="mt-1 text-[15px] font-bold tabular-nums text-white">
              {moeda(totalFaturamentoCentavos / 100)}
            </p>
          </div>
        </div>
      )}

      {/* LINK */}
      <Link
        href="/produtos"
        className="relative mt-4 flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#2A4362] bg-[#112942] text-[11px] font-semibold text-slate-300 transition hover:border-orange-500/40 hover:bg-[#18334F] hover:text-white"
      >
        Ver todos os produtos
        <ChevronRight size={14} />
      </Link>
    </section>
  );
}
