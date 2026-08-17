import {
  NextRequest,
  NextResponse,
} from "next/server";

import { GET as getVendas } from "../../vendas/route";
import { GET as getCustos } from "../route";
import { GET as getAdsMetricas } from "../../ads/metricas/route";
import { GET as getAdsProdutos } from "../../ads/produtos/route";

/*
 * ============================================================
 * TIPOS
 * ============================================================
 */

type ProdutoVenda = {
  mlb: string | null;
  titulo: string;
  sku: string | null;
  variation_id: number | null;
  quantidade: number;
  preco_unitario: number;
};

type VendaMercadoLivre = {
  id: number | null;
  data: string | null;
  data_fechamento: string | null;
  status: string;
  quantidade: number;
  faturamento: number;
  valor_pago: number;
  taxa_marketplace: number;
  frete: number;

  produtos: ProdutoVenda[];
};

type VendasResponse = {
  conectado?: boolean;

  resumo?: {
    pedidos: number;
    unidades: number;
    faturamento: number;
    ticket_medio: number;
    taxas_marketplace: number;
    cancelados: number;
  };

  vendas?: VendaMercadoLivre[];

  error?: string;
};

type ProdutoCusto = {
  id: number;

  sku: string | null;

  nome: string;

  estoque: number;

  custos: {
    custo: number;
    preco_venda: number;
    comissao: number;
    impostos: number;
    embalagem: number;
    frete: number;
    outras_despesas: number;
    acos: number;
    promocao: number;
  };

  referencia?: {
    valor_comissao: number;
    valor_impostos: number;
    valor_acos: number;
    valor_promocao: number;
    custo_estimado: number;
    lucro_estimado: number;
    margem_estimada: number;
    roi_estimado: number;
  };
};

type CustosResponse = {
  conectado?: boolean;

  total_produtos?: number;

  produtos?: ProdutoCusto[];

  por_sku?: Record<
    string,
    ProdutoCusto
  >;

  error?: string;
};

type ResumoAds = {
  investimento: number;
  receita_ads: number;
  vendas_ads: number;
  impressoes: number;
  cliques: number;
  ctr: number;
  cpc: number;
  acos: number;
  roas: number;
};

type AdsMetricasResponse = {
  mercado_ads?: boolean;

  resumo?: ResumoAds;

  error?: string;
};

type ProdutoAds = {
  id: number | null;

  item_id: string | null;

  titulo: string | null;

  campaign_id: number | null;

  campaign_name: string | null;

  status: string | null;

  investimento: number;

  impressoes: number;

  cliques: number;

  ctr: number;

  cpc: number;

  receita_ads: number;

  vendas_ads: number;

  vendas_diretas?: number;

  vendas_indiretas?: number;

  receita_direta?: number;

  receita_indireta?: number;

  acos: number;

  roas: number;
};

type AdsProdutosResponse = {
  mercado_ads?: boolean;

  resumo?: ResumoAds;

  produtos?: ProdutoAds[];

  error?: string;
};

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function numero(
  valor: unknown
) {
  const convertido =
    Number(valor ?? 0);

  return Number.isFinite(
    convertido
  )
    ? convertido
    : 0;
}

function normalizarSku(
  sku: string | null | undefined
) {
  return (
    sku
      ?.trim()
      .toUpperCase() ?? ""
  );
}

function normalizarMlb(
  mlb: string | null | undefined
) {
  return (
    mlb
      ?.trim()
      .toUpperCase() ?? ""
  );
}

/*
 * ============================================================
 * GET
 * ============================================================
 */

