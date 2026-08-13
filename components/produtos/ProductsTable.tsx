"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  RefreshCw,
  Boxes,
  DollarSign,
  TrendingUp,
  BarChart3,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Produto = {
  id: number;
  sku: string | null;
  nome: string | null;
  numero_original: string | null;
  categoria: string | null;

  custo: number | null;
  preco_venda: number | null;

  comissao: number | null;
  impostos: number | null;

  embalagem: number | null;
  frete: number | null;
  outras_despesas: number | null;

  acos: number | null;
  promocao: number | null;

  estoque: number | null;
};

const ITENS_POR_PAGINA = 8;

export default function ProductsTable() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [busca, setBusca] = useState("");
  const [buscaNumeroOriginal, setBuscaNumeroOriginal] =
    useState("");

  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState("Todas");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [excluindo, setExcluindo] = useState<
    number | null
  >(null);

  const [paginaAtual, setPaginaAtual] = useState(1);

  async function carregarProdutos() {
    setCarregando(true);
    setErro("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "Erro ao verificar usuário:",
        userError
      );

      setErro(
        "Não foi possível verificar o usuário logado."
      );

      setCarregando(false);

      return;
    }

    if (!user) {
      setErro("Sua sessão expirou.");

      setCarregando(false);

      return;
    }

    const { data, error } = await supabase
      .from("produtos")
      .select(
        `
        id,
        sku,
        nome,
        numero_original,
        categoria,
        custo,
        preco_venda,
        comissao,
        impostos,
        embalagem,
        frete,
        outras_despesas,
        acos,
        promocao,
        estoque
        `
      )
      .eq("user_id", user.id)
      .order("id", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Erro ao carregar produtos:",
        error
      );

      setErro(
        "Erro ao carregar os produtos: " +
          error.message
      );

      setCarregando(false);

      return;
    }

    setProdutos((data || []) as Produto[]);

    setCarregando(false);
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [
    busca,
    buscaNumeroOriginal,
    categoriaSelecionada,
  ]);

  async function excluirProduto(
    id: number,
    nome: string | null
  ) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o produto "${
        nome || "sem nome"
      }"?`
    );

    if (!confirmar) {
      return;
    }

    setExcluindo(id);
    setErro("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErro(
        "Não foi possível verificar o usuário."
      );

      setExcluindo(null);

      return;
    }

    const { error } = await supabase
      .from("produtos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Erro ao excluir produto:",
        error
      );

      setErro(
        "Erro ao excluir o produto: " +
          error.message
      );

      setExcluindo(null);

      return;
    }

    setProdutos((produtosAtuais) =>
      produtosAtuais.filter(
        (produto) => produto.id !== id
      )
    );

    setExcluindo(null);
  }

  function normalizarTexto(
    texto: string | null | undefined
  ) {
    return (texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function normalizarCodigo(
    texto: string | null | undefined
  ) {
    return (texto || "")
      .toLowerCase()
      .replace(/\s/g, "")
      .trim();
  }

  function formatarMoeda(
    valor: number | null | undefined
  ) {
    return Number(valor || 0).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  function calcularLucro(produto: Produto) {
    const venda = Number(
      produto.preco_venda || 0
    );

    const custo = Number(
      produto.custo || 0
    );

    const comissao = Number(
      produto.comissao || 0
    );

    const impostos = Number(
      produto.impostos || 0
    );

    const embalagem = Number(
      produto.embalagem || 0
    );

    const frete = Number(
      produto.frete || 0
    );

    const outrasDespesas = Number(
      produto.outras_despesas || 0
    );

    const acos = Number(
      produto.acos || 0
    );

    const promocao = Number(
      produto.promocao || 0
    );

    if (venda <= 0) {
      return 0;
    }

    const valorComissao =
      venda * (comissao / 100);

    const valorImpostos =
      venda * (impostos / 100);

    const valorAcos =
      venda * (acos / 100);

    const valorPromocao =
      venda * (promocao / 100);

    const lucro =
      venda -
      custo -
      valorComissao -
      valorImpostos -
      embalagem -
      frete -
      outrasDespesas -
      valorAcos -
      valorPromocao;

    return lucro;
  }

  function calcularMargem(produto: Produto) {
    const venda = Number(
      produto.preco_venda || 0
    );

    if (venda <= 0) {
      return 0;
    }

    const lucro =
      calcularLucro(produto);

    return (lucro / venda) * 100;
  }

  function calcularRoi(produto: Produto) {
    const custo = Number(
      produto.custo || 0
    );

    if (custo <= 0) {
      return 0;
    }

    const lucro =
      calcularLucro(produto);

    return (lucro / custo) * 100;
  }

  /*
   * =========================================================
   * CATEGORIAS
   * =========================================================
   */

  const categorias = useMemo(() => {
    const lista = produtos
      .map(
        (produto) =>
          produto.categoria?.trim()
      )
      .filter(
        (
          categoria
        ): categoria is string =>
          Boolean(categoria)
      );

    return Array.from(
      new Set(lista)
    ).sort();
  }, [produtos]);

  /*
   * =========================================================
   * FILTROS
   * =========================================================
   */

  const produtosFiltrados = useMemo(() => {
    const termoBusca =
      normalizarTexto(busca);

    const termoNumeroOriginal =
      normalizarCodigo(
        buscaNumeroOriginal
      );

    return produtos.filter(
      (produto) => {
        /*
         * Busca principal
         */

        const correspondeBusca =
          !termoBusca ||
          normalizarTexto(
            produto.nome
          ).includes(termoBusca) ||
          normalizarTexto(
            produto.sku
          ).includes(termoBusca) ||
          normalizarTexto(
            produto.categoria
          ).includes(termoBusca);

        /*
         * Categoria
         */

        const correspondeCategoria =
          categoriaSelecionada ===
            "Todas" ||
          produto.categoria ===
            categoriaSelecionada;

        /*
         * Número original
         *
         * Aceita um ou vários números
         * cadastrados no mesmo campo.
         *
         * Exemplo:
         * 5U0122051B, 377121109, 5U0122051C
         */

        const numeroOriginalProduto =
          normalizarCodigo(
            produto.numero_original
          );

        const correspondeNumeroOriginal =
          !termoNumeroOriginal ||
          numeroOriginalProduto.includes(
            termoNumeroOriginal
          );

        return (
          correspondeBusca &&
          correspondeCategoria &&
          correspondeNumeroOriginal
        );
      }
    );
  }, [
    produtos,
    busca,
    buscaNumeroOriginal,
    categoriaSelecionada,
  ]);

  /*
   * =========================================================
   * INDICADORES
   * =========================================================
   */

  const totalSkus = produtos.length;

  const totalUnidades =
    produtos.reduce(
      (total, produto) =>
        total +
        Number(
          produto.estoque || 0
        ),
      0
    );

  const valorEstoque =
    produtos.reduce(
      (total, produto) => {
        const estoque = Number(
          produto.estoque || 0
        );

        const custo = Number(
          produto.custo || 0
        );

        return (
          total + estoque * custo
        );
      },
      0
    );

  const margemMedia =
    produtos.length === 0
      ? 0
      : produtos.reduce(
          (total, produto) =>
            total +
            calcularMargem(produto),
          0
        ) / produtos.length;

  const roiMedio =
    produtos.length === 0
      ? 0
      : produtos.reduce(
          (total, produto) =>
            total +
            calcularRoi(produto),
          0
        ) / produtos.length;

  /*
   * =========================================================
   * PAGINAÇÃO
   * =========================================================
   */

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      produtosFiltrados.length /
        ITENS_POR_PAGINA
    )
  );

  const paginaSegura = Math.min(
    paginaAtual,
    totalPaginas
  );

  const inicio =
    (paginaSegura - 1) *
    ITENS_POR_PAGINA;

  const fim =
    inicio + ITENS_POR_PAGINA;

  const produtosPagina =
    produtosFiltrados.slice(
      inicio,
      fim
    );

  function paginaAnterior() {
    setPaginaAtual((pagina) =>
      Math.max(1, pagina - 1)
    );
  }

  function proximaPagina() {
    setPaginaAtual((pagina) =>
      Math.min(
        totalPaginas,
        pagina + 1
      )
    );
  }

  function limparFiltros() {
    setBusca("");
    setBuscaNumeroOriginal("");
    setCategoriaSelecionada(
      "Todas"
    );
    setPaginaAtual(1);
  }

  const possuiFiltro =
    Boolean(busca) ||
    Boolean(buscaNumeroOriginal) ||
    categoriaSelecionada !==
      "Todas";

  return (
    <div className="space-y-5">
      {/* =====================================================
          CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Produtos */}

        <div className="rounded-2xl border border-[#1B3352] bg-[#0B1E35] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-400/10">
              <Boxes size={21} />
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-400">
                Total de Produtos
              </p>

              <p className="mt-1 text-[23px] font-bold text-white">
                {totalSkus}
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                {totalUnidades} unidades
                em estoque
              </p>
            </div>
          </div>
        </div>

        {/* Estoque */}

        <div className="rounded-2xl border border-[#1B3352] bg-[#0B1E35] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-400/10">
              <DollarSign
                size={21}
              />
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-400">
                Valor em Estoque
              </p>

              <p className="mt-1 text-[23px] font-bold text-white">
                {formatarMoeda(
                  valorEstoque
                )}
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Baseado no custo atual
              </p>
            </div>
          </div>
        </div>

        {/* Margem */}

        <div className="rounded-2xl border border-[#1B3352] bg-[#0B1E35] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-400/10">
              <TrendingUp
                size={21}
              />
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-400">
                Margem Média
              </p>

              <p className="mt-1 text-[23px] font-bold text-white">
                {margemMedia.toFixed(
                  2
                )}
                %
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Média dos produtos
              </p>
            </div>
          </div>
        </div>

        {/* ROI */}

        <div className="rounded-2xl border border-[#1B3352] bg-[#0B1E35] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 ring-1 ring-orange-400/10">
              <BarChart3
                size={21}
              />
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-400">
                ROI Médio
              </p>

              <p className="mt-1 text-[23px] font-bold text-white">
                {roiMedio.toFixed(2)}
                %
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Retorno sobre custo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          PAINEL PRINCIPAL
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-[#1B3352] bg-[#091B30] shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
        {/* FILTROS */}

        <div className="border-b border-[#17304D] p-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto_auto_auto]">
            {/* Busca produto */}

            <div>
              <p className="mb-2 text-[10px] font-semibold text-slate-400">
                Buscar por produto ou
                SKU
              </p>

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={busca}
                  onChange={(e) =>
                    setBusca(
                      e.target.value
                    )
                  }
                  placeholder="Ex: Mangueira Gol, 905885..."
                  className="h-11 w-full rounded-xl border border-[#213A57] bg-[#0D223B] pl-10 pr-4 text-[12px] text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-[#315678] focus:ring-4 focus:ring-blue-500/[0.04]"
                />
              </div>
            </div>

            {/* Número original */}

            <div>
              <p className="mb-2 text-[10px] font-semibold text-slate-400">
                Buscar por número
                original
              </p>

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={
                    buscaNumeroOriginal
                  }
                  onChange={(e) =>
                    setBuscaNumeroOriginal(
                      e.target.value
                    )
                  }
                  placeholder="Ex: 1J0122051AB..."
                  className="h-11 w-full rounded-xl border border-[#213A57] bg-[#0D223B] pl-10 pr-4 text-[12px] text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-[#315678] focus:ring-4 focus:ring-blue-500/[0.04]"
                />
              </div>
            </div>

            {/* Categoria */}

            <div className="self-end">
              <div className="relative">
                <SlidersHorizontal
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={
                    categoriaSelecionada
                  }
                  onChange={(e) =>
                    setCategoriaSelecionada(
                      e.target.value
                    )
                  }
                  className="h-11 min-w-[160px] appearance-none rounded-xl border border-[#213A57] bg-[#0D223B] pl-9 pr-9 text-[11px] font-medium text-slate-300 outline-none"
                >
                  <option value="Todas">
                    Todas categorias
                  </option>

                  {categorias.map(
                    (categoria) => (
                      <option
                        key={
                          categoria
                        }
                        value={
                          categoria
                        }
                      >
                        {categoria}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* Limpar */}

            {possuiFiltro && (
              <div className="self-end">
                <button
                  type="button"
                  onClick={
                    limparFiltros
                  }
                  className="flex h-11 items-center gap-2 rounded-xl border border-[#213A57] px-4 text-[11px] font-semibold text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
                >
                  <X size={14} />

                  Limpar
                </button>
              </div>
            )}

            {/* Novo produto */}

            <div className="self-end">
              <Link
                href="/produtos/novo"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F47B20] px-5 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(244,123,32,0.20)] transition hover:-translate-y-0.5 hover:bg-[#FF861F]"
              >
                <Plus
                  size={16}
                  strokeWidth={2.4}
                />

                Novo Produto
              </Link>
            </div>
          </div>
        </div>

        {/* Erro */}

        {erro && (
          <div className="mx-5 mt-5 flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[11px] text-red-300">
            <span>{erro}</span>

            <button
              type="button"
              onClick={
                carregarProdutos
              }
              className="flex shrink-0 items-center gap-2 font-semibold"
            >
              <RefreshCw
                size={13}
              />

              Tentar novamente
            </button>
          </div>
        )}

        {/* Loading */}

        {carregando ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
              <RefreshCw
                size={20}
                className="animate-spin text-blue-400"
              />
            </div>

            <p className="text-[11px] text-slate-500">
              Carregando produtos...
            </p>
          </div>
        ) : (
          <>
            {/* =================================================
                TABELA
            ================================================= */}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px]">
                <thead>
                  <tr className="border-b border-[#17304D] bg-[#0D223B] text-left">
                    <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Produto
                    </th>

                    <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      SKU
                    </th>

                    <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Nº Original
                    </th>

                    <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Categoria
                    </th>

                    <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Custo
                    </th>

                    <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Venda
                    </th>

                    <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Margem
                    </th>

                    <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Estoque
                    </th>

                    <th className="px-5 py-4 text-center text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {produtosPagina.map(
                    (produto) => {
                      const margem =
                        calcularMargem(
                          produto
                        );

                      const estoque =
                        Number(
                          produto.estoque ||
                            0
                        );

                      return (
                        <tr
                          key={
                            produto.id
                          }
                          className="group border-b border-[#142D49] transition hover:bg-white/[0.025]"
                        >
                          {/* Produto */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#243D58] bg-[#122943]">
                                <Package
                                  size={
                                    16
                                  }
                                  className="text-blue-300"
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[260px] truncate text-[11px] font-semibold text-slate-100">
                                  {produto.nome ||
                                    "Sem nome"}
                                </p>

                                <p className="mt-1 text-[9px] text-slate-500">
                                  Produto
                                  cadastrado
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}

                          <td className="px-4 py-4">
                            <span className="rounded-lg bg-blue-500/10 px-2.5 py-1.5 font-mono text-[9px] font-bold text-blue-300">
                              {produto.sku ||
                                "-"}
                            </span>
                          </td>

                          {/* Número Original */}

                          <td className="px-4 py-4">
                            {produto.numero_original ? (
                              <div className="max-w-[180px]">
                                <p
                                  title={
                                    produto.numero_original
                                  }
                                  className="truncate font-mono text-[9px] font-semibold text-slate-300"
                                >
                                  {
                                    produto.numero_original
                                  }
                                </p>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-600">
                                -
                              </span>
                            )}
                          </td>

                          {/* Categoria */}

                          <td className="px-4 py-4 text-[10px] font-medium text-slate-400">
                            {produto.categoria ||
                              "-"}
                          </td>

                          {/* Custo */}

                          <td className="px-4 py-4 text-[10px] text-slate-400">
                            {formatarMoeda(
                              produto.custo
                            )}
                          </td>

                          {/* Venda */}

                          <td className="px-4 py-4 text-[11px] font-bold text-white">
                            {formatarMoeda(
                              produto.preco_venda
                            )}
                          </td>

                          {/* Margem */}

                          <td className="px-4 py-4">
                            <span
                              className={[
                                "inline-flex rounded-lg px-2.5 py-1.5 text-[9px] font-bold",

                                margem >=
                                15
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : margem >=
                                      5
                                    ? "bg-amber-500/10 text-amber-400"
                                    : margem >=
                                        0
                                      ? "bg-orange-500/10 text-orange-400"
                                      : "bg-red-500/10 text-red-400",
                              ].join(
                                " "
                              )}
                            >
                              {margem.toFixed(
                                2
                              )}
                              %
                            </span>
                          </td>

                          {/* Estoque */}

                          <td className="px-4 py-4">
                            <span
                              className={[
                                "inline-flex rounded-lg px-2.5 py-1.5 text-[9px] font-semibold",

                                estoque <=
                                0
                                  ? "bg-red-500/10 text-red-400"
                                  : estoque <=
                                      5
                                    ? "bg-orange-500/10 text-orange-400"
                                    : "bg-blue-500/10 text-blue-300",
                              ].join(
                                " "
                              )}
                            >
                              {estoque} un.
                            </span>
                          </td>

                          {/* Ações */}

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <Link
                                href={`/produtos/editar/${produto.id}`}
                                title="Editar produto"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-300"
                              >
                                <Pencil
                                  size={
                                    14
                                  }
                                  strokeWidth={
                                    1.8
                                  }
                                />
                              </Link>

                              <button
                                type="button"
                                title="Excluir produto"
                                disabled={
                                  excluindo ===
                                  produto.id
                                }
                                onClick={() =>
                                  excluirProduto(
                                    produto.id,
                                    produto.nome
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                              >
                                {excluindo ===
                                produto.id ? (
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
                                    strokeWidth={
                                      1.8
                                    }
                                  />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}

                  {produtosPagina.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={9}
                      >
                        <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#122943]">
                            <Package
                              size={
                                23
                              }
                              className="text-slate-500"
                            />
                          </div>

                          <p className="mt-4 text-sm font-semibold text-slate-300">
                            Nenhum produto
                            encontrado
                          </p>

                          <p className="mt-2 max-w-[330px] text-[10px] leading-5 text-slate-500">
                            Tente alterar
                            o SKU, nome,
                            número original
                            ou filtros
                            utilizados.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* =================================================
                RODAPÉ / PAGINAÇÃO
            ================================================= */}

            <div className="flex flex-col gap-4 border-t border-[#17304D] px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] text-slate-500">
                  {produtosFiltrados.length ===
                  0
                    ? "Nenhum produto"
                    : `Mostrando ${
                        inicio + 1
                      } a ${Math.min(
                        fim,
                        produtosFiltrados.length
                      )} de ${
                        produtosFiltrados.length
                      } produtos`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={
                    carregarProdutos
                  }
                  className="mr-2 flex h-8 items-center gap-2 rounded-lg px-3 text-[9px] font-semibold text-slate-500 transition hover:bg-white/[0.04] hover:text-white"
                >
                  <RefreshCw
                    size={12}
                  />

                  Atualizar
                </button>

                <button
                  type="button"
                  onClick={
                    paginaAnterior
                  }
                  disabled={
                    paginaSegura <=
                    1
                  }
                  className="flex h-8 items-center gap-1 rounded-lg border border-[#213A57] px-3 text-[9px] font-semibold text-slate-400 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft
                    size={13}
                  />

                  Anterior
                </button>

                <div className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#F47B20] px-2 text-[10px] font-bold text-white">
                  {paginaSegura}
                </div>

                <span className="text-[9px] text-slate-600">
                  de{" "}
                  {totalPaginas}
                </span>

                <button
                  type="button"
                  onClick={
                    proximaPagina
                  }
                  disabled={
                    paginaSegura >=
                    totalPaginas
                  }
                  className="flex h-8 items-center gap-1 rounded-lg border border-[#213A57] px-3 text-[9px] font-semibold text-slate-400 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Próximo

                  <ChevronRight
                    size={13}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}