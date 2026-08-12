"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Wallet,
  Percent,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Venda = {
  data_venda: string;
  quantidade: number | null;
  faturamento: number | null;
  custo_total: number | null;
  lucro: number | null;
};

type Props = {
  dataInicio?: string;
  dataFim?: string;
};

type Resumo = {
  quantidade: number;
  faturamento: number;
  custo: number;
  lucro: number;
  roi: number;
  margem: number;
};

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

function formatarDataInput(data: Date) {
  const ano = data.getFullYear();

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export default function VendasCards({
  dataInicio,
  dataFim,
}: Props) {
  const [vendasAtuais, setVendasAtuais] =
    useState<Venda[]>([]);

  const [
    vendasAnteriores,
    setVendasAnteriores,
  ] = useState<Venda[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    carregarVendas();
  }, [dataInicio, dataFim]);

  async function carregarVendas() {
    setCarregando(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setVendasAtuais([]);
        setVendasAnteriores([]);
        return;
      }

      /*
       * ============================================================
       * PERÍODO ATUAL
       * ============================================================
       */

      const hoje = new Date();

      const fimAtual = dataFim
        ? criarDataLocal(
            dataFim,
            true
          )
        : new Date(hoje);

      if (!dataFim) {
        fimAtual.setHours(
          23,
          59,
          59,
          999
        );
      }

      const inicioAtual = dataInicio
        ? criarDataLocal(
            dataInicio
          )
        : (() => {
            const data =
              new Date(hoje);

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

      /*
       * Proteção para intervalo invertido
       */

      if (inicioAtual > fimAtual) {
        console.error(
          "A data inicial não pode ser maior que a data final."
        );

        setVendasAtuais([]);
        setVendasAnteriores([]);
        return;
      }

      /*
       * ============================================================
       * QUANTIDADE DE DIAS
       * ============================================================
       */

      const inicioSomenteData =
        new Date(inicioAtual);

      inicioSomenteData.setHours(
        0,
        0,
        0,
        0
      );

      const fimSomenteData =
        new Date(fimAtual);

      fimSomenteData.setHours(
        0,
        0,
        0,
        0
      );

      const diferencaMs =
        fimSomenteData.getTime() -
        inicioSomenteData.getTime();

      const quantidadeDias =
        Math.floor(
          diferencaMs /
            (1000 * 60 * 60 * 24)
        ) + 1;

      /*
       * ============================================================
       * PERÍODO ANTERIOR
       *
       * Exemplo:
       *
       * Atual:
       * 06/08 até 12/08 = 7 dias
       *
       * Anterior:
       * 30/07 até 05/08 = 7 dias
       * ============================================================
       */

      const fimAnterior =
        new Date(inicioAtual);

      fimAnterior.setMilliseconds(-1);

      const inicioAnterior =
        new Date(inicioAtual);

      inicioAnterior.setDate(
        inicioAnterior.getDate() -
          quantidadeDias
      );

      /*
       * ============================================================
       * CONSULTA
       * ============================================================
       */

      const { data, error } =
        await supabase
          .from("vendas")
          .select(
            "data_venda, quantidade, faturamento, custo_total, lucro"
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
          "Erro ao carregar vendas:",
          error
        );

        setVendasAtuais([]);
        setVendasAnteriores([]);
        return;
      }

      const todasVendas =
        (data || []) as Venda[];

      /*
       * ============================================================
       * SEPARA PERÍODO ATUAL
       * ============================================================
       */

      const atuais =
        todasVendas.filter(
          (venda) => {
            const dataVenda =
              new Date(
                venda.data_venda
              );

            return (
              dataVenda >=
                inicioAtual &&
              dataVenda <=
                fimAtual
            );
          }
        );

      /*
       * ============================================================
       * SEPARA PERÍODO ANTERIOR
       * ============================================================
       */

      const anteriores =
        todasVendas.filter(
          (venda) => {
            const dataVenda =
              new Date(
                venda.data_venda
              );

            return (
              dataVenda >=
                inicioAnterior &&
              dataVenda <=
                fimAnterior
            );
          }
        );

      setVendasAtuais(atuais);
      setVendasAnteriores(
        anteriores
      );
    } catch (error) {
      console.error(
        "Erro inesperado ao carregar vendas:",
        error
      );

      setVendasAtuais([]);
      setVendasAnteriores([]);
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

  /*
   * ============================================================
   * RESUMO
   * ============================================================
   */

  function calcularResumo(
    vendas: Venda[]
  ): Resumo {
    const quantidade =
      vendas.reduce(
        (total, venda) =>
          total +
          Number(
            venda.quantidade ?? 0
          ),
        0
      );

    const faturamento =
      vendas.reduce(
        (total, venda) =>
          total +
          Number(
            venda.faturamento ?? 0
          ),
        0
      );

    const custo =
      vendas.reduce(
        (total, venda) =>
          total +
          Number(
            venda.custo_total ?? 0
          ),
        0
      );

    const lucro =
      vendas.reduce(
        (total, venda) =>
          total +
          Number(
            venda.lucro ?? 0
          ),
        0
      );

    const roi =
      custo > 0
        ? (lucro / custo) * 100
        : 0;

    const margem =
      faturamento > 0
        ? (lucro /
            faturamento) *
          100
        : 0;

    return {
      quantidade,
      faturamento,
      custo,
      lucro,
      roi,
      margem,
    };
  }

  const atual =
    calcularResumo(
      vendasAtuais
    );

  const anterior =
    calcularResumo(
      vendasAnteriores
    );

  /*
   * ============================================================
   * VARIAÇÃO
   * ============================================================
   */

  function calcularVariacao(
    valorAtual: number,
    valorAnterior: number
  ) {
    if (
      valorAnterior === 0 &&
      valorAtual === 0
    ) {
      return 0;
    }

    if (
      valorAnterior === 0 &&
      valorAtual !== 0
    ) {
      return 100;
    }

    return (
      ((valorAtual -
        valorAnterior) /
        Math.abs(
          valorAnterior
        )) *
      100
    );
  }

  function formatarVariacao(
    valor: number
  ) {
    return `${Math.abs(valor)
      .toFixed(1)
      .replace(".", ",")}%`;
  }

  const cards = [
    {
      title:
        "Produtos Vendidos",

      value:
        atual.quantidade.toLocaleString(
          "pt-BR"
        ),

      variation:
        calcularVariacao(
          atual.quantidade,
          anterior.quantidade
        ),

      icon: ShoppingCart,

      iconBg:
        "bg-blue-500/20",

      iconColor:
        "text-blue-400",

      cardGlow:
        "from-blue-500/[0.12]",
    },

    {
      title: "Faturamento",

      value: formatarMoeda(
        atual.faturamento
      ),

      variation:
        calcularVariacao(
          atual.faturamento,
          anterior.faturamento
        ),

      icon: DollarSign,

      iconBg:
        "bg-emerald-500/20",

      iconColor:
        "text-emerald-400",

      cardGlow:
        "from-emerald-500/[0.12]",
    },

    {
      title:
        "Custo das Vendas",

      value: formatarMoeda(
        atual.custo
      ),

      variation:
        calcularVariacao(
          atual.custo,
          anterior.custo
        ),

      icon: Wallet,

      iconBg:
        "bg-amber-500/20",

      iconColor:
        "text-amber-400",

      cardGlow:
        "from-amber-500/[0.12]",
    },

    {
      title:
        "Lucro Líquido",

      value: formatarMoeda(
        atual.lucro
      ),

      variation:
        calcularVariacao(
          atual.lucro,
          anterior.lucro
        ),

      icon: TrendingUp,

      iconBg:
        atual.lucro >= 0
          ? "bg-fuchsia-500/20"
          : "bg-red-500/20",

      iconColor:
        atual.lucro >= 0
          ? "text-fuchsia-400"
          : "text-red-400",

      cardGlow:
        atual.lucro >= 0
          ? "from-fuchsia-500/[0.12]"
          : "from-red-500/[0.12]",
    },

    {
      title: "ROI",

      value: `${atual.roi.toFixed(
        2
      )}%`,

      variation:
        calcularVariacao(
          atual.roi,
          anterior.roi
        ),

      icon: BarChart3,

      iconBg:
        atual.roi >= 0
          ? "bg-emerald-500/20"
          : "bg-red-500/20",

      iconColor:
        atual.roi >= 0
          ? "text-emerald-400"
          : "text-red-400",

      cardGlow:
        atual.roi >= 0
          ? "from-emerald-500/[0.12]"
          : "from-red-500/[0.12]",
    },

    {
      title:
        "Margem Média",

      value: `${atual.margem.toFixed(
        2
      )}%`,

      variation:
        calcularVariacao(
          atual.margem,
          anterior.margem
        ),

      icon: Percent,

      iconBg:
        atual.margem >= 0
          ? "bg-blue-500/20"
          : "bg-red-500/20",

      iconColor:
        atual.margem >= 0
          ? "text-blue-400"
          : "text-red-400",

      cardGlow:
        atual.margem >= 0
          ? "from-blue-500/[0.12]"
          : "from-red-500/[0.12]",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => {
        const Icon =
          card.icon;

        const subiu =
          card.variation > 0;

        const caiu =
          card.variation < 0;

        return (
          <div
            key={card.title}
            className="
              group
              relative
              h-[126px]
              overflow-hidden
              rounded-[13px]
              border
              border-[#243750]
              bg-[#0d1b2f]
              px-4
              py-3
              shadow-[0_8px_24px_rgba(0,0,0,0.16)]
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:border-[#345078]
            "
          >
            {/* Glow */}
            <div
              className={`
                pointer-events-none
                absolute
                inset-x-0
                top-0
                h-20
                bg-gradient-to-b
                ${card.cardGlow}
                to-transparent
              `}
            />

            <div className="relative flex h-full flex-col">

              {/* Ícone + título */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-[9px]
                    border
                    border-white/[0.03]
                    ${card.iconBg}
                  `}
                >
                  <Icon
                    size={15}
                    strokeWidth={2}
                    className={
                      card.iconColor
                    }
                  />
                </div>

                <p className="truncate text-[10px] font-medium text-slate-400">
                  {card.title}
                </p>
              </div>

              {/* Valor */}
              <h2 className="mt-2 truncate text-[20px] font-bold leading-none tracking-[-0.04em] text-white">
                {carregando
                  ? "..."
                  : card.value}
              </h2>

              {/* Comparação */}
              <div className="mt-auto">
                <div className="flex items-center gap-1">
                  {subiu ? (
                    <TrendingUp
                      size={11}
                      className="text-emerald-400"
                    />
                  ) : caiu ? (
                    <TrendingDown
                      size={11}
                      className="text-red-400"
                    />
                  ) : (
                    <Minus
                      size={11}
                      className="text-slate-500"
                    />
                  )}

                  <span
                    className={`text-[9px] font-semibold ${
                      subiu
                        ? "text-emerald-400"
                        : caiu
                        ? "text-red-400"
                        : "text-slate-500"
                    }`}
                  >
                    {carregando
                      ? "..."
                      : formatarVariacao(
                          card.variation
                        )}
                  </span>
                </div>

                <p className="mt-0.5 text-[8px] text-slate-600">
                  vs. período anterior
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}