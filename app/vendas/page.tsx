"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  DollarSign,
  Package,
  Plus,
  TrendingUp,
  Trash2,
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
  const [excluindoId, setExcluindoId] = useState<number | null>(
    null
  );

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  function numero(valor: string) {
    const convertido = Number(valor.replace(",", "."));

    return Number.isFinite(convertido)
      ? convertido
      : 0;
  }

  async function carregarDados() {
    setCarregando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
      String(produto.outras_despesas ?? 0)
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

  // =========================================================
  // PRÉVIA
  // =========================================================

  const qtd = numero(quantidade);
  const preco = numero(precoVenda);
  const custo = numero(custoUnitario);

  const faturamentoPrevisto =
    preco * qtd;

  const comissaoValor =
    preco * (numero(comissao) / 100);

  const impostosValor =
    preco * (numero(impostos) / 100);

  const acosValor =
    preco * (numero(acos) / 100);

  const promocaoValor =
    preco * (numero(promocao) / 100);

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

  // =========================================================
  // REGISTRAR VENDA
  // =========================================================

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

      setSalvando(false);
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

    setSalvando(false);
  }

  // =========================================================
  // EXCLUIR / ESTORNAR VENDA
  // =========================================================

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
          p_venda_id: venda.id,
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

  // =========================================================
  // INDICADORES
  // =========================================================

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
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#071E49] focus:ring-2 focus:ring-[#071E49]/10";

  return (
    <MainLayout>
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-[1600px] space-y-7 p-6 lg:p-8">

          {/* CABEÇALHO */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Vendas
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Registre suas vendas e ajuste os custos de cada operação.
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
                    behavior:
                      "smooth",
                    block: "start",
                  })
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F47B20] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={17} />
              Registrar venda
            </button>
          </div>

          {/* CARDS */}
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
                <Package size={19} />
              }
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
                  size={19}
                />
              }
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
                <DollarSign
                  size={19}
                />
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
                  size={19}
                />
              }
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
                <TrendingUp
                  size={19}
                />
              }
            />
          </div>

          {/* MENSAGEM */}
          {mensagem && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {mensagem}
            </div>
          )}

          {/* ERRO */}
          {erro && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {erro}
            </div>
          )}

          {/* FORMULÁRIO */}
          <div
            id="formulario-venda"
            className="rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-bold text-slate-900">
                Registrar venda
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Os dados são preenchidos pelo cadastro do produto, mas você pode editar tudo para esta venda.
              </p>
            </div>

            <div className="space-y-7 p-6">

              {/* DADOS DA VENDA */}
              <div>
                <h3 className="mb-4 text-sm font-bold text-[#071E49]">
                  Dados da venda
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Produto / SKU
                    </label>

                    <select
                      value={
                        produtoId
                      }
                      onChange={(
                        e
                      ) =>
                        selecionarProduto(
                          e.target
                            .value
                        )
                      }
                      className={
                        classeInput
                      }
                    >
                      <option value="">
                        Selecione um produto
                      </option>

                      {produtos.map(
                        (
                          produto
                        ) => (
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
                    value={
                      quantidade
                    }
                    onChange={
                      setQuantidade
                    }
                  />

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Data da venda
                    </label>

                    <div className="relative">
                      <CalendarDays
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="date"
                        value={
                          dataVenda
                        }
                        onChange={(
                          e
                        ) =>
                          setDataVenda(
                            e.target
                              .value
                          )
                        }
                        className={`${classeInput} pl-9`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PREÇO E CUSTOS */}
              <div>
                <h3 className="mb-4 text-sm font-bold text-[#071E49]">
                  Preço e custos
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <Campo
                    label="Preço de venda unitário"
                    value={
                      precoVenda
                    }
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
                    onChange={
                      setFrete
                    }
                    prefixo="R$"
                  />

                  <Campo
                    label="Embalagem"
                    value={
                      embalagem
                    }
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
                    value={
                      tarifaFixa
                    }
                    onChange={
                      setTarifaFixa
                    }
                    prefixo="R$"
                  />
                </div>
              </div>

              {/* PERCENTUAIS */}
              <div>
                <h3 className="mb-4 text-sm font-bold text-[#071E49]">
                  Percentuais da venda
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <Campo
                    label="Comissão"
                    value={
                      comissao
                    }
                    onChange={
                      setComissao
                    }
                    sufixo="%"
                  />

                  <Campo
                    label="Impostos"
                    value={
                      impostos
                    }
                    onChange={
                      setImpostos
                    }
                    sufixo="%"
                  />

                  <Campo
                    label="ACOS"
                    value={acos}
                    onChange={
                      setAcos
                    }
                    sufixo="%"
                  />

                  <Campo
                    label="Promoção"
                    value={
                      promocao
                    }
                    onChange={
                      setPromocao
                    }
                    sufixo="%"
                  />
                </div>
              </div>

              {/* PRÉVIA */}
              {produtoSelecionado && (
                <div className="rounded-2xl bg-slate-50 p-5">
                  <h3 className="mb-4 text-sm font-bold text-slate-800">
                    Prévia da venda
                  </h3>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
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
                    />

                    <Resumo
                      titulo="Margem"
                      valor={`${margemPrevista.toFixed(
                        2
                      )}%`}
                    />

                    <Resumo
                      titulo="ROI"
                      valor={`${roiPrevisto.toFixed(
                        2
                      )}%`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={
                  registrarVenda
                }
                disabled={
                  salvando ||
                  carregando
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#071E49] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0a2b67] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={17} />

                {salvando
                  ? "Registrando..."
                  : "Registrar venda"}
              </button>
            </div>
          </div>

          {/* HISTÓRICO */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Vendas recentes
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Histórico das vendas registradas.
                </p>
              </div>

              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                {vendas.length} venda(s)
              </span>
            </div>

            {carregando ? (
              <div className="p-12 text-center text-sm text-slate-400">
                Carregando vendas...
              </div>
            ) : vendas.length ===
              0 ? (
              <div className="p-12 text-center text-sm text-slate-400">
                Nenhuma venda registrada.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
                      <th className="px-6 py-3">
                        Data
                      </th>

                      <th className="px-4 py-3">
                        SKU
                      </th>

                      <th className="px-4 py-3">
                        Produto
                      </th>

                      <th className="px-4 py-3">
                        Qtd.
                      </th>

                      <th className="px-4 py-3">
                        Faturamento
                      </th>

                      <th className="px-4 py-3">
                        Lucro
                      </th>

                      <th className="px-4 py-3">
                        Margem
                      </th>

                      <th className="px-4 py-3">
                        ROI
                      </th>

                      <th className="px-4 py-3 text-right">
                        Ação
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {vendas.map(
                      (venda) => (
                        <tr
                          key={
                            venda.id
                          }
                          className="border-b border-slate-100 text-sm transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            {formatarData(
                              venda.data_venda
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {venda.sku ||
                              "-"}
                          </td>

                          <td className="max-w-[300px] px-4 py-4">
                            <p className="truncate">
                              {venda.nome_produto ||
                                "-"}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            {
                              venda.quantidade
                            }
                          </td>

                          <td className="px-4 py-4 font-semibold">
                            {formatarMoeda(
                              venda.faturamento
                            )}
                          </td>

                          <td
                            className={`px-4 py-4 font-semibold ${
                              Number(
                                venda.lucro
                              ) >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatarMoeda(
                              venda.lucro
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {Number(
                              venda.margem
                            ).toFixed(
                              2
                            )}
                            %
                          </td>

                          <td className="px-4 py-4">
                            {Number(
                              venda.roi
                            ).toFixed(
                              2
                            )}
                            %
                          </td>

                          <td className="px-4 py-4 text-right">
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
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Excluir venda e devolver ao estoque"
                            >
                              <Trash2
                                size={
                                  16
                                }
                              />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-slate-100 px-6 py-3.5">
              <p className="text-[11px] text-slate-400">
                Ao excluir uma venda, a quantidade vendida será devolvida automaticamente ao estoque.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

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
      <label className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <div className="relative">
        {prefixo && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
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
          className={`h-11 w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none transition focus:border-[#071E49] focus:ring-2 focus:ring-[#071E49]/10 ${
            prefixo
              ? "pl-9"
              : "pl-3"
          } ${
            sufixo
              ? "pr-8"
              : "pr-3"
          }`}
        />

        {sufixo && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
            {sufixo}
          </span>
        )}
      </div>
    </div>
  );
}

function Resumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400">
        {titulo}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {valor}
      </p>
    </div>
  );
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-[#071E49]">
        {icone}
      </div>

      <p className="mt-4 text-xs font-medium text-slate-500">
        {titulo}
      </p>

      <h2 className="mt-1 text-2xl font-bold text-slate-900">
        {valor}
      </h2>
    </div>
  );
}