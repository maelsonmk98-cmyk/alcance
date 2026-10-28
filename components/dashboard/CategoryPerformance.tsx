
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Layers3,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  dataInicio?: string;
  dataFim?: string;
};

type Venda = {
  produto_id: number | null;
  faturamento: number | null;
  promocao: number | null;
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

const CORES = [
  "#F97316",
  "#3B82F6",
  "#10B981",
  "#A855F7",
  "#FBBF24",
  "#64748B",
];

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function porcentagem(valor: number): string {
  return `${valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function numero(valor: number | null): number {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function centavos(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100);
}

function faturamentoAposPromocao(venda: Venda): number {
  const brutoCentavos = centavos(
    numero(venda.faturamento)
  );

  const descontoCentavos = centavos(
    (brutoCentavos / 100) *
      (numero(venda.promocao) / 100)
  );

  return (brutoCentavos - descontoCentavos) / 100;
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

export default function CategoryPerformance({
  dataInicio,
  dataFim,
}: Props) {
  const [categorias, setCategorias] = useState<
    Categoria[]
  >([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [quantidadeDias, setQuantidadeDias] = useState(7);

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
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
          throw new Error("Período inválido.");
        }

        const dias = quantidadeDiasEntre(inicio, fim);

        const vendas: Venda[] = [];
        const lote = 1000;

        // Busca todas as vendas do período, em lotes.
        for (let pagina = 0; ; pagina++) {
          const { data, error } = await supabase
            .from("vendas")
            .select(
              "produto_id,faturamento,promocao"
            )
            .eq("user_id", auth.user.id)
            .gte(
              "data_venda",
              inicio.toISOString()
            )
            .lte(
              "data_venda",
              fim.toISOString()
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

          vendas.push(...registros);

          if (registros.length < lote) break;
        }

        const produtoIds = Array.from(
          new Set(
            vendas
              .map((venda) => venda.produto_id)
              .filter(
                (id): id is number =>
                  typeof id === "number" &&
                  Number.isFinite(id)
              )
          )
        );

        const produtos: Produto[] = [];

        // Busca as categorias apenas dos produtos
        // envolvidos nas vendas do período.
        for (let i = 0; i < produtoIds.length; i += 500) {
          const idsLote = produtoIds.slice(i, i + 500);

          const { data, error } = await supabase
            .from("produtos")
            .select("id,categoria")
            .eq("user_id", auth.user.id)
            .in("id", idsLote);

          if (error) throw error;

          produtos.push(
            ...((data ?? []) as Produto[])
          );
        }

        const categoriaPorProduto = new Map<
          number,
          string
        >();

        for (const produto of produtos) {
          categoriaPorProduto.set(
            produto.id,
            produto.categoria?.trim() || "Sem categoria"
          );
        }

        const agrupadas = new Map<string, number>();

        for (const venda of vendas) {
          const categoria =
            venda.produto_id !== null
              ? categoriaPorProduto.get(venda.produto_id) ||
                "Sem categoria"
              : "Sem categoria";

          const valor = faturamentoAposPromocao(venda);

          agrupadas.set(
            categoria,
            (agrupadas.get(categoria) ?? 0) + valor
          );
        }

        const total = Array.from(
          agrupadas.values()
        ).reduce((soma, valor) => soma + valor, 0);

        const ordenadas: Categoria[] = Array.from(
          agrupadas.entries()
        )
          .map(([nome, valor]) => ({
            nome,
            valor,
            percentual:
              total > 0 ? (valor / total) * 100 : 0,
          }))
          .sort((a, b) => b.valor - a.valor);

        // Exibe as cinco maiores categorias.
        // As demais ficam agrupadas em "Outros".
        let resultado = ordenadas;

        if (ordenadas.length > 6) {
          const principais = ordenadas.slice(0, 5);
          const restantes = ordenadas.slice(5);

          const valorOutros = restantes.reduce(
            (soma, item) => soma + item.valor,
            0
          );

          resultado = [
            ...principais,
            {
              nome: "Outros",
              valor: valorOutros,
              percentual:
                total > 0
                  ? (valorOutros / total) * 100
                  : 0,
            },
          ];
        }

        if (!ativo) return;

        setCategorias(resultado);
        setQuantidadeDias(dias);
      } catch (e) {
        if (!ativo) return;

        setErro(
          e instanceof Error
            ? e.message
            : "Não foi possível carregar as categorias."
        );

        setCategorias([]);
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

  const total = useMemo(
    () =>
      categorias.reduce(
        (soma, categoria) => soma + categoria.valor,
        0
      ),
    [categorias]
  );

  const maiorValor = Math.max(
    0,
    ...categorias.map((categoria) => categoria.valor)
  );

  return (
    <section className="relative flex h-full min-h-[340px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#1B3451] bg-[#0B2039] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.15)] sm:p-5">
      {/* CABEÇALHO */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-white">
            Desempenho por Categoria
          </h2>

          <p className="mt-1 text-[11px] text-slate-400">
            Faturamento após promoções • {quantidadeDias} dias
          </p>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
          <Layers3 size={18} />
        </span>
      </div>

      {/* CONTEÚDO */}
      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        {erro ? (
          <div
            role="alert"
            className="flex flex-1 items-center justify-center gap-2 text-xs text-red-300"
          >
            <AlertCircle size={17} />
            {erro}
          </div>
        ) : carregando ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-xs text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-orange-400" />
            Carregando categorias...
          </div>
        ) : total <= 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#152B45] text-slate-500">
              <BarChart3 size={25} />
            </span>

            <p className="text-sm font-semibold text-slate-200">
              Nenhuma venda no período
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Altere o período para visualizar as categorias.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {categorias.map((categoria, index) => {
              const cor = CORES[index % CORES.length];

              const largura =
                maiorValor > 0
                  ? (categoria.valor / maiorValor) * 100
                  : 0;

              return (
                <div
                  key={categoria.nome}
                  className="min-w-0"
                >
                  <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: cor,
                        }}
                      />

                      <span
                        className="truncate text-[12px] font-medium text-slate-200"
                        title={categoria.nome}
                      >
                        {categoria.nome}
                      </span>
                    </div>

                    <span className="shrink-0 text-[11px] font-semibold text-slate-300">
                      {porcentagem(categoria.percentual)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#1A304B]">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, largura)
                          )}%`,
                          backgroundColor: cor,
                        }}
                      />
                    </div>

                    <span className="w-[94px] shrink-0 text-right text-[11px] font-bold tabular-nums text-white">
                      {moeda(categoria.valor)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RODAPÉ */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#233754] pt-3">
        <div>
          <p className="text-[10px] text-slate-400">
            Faturamento por categoria
          </p>

          <p className="mt-1 text-[16px] font-bold tabular-nums text-white">
            {carregando ? "..." : moeda(total)}
          </p>
        </div>

        <span className="rounded-lg border border-[#28405E] bg-[#11243D] px-2.5 py-1.5 text-[10px] font-medium text-slate-300">
          {categorias.length}{" "}
          {categorias.length === 1
            ? "categoria"
            : "categorias"}
        </span>
      </div>
    </section>
  );
}
