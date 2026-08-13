"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  DollarSign,
  Package,
  Plus,
  TrendingUp,
  Trash2,
  Wallet,
  RefreshCw,
  BarChart3,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";

type Produto = {
  id: number;
  sku: string | null;
  nome: string | null;
  custo: number | null;
  preco_venda: number | null;
  estoque: number | null;
  comissao: number | null;
  impostos: number | null;
  embalagem: number | null;
  frete: number | null;
  outras_despesas: number | null;
  acos: number | null;
  promocao: number | null;
};

type Venda = {
  id: number;
  data_venda: string;
  produto_id: number | null;
  sku: string | null;
  nome_produto: string | null;
  quantidade: number;
  preco_venda: number;
  custo_unitario: number;
  faturamento: number;
  custo_total: number;
  lucro: number;
  margem: number;
  roi: number;
};

export default function VendasPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);

  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");

  const [precoVenda, setPrecoVenda] = useState("");
  const [custoUnitario, setCustoUnitario] = useState("");

  const [comissao, setComissao] = useState("");
  const [impostos, setImpostos] = useState("");
  const [acos, setAcos] = useState("");
  const [promocao, setPromocao] = useState("");

  const [frete, setFrete] = useState("");
  const [embalagem, setEmbalagem] = useState("");
  const [outrasDespesas, setOutrasDespesas] = useState("");

  const [tarifaFixa, setTarifaFixa] = useState("6.50");

  const [dataVenda, setDataVenda] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [excluindoId, setExcluindoId] = useState<
    number | null
  >(null);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  function numero(valor: string) {
    const convertido = Number(
      valor.replace(",", ".")
    );

    return Number.isFinite(convertido)
      ? convertido
      : 0;
  }

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErro("Usuário não autenticado.");
      setCarregando(false);
      return;
    }

    const {
      data: produtosData,
      error: produtosError,
    } = await supabase
      .from("produtos")
      .select(
        `
        id,
        sku,
        nome,
        custo,
        preco_venda,
        estoque,
        comissao,
        impostos,
        embalagem,
        frete,
        outras_despesas,
        acos,
        promocao
        `
      )
      .eq("user_id", user.id)
      .order("nome", {
        ascending: true,
      });

    if (produtosError) {
      console.error(
        "Erro ao carregar produtos:",
        produtosError
      );

      setErro(
        "Não foi possível carregar os produtos."
      );
    } else {
      setProdutos(produtosData || []);
    }

    const {
      data: vendasData,
      error: vendasError,
    } = await supabase
      .from("vendas")
      .select(
        `
        id,
        data_venda,
        produto_id,
        sku,
        nome_produto,
        quantidade,
        preco_venda,
        custo_unitario,
        faturamento,
        custo_total,
        lucro,
        margem,
        roi
        `
      )
      .eq("user_id", user.id)
      .order("data_venda", {
        ascending: false,
      });

    if (vendasError) {
      console.error(
        "Erro ao carregar vendas:",
        vendasError
      );

      setErro(
        "Não foi possível carregar as vendas."
      );
    } else {
      setVendas(vendasData || []);
    }

    setCarregando(false);
  }

  const produtoSelecionado = produtos.find(
    (produto) =>
      produto.id.toString() === produtoId
  );

  function selecionarProduto(valor: string) {
    setProdutoId(valor);

    const produto = produtos.find(
      (item) => item.id.toString() === valor
    );

    if (!produto) {
      setPrecoVenda("");
      setCustoUnitario("");

      setComissao("");
      setImpostos("");
      setAcos("");
      setPromocao("");

      setFrete("");
      setEmbalagem("");
      setOutrasDespesas("");

      setTarifaFixa("6.50");

      return;
    }

    setPrecoVenda(
      String(produto.preco_venda ?? 0)
    );

    setCustoUnitario(
      String(produto.custo ?? 0)
    );

    setComissao(
      String(produto.comissao ?? 0)
    );

    setImpostos(
      String(produto.impostos ?? 0)
    );

    setAcos(
      String(produto.acos ?? 0)
    );

    setPromocao(
      String(produto.promocao ?? 0)
    );

    setFrete(
      String(produto.frete ?? 0)
    );

    setEmbalagem(
      String(produto.embalagem ?? 0)
    );

    setOutrasDespesas(
      String(
        produto.outras_despesas ?? 0
      )
    );

    setTarifaFixa("6.50");

    setMensagem("");
    setErro("");
  }

  function formatarMoeda(
    valor: number | null | undefined
  ) {
    return Number(valor ?? 0).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString(
      "pt-BR"
    );
  }

  /*
   * =========================================================
   * PRÉVIA
   * =========================================================
   */

  const qtd = numero(quantidade);
  const preco = numero(precoVenda);
  const custo = numero(custoUnitario);

  const faturamentoPrevisto =
    preco * qtd;

  const comissaoValor =
    preco *
    (numero(comissao) / 100);

  const impostosValor =
    preco *
    (numero(impostos) / 100);

  const acosValor =
    preco *
    (numero(acos) / 100);

  const promocaoValor =
    preco *
    (numero(promocao) / 100);

  const custoUnitarioTotal =
    custo +
    comissaoValor +
    impostosValor +
    acosValor +
    promocaoValor +
    numero(frete) +
    numero(embalagem) +
    numero(outrasDespesas) +
    numero(tarifaFixa);

  const custoVendaPrevisto =
    custoUnitarioTotal * qtd;

  const lucroPrevisto =
    faturamentoPrevisto -
    custoVendaPrevisto;

  const margemPrevista =
    faturamentoPrevisto > 0
      ? (lucroPrevisto /
          faturamentoPrevisto) *
        100
      : 0;

  const custoProdutoTotal =
    custo * qtd;

  const roiPrevisto =
    custoProdutoTotal > 0
      ? (lucroPrevisto /
          custoProdutoTotal) *
        100
      : 0;

  /*
   * =========================================================
   * REGISTRAR VENDA
   * =========================================================
   */

  async function registrarVenda() {
    setMensagem("");
    setErro("");

    if (!produtoSelecionado) {
      setErro(
        "Selecione um produto."
      );

      return;
    }

    const quantidadeNumerica =
      numero(quantidade);

    const precoNumerico =
      numero(precoVenda);

    if (
      !Number.isInteger(
        quantidadeNumerica
      ) ||
      quantidadeNumerica <= 0
    ) {
      setErro(
        "Informe uma quantidade válida."
      );

      return;
    }

    if (
      quantidadeNumerica >
      Number(
        produtoSelecionado.estoque ?? 0
      )
    ) {
      setErro(
        `Estoque insuficiente. Disponível: ${
          produtoSelecionado.estoque ?? 0
        } unidade(s).`
      );

      return;
    }

    if (precoNumerico <= 0) {
      setErro(
        "Informe um preço de venda válido."
      );

      return;
    }

    setSalvando(true);

    try {
      const dataISO = new Date(
        `${dataVenda}T12:00:00`
      ).toISOString();

      const { error } =
        await supabase.rpc(
          "registrar_venda",
          {
            p_produto_id:
              produtoSelecionado.id,

            p_quantidade:
              quantidadeNumerica,

            p_preco_venda:
              precoNumerico,

            p_data_venda:
              dataISO,

            p_custo_unitario:
              numero(custoUnitario),

            p_comissao:
              numero(comissao),

            p_impostos:
              numero(impostos),

            p_acos:
              numero(acos),

            p_promocao:
              numero(promocao),

            p_frete:
              numero(frete),

            p_embalagem:
              numero(embalagem),

            p_outras_despesas:
              numero(outrasDespesas),

            p_tarifa_fixa:
              numero(tarifaFixa),
          }
        );

      if (error) {
        console.error(
          "Erro ao registrar venda:",
          error
        );

        setErro(
          error.message ||
            "Não foi possível registrar a venda."
        );

        return;
      }

      setMensagem(
        "Venda registrada com sucesso!"
      );

      setProdutoId("");
      setQuantidade("1");

      setPrecoVenda("");
      setCustoUnitario("");

      setComissao("");
      setImpostos("");
      setAcos("");
      setPromocao("");

      setFrete("");
      setEmbalagem("");
      setOutrasDespesas("");

      setTarifaFixa("6.50");

      setDataVenda(
        new Date()
          .toISOString()
          .split("T")[0]
      );

      await carregarDados();
    } finally {
      setSalvando(false);
    }
  }

  /*
   * =========================================================
   * EXCLUIR / ESTORNAR VENDA
   * =========================================================
   */

  async function excluirVenda(
    venda: Venda
  ) {
    const confirmar =
      window.confirm(
        `Deseja realmente excluir esta venda?\n\n` +
          `Produto: ${
            venda.nome_produto || "-"
          }\n` +
          `SKU: ${
            venda.sku || "-"
          }\n` +
          `Quantidade: ${
            venda.quantidade
          }\n\n` +
          `As ${
            venda.quantidade
          } unidade(s) serão devolvidas ao estoque.`
      );

    if (!confirmar) {
      return;
    }

    setMensagem("");
    setErro("");
    setExcluindoId(venda.id);

    const { error } =
      await supabase.rpc(
        "excluir_venda",
        {
          p_venda_id:
            venda.id,
        }
      );

    if (error) {
      console.error(
        "Erro ao excluir venda:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível excluir a venda."
      );

      setExcluindoId(null);

      return;
    }

    setMensagem(
      "Venda excluída e estoque devolvido com sucesso!"
    );

    await carregarDados();

    setExcluindoId(null);
  }

  /*
   * =========================================================
   * INDICADORES
   * =========================================================
   */

  const totalVendido =
    vendas.reduce(
      (total, venda) =>
        total +
        Number(
          venda.quantidade ?? 0
        ),
      0
    );

  const faturamentoTotal =
    vendas.reduce(
      (total, venda) =>
        total +
        Number(
          venda.faturamento ?? 0
        ),
      0
    );

  const lucroTotal =
    vendas.reduce(
      (total, venda) =>
        total +
        Number(
          venda.lucro ?? 0
        ),
      0
    );

  const custoTotal =
    vendas.reduce(
      (total, venda) =>
        total +
        Number(
          venda.custo_total ?? 0
        ),
      0
    );

  const margemMedia =
    faturamentoTotal > 0
      ? (lucroTotal /
          faturamentoTotal) *
        100
      : 0;

  const roiTotal =
    custoTotal > 0
      ? (lucroTotal /
          custoTotal) *
        100
      : 0;

  const classeInput =
    "h-11 w-full rounded-xl border border-[#213A57] bg-[#0D223B] px-3 text-[12px] text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-[#315678] focus:ring-4 focus:ring-blue-500/[0.04]";

  return (
    <MainLayout>
      <div className="-m-6 min-h-[calc(100vh-64px)] bg-[#07182B] p-6 lg:-m-8 lg:p-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          {/* =====================================================
              CABEÇALHO
          ===================================================== */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold">
                <span className="text-slate-500">
                  Alcance
                </span>

                <span className="text-slate-700">
                  /
                </span>

                <span className="text-slate-300">
                  Vendas
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white">
                Vendas
              </h1>

              <p className="mt-1.5 text-sm text-slate-400">
                Registre suas vendas,
                acompanhe os resultados e
                ajuste os custos de cada
                operação.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById(
                    "formulario-venda"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F47B20] px-5 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(244,123,32,0.20)] transition hover:-translate-y-0.5 hover:bg-[#FF861F]"
            >
              <Plus
                size={16}
                strokeWidth={2.4}
              />

              Registrar venda
            </button>
          </div>

          {/* =====================================================
              CARDS
          ===================================================== */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Card
              titulo="Unidades vendidas"
              valor={
                carregando
                  ? "..."
                  : totalVendido.toLocaleString(
                      "pt-BR"
                    )
              }
              icone={
                <Package
                  size={20}
                />
              }
              variante="blue"
            />

            <Card
              titulo="Faturamento"
              valor={
                carregando
                  ? "..."
                  : formatarMoeda(
                      faturamentoTotal
                    )
              }
              icone={
                <DollarSign
                  size={20}
                />
              }
              variante="violet"
            />

            <Card
              titulo="Lucro líquido"
              valor={
                carregando
                  ? "..."
                  : formatarMoeda(
                      lucroTotal
                    )
              }
              icone={
                <Wallet
                  size={20}
                />
              }
              variante={
                lucroTotal >= 0
                  ? "green"
                  : "red"
              }
            />

            <Card
              titulo="Margem média"
              valor={
                carregando
                  ? "..."
                  : `${margemMedia.toFixed(
                      2
                    )}%`
              }
              icone={
                <TrendingUp
                  size={20}
                />
              }
              variante="green"
            />

            <Card
              titulo="ROI"
              valor={
                carregando
                  ? "..."
                  : `${roiTotal.toFixed(
                      2
                    )}%`
              }
              icone={
                <BarChart3
                  size={20}
                />
              }
              variante="orange"
            />
          </div>

          {/* =====================================================
              MENSAGENS
          ===================================================== */}

          {mensagem && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[11px] font-semibold text-emerald-300">
              {mensagem}
            </div>
          )}

          {erro && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[11px] font-semibold text-red-300">
              {erro}
            </div>
          )}

          {/* =====================================================
              FORMULÁRIO
          ===================================================== */}

          <div
            id="formulario-venda"
            className="overflow-hidden rounded-2xl border border-[#1B3352] bg-[#091B30] shadow-[0_20px_50px_rgba(0,0,0,0.16)]"
          >
            {/* Cabeçalho formulário */}

            <div className="border-b border-[#17304D] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <Plus size={18} />
                </div>

                <div>
                  <h2 className="text-[15px] font-bold text-white">
                    Registrar venda
                  </h2>

                  <p className="mt-1 text-[10px] text-slate-500">
                    Os dados são preenchidos
                    pelo cadastro do produto,
                    mas você pode editar tudo
                    para esta operação.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8 p-6">
              {/* =================================================
                  DADOS DA VENDA
              ================================================= */}

              <section>
                <TituloSecao>
                  Dados da venda
                </TituloSecao>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[10px] font-semibold text-slate-400">
                      Produto / SKU
                    </label>

                    <select
                      value={produtoId}
                      onChange={(e) =>
                        selecionarProduto(
                          e.target.value
                        )
                      }
                      className={classeInput}
                    >
                      <option value="">
                        Selecione um produto
                      </option>

                      {produtos.map(
                        (produto) => (
                          <option
                            key={
                              produto.id
                            }
                            value={
                              produto.id
                            }
                          >
                            {produto.sku ||
                              "Sem SKU"}{" "}
                            —{" "}
                            {produto.nome ||
                              "Sem nome"}{" "}
                            — Estoque:{" "}
                            {produto.estoque ??
                              0}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <Campo
                    label="Quantidade"
                    value={quantidade}
                    onChange={
                      setQuantidade
                    }
                  />

                  <div>
                    <label className="mb-2 block text-[10px] font-semibold text-slate-400">
                      Data da venda
                    </label>

                    <div className="relative">
                      <CalendarDays
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        type="date"
                        value={
                          dataVenda
                        }
                        onChange={(e) =>
                          setDataVenda(
                            e.target.value
                          )
                        }
                        className={`${classeInput} pl-9 [color-scheme:dark]`}
                      />
                    </div>
                  </div>
                </div>

                {produtoSelecionado && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#1B3352] bg-[#0D223B] px-4 py-3">
                    <span className="text-[10px] text-slate-500">
                      Estoque disponível
                    </span>

                    <span
                      className={[
                        "rounded-lg px-2.5 py-1 text-[10px] font-bold",
                        Number(
                          produtoSelecionado.estoque ??
                            0
                        ) <= 0
                          ? "bg-red-500/10 text-red-400"
                          : Number(
                                produtoSelecionado.estoque ??
                                  0
                              ) <= 5
                            ? "bg-orange-500/10 text-orange-400"
                            : "bg-blue-500/10 text-blue-300",
                      ].join(" ")}
                    >
                      {produtoSelecionado.estoque ??
                        0}{" "}
                      un.
                    </span>

                    <span className="text-[10px] text-slate-600">
                      •
                    </span>

                    <span className="text-[10px] text-slate-500">
                      {produtoSelecionado.sku ||
                        "Sem SKU"}
                    </span>
                  </div>
                )}
              </section>

              <Divisor />

              {/* =================================================
                  PREÇO E CUSTOS
              ================================================= */}

              <section>
                <TituloSecao>
                  Preço e custos
                </TituloSecao>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <Campo
                    label="Preço de venda"
                    value={precoVenda}
                    onChange={
                      setPrecoVenda
                    }
                    prefixo="R$"
                  />

                  <Campo
                    label="Custo unitário"
                    value={
                      custoUnitario
                    }
                    onChange={
                      setCustoUnitario
                    }
                    prefixo="R$"
                  />

                  <Campo
                    label="Frete"
                    value={frete}
                    onChange={setFrete}
                    prefixo="R$"
                  />

                  <Campo
                    label="Embalagem"
                    value={embalagem}
                    onChange={
                      setEmbalagem
                    }
                    prefixo="R$"
                  />

                  <Campo
                    label="Outras despesas"
                    value={
                      outrasDespesas
                    }
                    onChange={
                      setOutrasDespesas
                    }
                    prefixo="R$"
                  />

                  <Campo
                    label="Tarifa fixa"
                    value={tarifaFixa}
                    onChange={
                      setTarifaFixa
                    }
                    prefixo="R$"
                  />
                </div>
              </section>

              <Divisor />

              {/* =================================================
                  PERCENTUAIS
              ================================================= */}

              <section>
                <TituloSecao>
                  Percentuais da venda
                </TituloSecao>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <Campo
                    label="Comissão"
                    value={comissao}
                    onChange={
                      setComissao
                    }
                    sufixo="%"
                  />

                  <Campo
                    label="Impostos"
                    value={impostos}
                    onChange={
                      setImpostos
                    }
                    sufixo="%"
                  />

                  <Campo
                    label="ACOS"
                    value={acos}
                    onChange={setAcos}
                    sufixo="%"
                  />

                  <Campo
                    label="Promoção"
                    value={promocao}
                    onChange={
                      setPromocao
                    }
                    sufixo="%"
                  />
                </div>
              </section>

              {/* =================================================
                  PRÉVIA
              ================================================= */}

              {produtoSelecionado && (
                <>
                  <Divisor />

                  <section>
                    <div className="mb-4 flex items-center justify-between">
                      <TituloSecao>
                        Prévia da venda
                      </TituloSecao>

                      <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-[9px] font-bold text-blue-300">
                        Atualização em tempo real
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <Resumo
                        titulo="Faturamento"
                        valor={formatarMoeda(
                          faturamentoPrevisto
                        )}
                      />

                      <Resumo
                        titulo="Custos"
                        valor={formatarMoeda(
                          custoVendaPrevisto
                        )}
                      />

                      <Resumo
                        titulo="Lucro"
                        valor={formatarMoeda(
                          lucroPrevisto
                        )}
                        destaque={
                          lucroPrevisto >= 0
                            ? "positivo"
                            : "negativo"
                        }
                      />

                      <Resumo
                        titulo="Margem"
                        valor={`${margemPrevista.toFixed(
                          2
                        )}%`}
                        destaque={
                          margemPrevista >= 0
                            ? "positivo"
                            : "negativo"
                        }
                      />

                      <Resumo
                        titulo="ROI"
                        valor={`${roiPrevisto.toFixed(
                          2
                        )}%`}
                        destaque={
                          roiPrevisto >= 0
                            ? "positivo"
                            : "negativo"
                        }
                      />
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* Rodapé formulário */}

            <div className="flex justify-end border-t border-[#17304D] bg-[#0A1D33] px-6 py-4">
              <button
                type="button"
                onClick={
                  registrarVenda
                }
                disabled={
                  salvando ||
                  carregando
                }
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F47B20] px-6 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(244,123,32,0.18)] transition hover:bg-[#FF861F] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvando ? (
                  <RefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Plus size={16} />
                )}

                {salvando
                  ? "Registrando..."
                  : "Registrar venda"}
              </button>
            </div>
          </div>

          {/* =====================================================
              HISTÓRICO
          ===================================================== */}

          <div className="overflow-hidden rounded-2xl border border-[#1B3352] bg-[#091B30] shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
            <div className="flex flex-col gap-4 border-b border-[#17304D] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-white">
                  Vendas recentes
                </h2>

                <p className="mt-1 text-[10px] text-slate-500">
                  Histórico das vendas
                  registradas.
                </p>
              </div>

              <span className="w-fit rounded-lg bg-blue-500/10 px-3 py-1.5 text-[9px] font-bold text-blue-300">
                {vendas.length} venda(s)
              </span>
            </div>

            {carregando ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-3">
                <RefreshCw
                  size={18}
                  className="animate-spin text-blue-400"
                />

                <p className="text-[10px] text-slate-500">
                  Carregando vendas...
                </p>
              </div>
            ) : vendas.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#122943]">
                  <Package
                    size={19}
                    className="text-slate-500"
                  />
                </div>

                <p className="mt-4 text-[12px] font-semibold text-slate-400">
                  Nenhuma venda registrada
                </p>

                <p className="mt-1 text-[10px] text-slate-600">
                  As vendas aparecerão
                  aqui após o registro.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead>
                    <tr className="border-b border-[#17304D] bg-[#0D223B] text-left">
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Data
                      </th>

                      <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        SKU
                      </th>

                      <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Produto
                      </th>

                      <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Qtd.
                      </th>

                      <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Faturamento
                      </th>

                      <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Lucro
                      </th>

                      <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Margem
                      </th>

                      <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        ROI
                      </th>

                      <th className="px-5 py-4 text-right text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Ação
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {vendas.map(
                      (venda) => {
                        const lucro =
                          Number(
                            venda.lucro
                          );

                        const margem =
                          Number(
                            venda.margem
                          );

                        const roi =
                          Number(
                            venda.roi
                          );

                        return (
                          <tr
                            key={
                              venda.id
                            }
                            className="border-b border-[#142D49] text-[11px] transition hover:bg-white/[0.025]"
                          >
                            <td className="px-6 py-4 text-slate-400">
                              {formatarData(
                                venda.data_venda
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <span className="rounded-lg bg-blue-500/10 px-2.5 py-1.5 font-mono text-[9px] font-bold text-blue-300">
                                {venda.sku ||
                                  "-"}
                              </span>
                            </td>

                            <td className="max-w-[280px] px-4 py-4">
                              <p className="truncate font-semibold text-slate-200">
                                {venda.nome_produto ||
                                  "-"}
                              </p>
                            </td>

                            <td className="px-4 py-4 text-slate-400">
                              {
                                venda.quantidade
                              }
                            </td>

                            <td className="px-4 py-4 font-bold text-white">
                              {formatarMoeda(
                                venda.faturamento
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={[
                                  "font-bold",
                                  lucro >= 0
                                    ? "text-emerald-400"
                                    : "text-red-400",
                                ].join(
                                  " "
                                )}
                              >
                                {formatarMoeda(
                                  lucro
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <BadgePercentual
                                valor={
                                  margem
                                }
                              />
                            </td>

                            <td className="px-4 py-4">
                              <BadgePercentual
                                valor={roi}
                              />
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  excluirVenda(
                                    venda
                                  )
                                }
                                disabled={
                                  excluindoId ===
                                  venda.id
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Excluir venda e devolver ao estoque"
                              >
                                {excluindoId ===
                                venda.id ? (
                                  <RefreshCw
                                    size={
                                      14
                                    }
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={
                                      14
                                    }
                                  />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-[#17304D] px-6 py-3.5">
              <p className="text-[9px] text-slate-600">
                Ao excluir uma venda, a
                quantidade vendida será
                devolvida automaticamente
                ao estoque.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

/*
 * =========================================================
 * CAMPO
 * =========================================================
 */

function Campo({
  label,
  value,
  onChange,
  prefixo,
  sufixo,
}: {
  label: string;
  value: string;

  onChange: (
    valor: string
  ) => void;

  prefixo?: string;
  sufixo?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-semibold text-slate-400">
        {label}
      </label>

      <div className="relative">
        {prefixo && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500">
            {prefixo}
          </span>
        )}

        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          className={[
            "h-11 w-full rounded-xl border border-[#213A57] bg-[#0D223B] text-[12px] text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-[#315678] focus:ring-4 focus:ring-blue-500/[0.04]",

            prefixo
              ? "pl-9"
              : "pl-3",

            sufixo
              ? "pr-8"
              : "pr-3",
          ].join(" ")}
        />

        {sufixo && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500">
            {sufixo}
          </span>
        )}
      </div>
    </div>
  );
}

/*
 * =========================================================
 * RESUMO
 * =========================================================
 */

function Resumo({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: string;

  destaque?:
    | "positivo"
    | "negativo";
}) {
  return (
    <div className="rounded-xl border border-[#1B3352] bg-[#0D223B] p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {titulo}
      </p>

      <p
        className={[
          "mt-2 text-[14px] font-bold",

          destaque ===
          "positivo"
            ? "text-emerald-400"
            : destaque ===
                "negativo"
              ? "text-red-400"
              : "text-white",
        ].join(" ")}
      >
        {valor}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * CARD
 * =========================================================
 */

function Card({
  titulo,
  valor,
  icone,
  variante,
}: {
  titulo: string;
  valor: string;
  icone: React.ReactNode;

  variante:
    | "blue"
    | "violet"
    | "green"
    | "orange"
    | "red";
}) {
  const estilos = {
    blue:
      "bg-blue-500/10 text-blue-400 ring-blue-400/10",

    violet:
      "bg-violet-500/10 text-violet-400 ring-violet-400/10",

    green:
      "bg-emerald-500/10 text-emerald-400 ring-emerald-400/10",

    orange:
      "bg-orange-500/10 text-orange-400 ring-orange-400/10",

    red:
      "bg-red-500/10 text-red-400 ring-red-400/10",
  };

  return (
    <div className="rounded-2xl border border-[#1B3352] bg-[#0B1E35] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${estilos[variante]}`}
      >
        {icone}
      </div>

      <p className="mt-4 text-[10px] font-medium text-slate-400">
        {titulo}
      </p>

      <h2 className="mt-1 text-[22px] font-bold tracking-[-0.02em] text-white">
        {valor}
      </h2>
    </div>
  );
}

/*
 * =========================================================
 * TÍTULO DE SEÇÃO
 * =========================================================
 */

function TituloSecao({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-300">
      {children}
    </h3>
  );
}

/*
 * =========================================================
 * DIVISOR
 * =========================================================
 */

function Divisor() {
  return (
    <div className="h-px bg-[#17304D]" />
  );
}

/*
 * =========================================================
 * BADGE %
 * =========================================================
 */

function BadgePercentual({
  valor,
}: {
  valor: number;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-lg px-2.5 py-1.5 text-[9px] font-bold",

        valor >= 15
          ? "bg-emerald-500/10 text-emerald-400"
          : valor >= 5
            ? "bg-amber-500/10 text-amber-400"
            : valor >= 0
              ? "bg-orange-500/10 text-orange-400"
              : "bg-red-500/10 text-red-400",
      ].join(" ")}
    >
      {valor.toFixed(2)}%
    </span>
  );
}