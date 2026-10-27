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
    <section className="relative flex h-full min-h-[310px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#233754] bg-[#0d1b2f] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-violet-500/[0.06] to-transparent" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tight text-white">Desempenho por Categoria</h2>
          <p className="mt-1 text-[11px] text-slate-400">
            Participação no faturamento <span className="text-slate-600">•</span> {quantidadeDias} dias
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-500/10">
          <PieChart size={17} className="text-violet-400" />
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center py-3">
        {carregando ? (
          <div className="flex items-center gap-2 text-xs text-slate-400" role="status">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-orange-400" />
            Carregando categorias...
          </div>
        ) : total <= 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-[9px] border-[#24354d]">
              <PieChart size={20} className="text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-200">Nenhuma venda no período</p>
            <p className="text-xs text-slate-500">Altere o período para visualizar as categorias.</p>
          </div>
        ) : (
          <div className="grid w-full min-w-0 grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(135px,0.85fr)_minmax(0,1.15fr)] lg:gap-5">
            <div className="relative mx-auto flex w-full max-w-[192px] items-center justify-center">
              <svg viewBox="0 0 150 150" className="h-auto w-full max-w-[180px] -rotate-90" role="img" aria-label={`Distribuição do faturamento por categoria, total de ${formatarMoeda(total)}`}>
                <circle cx="75" cy="75" r={raio} fill="none" stroke="#21334b" strokeWidth="17" />
                {segmentos.map((segmento) => (
                  <circle
                    key={segmento.nome}
                    cx="75"
                    cy="75"
                    r={raio}
                    fill="none"
                    stroke={segmento.cor}
                    strokeWidth="17"
                    strokeDasharray={segmento.dasharray}
                    strokeDashoffset={segmento.dashoffset}
                    className="transition-opacity duration-200"
                  >
                    <title>{`${segmento.nome}: ${formatarMoeda(segmento.valor)} (${segmento.percentual.toFixed(1)}%)`}</title>
                  </circle>
                ))}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-medium text-slate-400">Faturamento</span>
                <strong className="mt-1 text-[clamp(13px,1.1vw,18px)] font-extrabold tracking-tight text-white tabular-nums">
                  {formatarMoeda(total)}
                </strong>
                <span className="mt-0.5 text-[10px] text-slate-500">Total</span>
              </div>
            </div>

            <div className="min-w-0 space-y-3">
              {categorias.map((categoria, index) => (
                <div key={categoria.nome} className="min-w-0">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: CORES[index % CORES.length] }}
                      />
                      <span className="truncate text-[11px] font-medium text-slate-300" title={categoria.nome}>
                        {categoria.nome}
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-slate-400 tabular-nums">
                      {categoria.percentual.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 pl-[18px]">
                    <strong className="text-[12px] font-bold text-white tabular-nums">{formatarMoeda(categoria.valor)}</strong>
                  </div>
                  <div className="ml-[18px] mt-1.5 h-1 overflow-hidden rounded-full bg-[#233650]">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, categoria.percentual))}%`, backgroundColor: CORES[index % CORES.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative border-t border-[#233754]/70 pt-2.5 text-center text-[10px] text-slate-500">
        Distribuição por categoria • {quantidadeDias} dias
      </div>
    </section>
  );
}