export async function GET(
  request: NextRequest
) {
  try {
    /*
     * ==========================================================
     * 1. PERÍODO
     * ==========================================================
     */

    const diasParam =
      Number(
        request.nextUrl.searchParams.get(
          "dias"
        ) ?? 30
      );

    const dias =
      Number.isFinite(
        diasParam
      ) &&
      diasParam > 0
        ? Math.min(
            diasParam,
            90
          )
        : 30;

    /*
     * ==========================================================
     * 2. REUTILIZAR AS ROTAS INTERNAS SEM FETCH HTTP
     * ==========================================================
     *
     * Antes esta rota fazia fetch para localhost / Vercel.
     * Isso fazia a sessão se perder em alguns ambientes e
     * gerava HTTP 401.
     *
     * Agora chamamos diretamente os handlers já existentes,
     * mantendo a mesma sessão/cookies da requisição atual.
     */

    const cookie =
      request.headers.get(
        "cookie"
      ) ?? "";

    const headers =
      new Headers();

    if (cookie) {
      headers.set(
        "cookie",
        cookie
      );
    }

    const origin =
      request.nextUrl.origin;

    const vendasRequest =
      new NextRequest(
        `${origin}/api/mercadolivre/vendas?dias=${dias}`,
        {
          method: "GET",
          headers,
        }
      );

    const adsMetricasRequest =
      new NextRequest(
        `${origin}/api/mercadolivre/ads/metricas?dias=${dias}`,
        {
          method: "GET",
          headers,
        }
      );

    const adsProdutosRequest =
      new NextRequest(
        `${origin}/api/mercadolivre/ads/produtos?dias=${dias}`,
        {
          method: "GET",
          headers,
        }
      );

    /*
     * ==========================================================
     * 3. CARREGAR TODAS AS FONTES
     * ==========================================================
     */

    const [
      vendasResponse,
      custosResponse,
      adsResponse,
      adsProdutosResponse,
    ] =
      await Promise.all([
        getVendas(
          vendasRequest
        ),

        getCustos(),

        getAdsMetricas(
          adsMetricasRequest
        ),

        getAdsProdutos(
          adsProdutosRequest
        ),
      ]);

    /*
     * ==========================================================
     * 4. JSON
     * ==========================================================
     */

    const vendasData =
      (await vendasResponse.json()) as VendasResponse;

    const custosData =
      (await custosResponse.json()) as CustosResponse;

    const adsData =
      (await adsResponse.json()) as AdsMetricasResponse;

    const adsProdutosData =
      (await adsProdutosResponse.json()) as AdsProdutosResponse;

    /*
     * ==========================================================
     * 5. VALIDAR FONTES ESSENCIAIS
     * ==========================================================
     */

    if (
      !vendasResponse.ok
    ) {
      return NextResponse.json(
        {
          error:
            "Não foi possível carregar as vendas para a análise.",

          details:
            vendasData,
        },
        {
          status:
            vendasResponse.status,
        }
      );
    }

    if (
      !custosResponse.ok
    ) {
      return NextResponse.json(
        {
          error:
            "Não foi possível carregar os custos dos produtos.",

          details:
            custosData,
        },
        {
          status:
            custosResponse.status,
        }
      );
    }

    /*
     * Ads não impede a Performance inteira
     * de funcionar.
     *
     * Se o Mercado Ads falhar,
     * vendas e custos continuam disponíveis.
     */

    const adsDisponivel =
      adsResponse.ok;

    const adsProdutosDisponivel =
      adsProdutosResponse.ok;

    /*
     * ==========================================================
     * 6. DADOS BASE
     * ==========================================================
     */

    const vendas =
      Array.isArray(
        vendasData.vendas
      )
        ? vendasData.vendas
        : [];

    const vendasValidas =
      vendas.filter(
        (venda) =>
          venda.status !==
          "cancelled"
      );

    const porSku =
      custosData.por_sku ??
      {};

    const resumoAds: ResumoAds =
      adsDisponivel &&
      adsData.resumo
        ? adsData.resumo
        : {
            investimento: 0,
            receita_ads: 0,
            vendas_ads: 0,
            impressoes: 0,
            cliques: 0,
            ctr: 0,
            cpc: 0,
            acos: 0,
            roas: 0,
          };

    const produtosAds =
      adsProdutosDisponivel &&
      Array.isArray(
        adsProdutosData.produtos
      )
        ? adsProdutosData.produtos
        : [];

    /*
     * ==========================================================
     * 7. ÍNDICE ADS POR MLB
     * ==========================================================
     */

    const adsPorMlb =
      new Map<
        string,
        ProdutoAds
      >();

    produtosAds.forEach(
      (produto) => {
        const mlb =
          normalizarMlb(
            produto.item_id
          );

        if (!mlb) {
          return;
        }

        const existente =
          adsPorMlb.get(
            mlb
          );

        if (!existente) {
          adsPorMlb.set(
            mlb,
            {
              ...produto,
            }
          );

          return;
        }

        /*
         * Caso o mesmo MLB apareça
         * mais de uma vez,
         * agregamos as métricas.
         */

        existente.investimento +=
          numero(
            produto.investimento
          );

        existente.impressoes +=
          numero(
            produto.impressoes
          );

        existente.cliques +=
          numero(
            produto.cliques
          );

        existente.receita_ads +=
          numero(
            produto.receita_ads
          );

        existente.vendas_ads +=
          numero(
            produto.vendas_ads
          );
      }
    );

    /*
     * ==========================================================
     * 8. REGRA DA PERFORMANCE
     * ==========================================================
     *
     * Aqui usamos:
     *
     * preço REAL da venda
     *
     * +
     *
     * custos cadastrados
     *
     * +
     *
     * Ads REAL da API.
     *
     * Não descontamos novamente:
     *
     * - ACOS cadastrado manualmente
     * - promoção cadastrada
     *
     * porque:
     *
     * ACOS → substituído pelo gasto real de Ads.
     *
     * Promoção → o preço real da venda já reflete
     * o valor efetivamente vendido.
     */

    const TARIFA_FIXA =
      6.5;

    /*
     * ==========================================================
     * 9. AGRUPAMENTO POR SKU
     * ==========================================================
     */

    type LinhaPerformance = {
      sku: string;

      nome: string;

      mlb: string | null;

      produto_id:
        number | null;

      pedidos: number;

      unidades: number;

      faturamento: number;

      custo_produtos: number;

      comissao: number;

      impostos: number;

      embalagem: number;

      frete: number;

      outras_despesas: number;

      tarifa_fixa: number;

      custos_operacionais: number;

      investimento_ads: number;

      receita_ads: number;

      vendas_ads: number;

      impressoes_ads: number;

      cliques_ads: number;

      lucro_antes_ads: number;

      lucro_liquido: number;

      margem: number;

      roi: number;

      acos: number;

      roas: number;

      encontrado_no_alcance:
        boolean;
    };

    const mapa =
      new Map<
        string,
        LinhaPerformance
      >();

    /*
     * Evita lançar Ads do mesmo MLB
     * várias vezes quando existem
     * vários pedidos daquele produto.
     */

    const mlbsAdsJaAplicados =
      new Set<string>();

    const skusSemCadastro =
      new Set<string>();

    const skusComCadastro =
      new Set<string>();

    /*
     * ==========================================================
     * 10. PROCESSAR VENDAS
     * ==========================================================
     */

    vendasValidas.forEach(
      (venda) => {
        const produtos =
          Array.isArray(
            venda.produtos
          )
            ? venda.produtos
            : [];

        produtos.forEach(
          (item) => {
            const sku =
              normalizarSku(
                item.sku
              );

            /*
             * Se o ML não retornar SKU,
             * usamos uma identificação
             * temporária pelo MLB.
             */

            const mlb =
              normalizarMlb(
                item.mlb
              );

            const chave =
              sku ||
              mlb ||
              `SEM-SKU-${venda.id}`;

            const cadastro =
              sku
                ? porSku[
                    sku
                  ]
                : undefined;

            if (cadastro) {
              skusComCadastro.add(
                sku
              );
            } else {
              skusSemCadastro.add(
                sku ||
                  mlb ||
                  "SEM-SKU"
              );
            }

            const quantidade =
              Math.max(
                0,
                numero(
                  item.quantidade
                )
              );

            const precoUnitario =
              numero(
                item.preco_unitario
              );

            const faturamento =
              precoUnitario *
              quantidade;

            /*
             * Custos cadastrados
             */

            const custoUnitario =
              numero(
                cadastro
                  ?.custos
                  .custo
              );

            const comissaoPercentual =
              numero(
                cadastro
                  ?.custos
                  .comissao
              );

            const impostosPercentual =
              numero(
                cadastro
                  ?.custos
                  .impostos
              );

            const embalagemUnitario =
              numero(
                cadastro
                  ?.custos
                  .embalagem
              );

            const freteUnitario =
              numero(
                cadastro
                  ?.custos
                  .frete
              );

            const outrasUnitario =
              numero(
                cadastro
                  ?.custos
                  .outras_despesas
              );

            /*
             * Custos calculados usando
             * preço real da venda.
             */

            const custoProdutos =
              custoUnitario *
              quantidade;

            const valorComissao =
              faturamento *
              (
                comissaoPercentual /
                100
              );

            const valorImpostos =
              faturamento *
              (
                impostosPercentual /
                100
              );

            const embalagem =
              embalagemUnitario *
              quantidade;

            const frete =
              freteUnitario *
              quantidade;

            const outrasDespesas =
              outrasUnitario *
              quantidade;

            const tarifaFixa =
              TARIFA_FIXA *
              quantidade;

            const custosOperacionais =
              custoProdutos +
              valorComissao +
              valorImpostos +
              embalagem +
              frete +
              outrasDespesas +
              tarifaFixa;

            const lucroAntesAds =
              faturamento -
              custosOperacionais;

            /*
             * ====================================================
             * ADS DO PRODUTO
             * ====================================================
             */

            const adsProduto =
              mlb
                ? adsPorMlb.get(
                    mlb
                  )
                : undefined;

            let investimentoAds =
              0;

            let receitaAds =
              0;

            let vendasAds =
              0;

            let impressoesAds =
              0;

            let cliquesAds =
              0;

            if (
              adsProduto &&
              mlb &&
              !mlbsAdsJaAplicados.has(
                mlb
              )
            ) {
              investimentoAds =
                numero(
                  adsProduto.investimento
                );

              receitaAds =
                numero(
                  adsProduto.receita_ads
                );

              vendasAds =
                numero(
                  adsProduto.vendas_ads
                );

              impressoesAds =
                numero(
                  adsProduto.impressoes
                );

              cliquesAds =
                numero(
                  adsProduto.cliques
                );

              mlbsAdsJaAplicados.add(
                mlb
              );
            }

            /*
             * ====================================================
             * LINHA EXISTENTE
             * ====================================================
             */

            const existente =
              mapa.get(
                chave
              );

            if (!existente) {
              mapa.set(
                chave,
                {
                  sku:
                    sku ||
                    "—",

                  nome:
                    cadastro
                      ?.nome ||
                    item.titulo ||
                    "Produto",

                  mlb:
                    mlb ||
                    null,

                  produto_id:
                    cadastro
                      ?.id ??
                    null,

                  pedidos: 1,

                  unidades:
                    quantidade,

                  faturamento,

                  custo_produtos:
                    custoProdutos,

                  comissao:
                    valorComissao,

                  impostos:
                    valorImpostos,

                  embalagem,

                  frete,

                  outras_despesas:
                    outrasDespesas,

                  tarifa_fixa:
                    tarifaFixa,

                  custos_operacionais:
                    custosOperacionais,

                  investimento_ads:
                    investimentoAds,

                  receita_ads:
                    receitaAds,

                  vendas_ads:
                    vendasAds,

                  impressoes_ads:
                    impressoesAds,

                  cliques_ads:
                    cliquesAds,

                  lucro_antes_ads:
                    lucroAntesAds,

                  lucro_liquido:
                    lucroAntesAds -
                    investimentoAds,

                  margem: 0,

                  roi: 0,

                  acos: 0,

                  roas: 0,

                  encontrado_no_alcance:
                    Boolean(
                      cadastro
                    ),
                }
              );

              return;
            }

            /*
             * ====================================================
             * SOMAR AO SKU
             * ====================================================
             */

            existente.pedidos +=
              1;

            existente.unidades +=
              quantidade;

            existente.faturamento +=
              faturamento;

            existente.custo_produtos +=
              custoProdutos;

            existente.comissao +=
              valorComissao;

            existente.impostos +=
              valorImpostos;

            existente.embalagem +=
              embalagem;

            existente.frete +=
              frete;

            existente.outras_despesas +=
              outrasDespesas;

            existente.tarifa_fixa +=
              tarifaFixa;

            existente.custos_operacionais +=
              custosOperacionais;

            existente.investimento_ads +=
              investimentoAds;

            existente.receita_ads +=
              receitaAds;

            existente.vendas_ads +=
              vendasAds;

            existente.impressoes_ads +=
              impressoesAds;

            existente.cliques_ads +=
              cliquesAds;

            existente.lucro_antes_ads +=
              lucroAntesAds;

            existente.lucro_liquido =
              existente.lucro_antes_ads -
              existente.investimento_ads;
          }
        );
      }
    );

    /*
     * ==========================================================
     * 11. FINALIZAR MÉTRICAS POR SKU
     * ==========================================================
     */

    const produtosPerformance =
      Array.from(
        mapa.values()
      ).map(
        (produto) => {
          const margem =
            produto.faturamento >
            0
              ? (
                  produto.lucro_liquido /
                  produto.faturamento
                ) * 100
              : 0;

          /*
           * ROI:
           * lucro líquido /
           * custo de aquisição
           * dos produtos.
           */

          const roi =
            produto.custo_produtos >
            0
              ? (
                  produto.lucro_liquido /
                  produto.custo_produtos
                ) * 100
              : 0;

          const acos =
            produto.receita_ads >
            0
              ? (
                  produto.investimento_ads /
                  produto.receita_ads
                ) * 100
              : 0;

          const roas =
            produto.investimento_ads >
            0
              ? produto.receita_ads /
                produto.investimento_ads
              : 0;

          return {
            ...produto,

            margem,

            roi,

            acos,

            roas,
          };
        }
      );

    /*
     * ==========================================================
     * 12. TOTAIS OPERACIONAIS
     * ==========================================================
     */

    const faturamento =
      produtosPerformance.reduce(
        (
          total,
          produto
        ) =>
          total +
          produto.faturamento,
        0
      );

    const unidades =
      produtosPerformance.reduce(
        (
          total,
          produto
        ) =>
          total +
          produto.unidades,
        0
      );

    const custoProdutos =
      produtosPerformance.reduce(
        (
          total,
          produto
        ) =>
          total +
          produto.custo_produtos,
        0
      );

    const comissao =
      produtosPerformance.reduce(
        (
          total,
          produto
        ) =>
          total +
          produto.comissao,
        0
      );

    const impostos =
      produtosPerformance.reduce(
        (
          total,
          produto
        ) =>
          total +
          produto.impostos,
        0
      );

    const embalagem =
      produtosPerformance.reduce(
        (
          total,
          produto
        ) =>
          total +
          produto.embalagem,
        0
      );

    const frete =
      produtosPerformance.reduce(
        (
          total,
          produto
        ) =>
          total +
          produto.frete,
        0
      );

    const outrasDespesas =
      produtosPerformance.reduce(
        (
          total,
          produto
        ) =>
          total +
          produto.outras_despesas,
        0
      );

    const tarifaFixa =
      produtosPerformance.reduce(
        (
          total,
          produto
        ) =>
          total +
          produto.tarifa_fixa,
        0
      );

    const custosOperacionais =
      produtosPerformance.reduce(
        (
          total,
          produto
        ) =>
          total +
          produto.custos_operacionais,
        0
      );

    const lucroAntesAds =
      faturamento -
      custosOperacionais;

    /*
     * ==========================================================
     * 13. ADS REAL
     * ==========================================================
     */

    const investimentoAds =
      numero(
        resumoAds.investimento
      );

    const receitaAds =
      numero(
        resumoAds.receita_ads
      );

    const vendasAds =
      numero(
        resumoAds.vendas_ads
      );

    /*
     * Produto Ads pode não retornar
     * investimento individual,
     * mesmo quando a campanha possui gasto.
     */

    const adsAlocadoProdutos =
      produtosPerformance.reduce(
        (
          total,
          produto
        ) =>
          total +
          produto.investimento_ads,
        0
      );

    const adsNaoAlocado =
      Math.max(
        0,
        investimentoAds -
          adsAlocadoProdutos
      );

    /*
     * ==========================================================
     * 14. RESULTADO FINAL
     * ==========================================================
     */

    const lucroLiquido =
      lucroAntesAds -
      investimentoAds;

    const margem =
      faturamento > 0
        ? (
            lucroLiquido /
            faturamento
          ) * 100
        : 0;

    const roi =
      custoProdutos > 0
        ? (
            lucroLiquido /
            custoProdutos
          ) * 100
        : 0;

    /*
     * ACOS oficial do Ads:
     * investimento /
     * receita atribuída.
     */

    const acos =
      receitaAds > 0
        ? (
            investimentoAds /
            receitaAds
          ) * 100
        : numero(
            resumoAds.acos
          );

    const roas =
      investimentoAds > 0
        ? receitaAds /
          investimentoAds
        : numero(
            resumoAds.roas
          );

    /*
     * TACOS:
     *
     * Ads / faturamento total.
     *
     * Esse indicador continua possível
     * mesmo quando a API do ML devolve
     * receita Ads = 0.
     */

    const tacos =
      faturamento > 0
        ? (
            investimentoAds /
            faturamento
          ) * 100
        : 0;

    /*
     * ==========================================================
     * 15. CLASSIFICAÇÕES
     * ==========================================================
     */

    const lucrativos =
      produtosPerformance.filter(
        (produto) =>
          produto.lucro_liquido >
          0
      ).length;

    const prejuizo =
      produtosPerformance.filter(
        (produto) =>
          produto.lucro_liquido <
          0
      ).length;

    const margemNegativa =
      produtosPerformance
        .filter(
          (produto) =>
            produto.margem <
            0
        )
        .sort(
          (a, b) =>
            a.margem -
            b.margem
        );

    const melhoresMargens =
      [...produtosPerformance]
        .sort(
          (a, b) =>
            b.margem -
            a.margem
        )
        .slice(
          0,
          10
        );

    const maioresFaturamentos =
      [...produtosPerformance]
        .sort(
          (a, b) =>
            b.faturamento -
            a.faturamento
        )
        .slice(
          0,
          10
        );

    /*
     * ==========================================================
     * 16. RETORNO
     * ==========================================================
     */

    return NextResponse.json({
      conectado: true,

      periodo: {
        dias,
      },

      resumo: {
        faturamento,

        pedidos:
          numero(
            vendasData.resumo
              ?.pedidos
          ),

        unidades,

        ticket_medio:
          numero(
            vendasData.resumo
              ?.ticket_medio
          ),

        custo_produtos:
          custoProdutos,

        comissao,

        impostos,

        embalagem,

        frete,

        outras_despesas:
          outrasDespesas,

        tarifa_fixa:
          tarifaFixa,

        custos_operacionais:
          custosOperacionais,

        lucro_antes_ads:
          lucroAntesAds,

        investimento_ads:
          investimentoAds,

        receita_ads:
          receitaAds,

        vendas_ads:
          vendasAds,

        lucro_liquido:
          lucroLiquido,

        margem,

        roi,

        acos,

        roas,

        tacos,
      },

      ads: {
        disponivel:
          adsDisponivel,

        produtos_disponivel:
          adsProdutosDisponivel,

        investimento:
          investimentoAds,

        receita:
          receitaAds,

        impressoes:
          numero(
            resumoAds.impressoes
          ),

        cliques:
          numero(
            resumoAds.cliques
          ),

        ctr:
          numero(
            resumoAds.ctr
          ),

        cpc:
          numero(
            resumoAds.cpc
          ),

        investimento_alocado_produtos:
          adsAlocadoProdutos,

        investimento_nao_alocado:
          adsNaoAlocado,
      },

      classificacao: {
        total_produtos_vendidos:
          produtosPerformance.length,

        lucrativos,

        prejuizo,

        margem_zero:
          produtosPerformance.filter(
            (produto) =>
              produto.lucro_liquido ===
              0
          ).length,
      },

      diagnostico: {
        total_produtos_alcance:
          numero(
            custosData.total_produtos
          ),

        skus_com_cadastro:
          Array.from(
            skusComCadastro
          ),

        skus_sem_cadastro:
          Array.from(
            skusSemCadastro
          ),

        total_skus_com_cadastro:
          skusComCadastro.size,

        total_skus_sem_cadastro:
          skusSemCadastro.size,

        /*
         * Muito importante:
         *
         * se Ads total > Ads por produto,
         * a diferença não é distribuída
         * artificialmente entre SKUs.
         */

        ads_nao_alocado:
          adsNaoAlocado,
      },

      rankings: {
        melhores_margens:
          melhoresMargens,

        maiores_faturamentos:
          maioresFaturamentos,

        margem_negativa:
          margemNegativa,
      },

      produtos:
        produtosPerformance,
    });
  } catch (error) {
    console.error(
      "Erro análise Performance:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao gerar análise de Performance.",

        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}