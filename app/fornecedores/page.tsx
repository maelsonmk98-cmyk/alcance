"use client";

import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Building2,
  Plus,
  Search,
  Upload,
  PackageSearch,
  Trophy,
  X,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/components/layout/MainLayout";

type Fornecedor = {
  id: number;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  contato: string | null;
};

type ResultadoPesquisa = {
  produtoId: number;
  fornecedorId: number;
  fornecedor: string;
  codigoOriginal: string;
  descricao: string;
  preco: number;
  ultimaAtualizacao: string | null;
};

type LinhaPlanilha = Record<string, unknown>;

type ProdutoImportacao = {
  codigoPrincipal: string;
  codigos: string[];
  descricao: string;
  preco: number;
};

type TipoImportacao = "completa" | "parcial";

export default function FornecedoresPage() {
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [mostrarCadastro, setMostrarCadastro] = useState(false);

  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [contato, setContato] = useState("");

  const [salvando, setSalvando] = useState(false);

  const [codigoBusca, setCodigoBusca] = useState("");
  const [pesquisando, setPesquisando] = useState(false);
  const [pesquisou, setPesquisou] = useState(false);
  const [resultados, setResultados] = useState<ResultadoPesquisa[]>([]);

  const [mostrarImportacao, setMostrarImportacao] = useState(false);
  const [fornecedorImportacao, setFornecedorImportacao] =
    useState<Fornecedor | null>(null);

  const [arquivoNome, setArquivoNome] = useState("");
  const [linhasPlanilha, setLinhasPlanilha] = useState<LinhaPlanilha[]>([]);
  const [colunasPlanilha, setColunasPlanilha] = useState<string[]>([]);

  const [colunaCodigo, setColunaCodigo] = useState("");
  const [colunaDescricao, setColunaDescricao] = useState("");
  const [colunaPreco, setColunaPreco] = useState("");

  const [tipoImportacao, setTipoImportacao] =
    useState<TipoImportacao>("completa");

  const [importando, setImportando] = useState(false);

  useEffect(() => {
    carregarFornecedores();
  }, []);

  async function pegarUsuario() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  }

  async function carregarFornecedores() {
    setCarregando(true);

    const user = await pegarUsuario();

    if (!user) {
      setFornecedores([]);
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("fornecedores")
      .select("id, nome, cnpj, telefone, email, contato")
      .eq("user_id", user.id)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar fornecedores:", error);
      setFornecedores([]);
    } else {
      setFornecedores(data || []);
    }

    setCarregando(false);
  }

  async function cadastrarFornecedor() {
    if (!nome.trim()) {
      alert("Informe o nome do fornecedor.");
      return;
    }

    setSalvando(true);

    const user = await pegarUsuario();

    if (!user) {
      alert("Usuário não encontrado.");
      setSalvando(false);
      return;
    }

    const { error } = await supabase.from("fornecedores").insert({
      user_id: user.id,
      nome: nome.trim(),
      cnpj: cnpj.trim() || null,
      telefone: telefone.trim() || null,
      email: email.trim() || null,
      contato: contato.trim() || null,
    });

    if (error) {
      console.error(error);
      alert("Erro ao cadastrar fornecedor: " + error.message);
      setSalvando(false);
      return;
    }

    setNome("");
    setCnpj("");
    setTelefone("");
    setEmail("");
    setContato("");
    setMostrarCadastro(false);

    await carregarFornecedores();

    setSalvando(false);
  }

  function normalizarCodigo(valor: unknown) {
    return String(valor ?? "").trim().toUpperCase();
  }

  function normalizarCabecalho(valor: string) {
    return valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function converterPreco(valor: unknown) {
    if (typeof valor === "number") {
      return valor;
    }

    let texto = String(valor ?? "")
      .trim()
      .replace(/[R$\s]/g, "")
      .replace(/[^\d,.-]/g, "");

    if (!texto) {
      return 0;
    }

    if (texto.includes(",")) {
      texto = texto.replace(/\./g, "").replace(",", ".");
    }

    const numero = Number(texto);

    return Number.isFinite(numero) ? numero : 0;
  }

  function separarCodigos(valor: unknown) {
    const texto = String(valor ?? "").trim();

    if (!texto) {
      return [];
    }

    const codigos = texto
      .split(/[\n;|,]+|\s+\/\s+/)
      .map((codigo) => normalizarCodigo(codigo))
      .filter(Boolean);

    return [...new Set(codigos)];
  }

  function formatarDinheiro(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  function formatarData(valor: string | null) {
    if (!valor) {
      return "—";
    }

    return new Date(valor).toLocaleDateString("pt-BR");
  }

  async function pesquisarCodigo() {
    const codigo = normalizarCodigo(codigoBusca);

    if (!codigo) {
      setResultados([]);
      setPesquisou(false);
      return;
    }

    setPesquisando(true);
    setPesquisou(true);
    setResultados([]);

    const user = await pegarUsuario();

    if (!user) {
      setPesquisando(false);
      return;
    }

    const { data: codigos, error: erroCodigos } = await supabase
      .from("fornecedor_produto_codigos")
      .select("fornecedor_produto_id, codigo_original")
      .eq("user_id", user.id)
      .ilike("codigo_original", codigo);

    if (erroCodigos) {
      console.error("Erro na pesquisa:", erroCodigos);
      alert("Erro ao pesquisar código.");
      setPesquisando(false);
      return;
    }

    if (!codigos || codigos.length === 0) {
      setResultados([]);
      setPesquisando(false);
      return;
    }

    const idsProdutos = [
      ...new Set(codigos.map((item) => item.fornecedor_produto_id)),
    ];

    const { data: produtos, error: erroProdutos } = await supabase
      .from("fornecedor_produtos")
      .select(
        "id, fornecedor_id, descricao, preco, ultima_atualizacao, ativo"
      )
      .eq("user_id", user.id)
      .eq("ativo", true)
      .in("id", idsProdutos);

    if (erroProdutos || !produtos) {
      console.error("Erro ao carregar produtos:", erroProdutos);
      setPesquisando(false);
      return;
    }

    if (produtos.length === 0) {
      setResultados([]);
      setPesquisando(false);
      return;
    }

    const idsFornecedores = [
      ...new Set(produtos.map((produto) => produto.fornecedor_id)),
    ];

    const { data: listaFornecedores, error: erroFornecedores } =
      await supabase
        .from("fornecedores")
        .select("id, nome")
        .eq("user_id", user.id)
        .in("id", idsFornecedores);

    if (erroFornecedores || !listaFornecedores) {
      console.error("Erro ao carregar fornecedores:", erroFornecedores);
      setPesquisando(false);
      return;
    }

    const lista: ResultadoPesquisa[] = produtos.map((produto) => {
      const fornecedor = listaFornecedores.find(
        (item) => item.id === produto.fornecedor_id
      );

      const codigoEncontrado = codigos.find(
        (item) => item.fornecedor_produto_id === produto.id
      );

      return {
        produtoId: produto.id,
        fornecedorId: produto.fornecedor_id,
        fornecedor: fornecedor?.nome || "Fornecedor",
        codigoOriginal: codigoEncontrado?.codigo_original || codigo,
        descricao: produto.descricao || "Produto sem descrição",
        preco: Number(produto.preco || 0),
        ultimaAtualizacao: produto.ultima_atualizacao || null,
      };
    });

    lista.sort((a, b) => a.preco - b.preco);

    setResultados(lista);
    setPesquisando(false);
  }

  function limparImportacao() {
    setArquivoNome("");
    setLinhasPlanilha([]);
    setColunasPlanilha([]);
    setColunaCodigo("");
    setColunaDescricao("");
    setColunaPreco("");
    setTipoImportacao("completa");

    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = "";
    }
  }

  function fecharImportacao() {
    if (importando) {
      return;
    }

    setMostrarImportacao(false);
    setFornecedorImportacao(null);
    limparImportacao();
  }

  function abrirImportacao(fornecedor: Fornecedor) {
    limparImportacao();
    setFornecedorImportacao(fornecedor);
    setMostrarImportacao(true);
  }

  function detectarColuna(
    colunas: string[],
    possibilidades: string[]
  ) {
    for (const coluna of colunas) {
      const normalizada = normalizarCabecalho(coluna);

      if (
        possibilidades.some((possibilidade) =>
          normalizada.includes(possibilidade)
        )
      ) {
        return coluna;
      }
    }

    return "";
  }

  async function lerPlanilha(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    try {
      const buffer = await arquivo.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
      });

      const primeiraAba = workbook.SheetNames[0];

      if (!primeiraAba) {
        alert("A planilha não possui nenhuma aba.");
        return;
      }

      const worksheet = workbook.Sheets[primeiraAba];

      const linhas = XLSX.utils.sheet_to_json<LinhaPlanilha>(
        worksheet,
        {
          defval: "",
          raw: true,
        }
      );

      if (!linhas.length) {
        alert("A planilha está vazia.");
        return;
      }

      const colunas = Object.keys(linhas[0]);

      setArquivoNome(arquivo.name);
      setLinhasPlanilha(linhas);
      setColunasPlanilha(colunas);

      const codigoDetectado = detectarColuna(colunas, [
        "codigooriginal",
        "codigo",
        "cod",
        "referencia",
        "ref",
        "oem",
      ]);

      const descricaoDetectada = detectarColuna(colunas, [
        "descricao",
        "produto",
        "nomeproduto",
        "nome",
        "item",
      ]);

      const precoDetectado = detectarColuna(colunas, [
        "precovenda",
        "precounitario",
        "preco",
        "valor",
        "custo",
      ]);

      setColunaCodigo(codigoDetectado);
      setColunaDescricao(descricaoDetectada);
      setColunaPreco(precoDetectado);
    } catch (error) {
      console.error(error);
      alert("Não foi possível ler esta planilha.");
    }
  }

  function prepararProdutosImportacao() {
    const mapa = new Map<string, ProdutoImportacao>();

    for (const linha of linhasPlanilha) {
      const codigos = separarCodigos(linha[colunaCodigo]);

      if (!codigos.length) {
        continue;
      }

      const preco = converterPreco(linha[colunaPreco]);

      if (preco <= 0) {
        continue;
      }

      const descricao = colunaDescricao
        ? String(linha[colunaDescricao] ?? "").trim()
        : "";

      const codigoPrincipal = codigos[0];

      if (!mapa.has(codigoPrincipal)) {
        mapa.set(codigoPrincipal, {
          codigoPrincipal,
          codigos,
          descricao,
          preco,
        });
      } else {
        const produtoExistente = mapa.get(codigoPrincipal)!;

        produtoExistente.codigos = [
          ...new Set([
            ...produtoExistente.codigos,
            ...codigos,
          ]),
        ];

        produtoExistente.descricao =
          descricao || produtoExistente.descricao;

        produtoExistente.preco = preco;
      }
    }

    return Array.from(mapa.values());
  }

  function dividirEmLotes<T>(itens: T[], tamanho = 300) {
    const lotes: T[][] = [];

    for (let i = 0; i < itens.length; i += tamanho) {
      lotes.push(itens.slice(i, i + tamanho));
    }

    return lotes;
  }

  async function importarPlanilha() {
    if (!fornecedorImportacao) {
      return;
    }

    if (!colunaCodigo) {
      alert("Selecione a coluna do código original.");
      return;
    }

    if (!colunaPreco) {
      alert("Selecione a coluna do preço.");
      return;
    }

    const produtosPreparados = prepararProdutosImportacao();

    if (!produtosPreparados.length) {
      alert(
        "Nenhum produto válido foi encontrado. Verifique as colunas de código e preço."
      );
      return;
    }

    setImportando(true);

    try {
      const user = await pegarUsuario();

      if (!user) {
        throw new Error("Usuário não encontrado.");
      }

      if (tipoImportacao === "completa") {
        const { error: erroInativar } = await supabase
          .from("fornecedor_produtos")
          .update({
            ativo: false,
          })
          .eq("user_id", user.id)
          .eq("fornecedor_id", fornecedorImportacao.id);

        if (erroInativar) {
          throw erroInativar;
        }
      }

      const { data: existentes, error: erroExistentes } =
        await supabase
          .from("fornecedor_produtos")
          .select("id, codigo_original")
          .eq("user_id", user.id)
          .eq("fornecedor_id", fornecedorImportacao.id);

      if (erroExistentes) {
        throw erroExistentes;
      }

      const mapaExistentes = new Map(
        (existentes || []).map((produto) => [
          normalizarCodigo(produto.codigo_original),
          produto.id,
        ])
      );

      let quantidadeNovos = 0;
      let quantidadeAtualizados = 0;

      for (const produto of produtosPreparados) {
        if (mapaExistentes.has(produto.codigoPrincipal)) {
          quantidadeAtualizados++;
        } else {
          quantidadeNovos++;
        }
      }

      const agora = new Date().toISOString();

      const linhasProdutos = produtosPreparados.map(
        (produto) => ({
          user_id: user.id,
          fornecedor_id: fornecedorImportacao.id,
          codigo_original: produto.codigoPrincipal,
          descricao: produto.descricao || null,
          preco: produto.preco,
          ativo: true,
          ultima_atualizacao: agora,
          updated_at: agora,
        })
      );

      const produtosSalvos: {
        id: number;
        codigo_original: string;
      }[] = [];

      for (const lote of dividirEmLotes(linhasProdutos)) {
        const { data, error } = await supabase
          .from("fornecedor_produtos")
          .upsert(lote, {
            onConflict:
              "user_id,fornecedor_id,codigo_original",
          })
          .select("id, codigo_original");

        if (error) {
          throw error;
        }

        if (data) {
          produtosSalvos.push(...data);
        }
      }

      const mapaProdutosSalvos = new Map(
        produtosSalvos.map((produto) => [
          normalizarCodigo(produto.codigo_original),
          produto.id,
        ])
      );

      const linhasCodigos: {
        user_id: string;
        fornecedor_produto_id: number;
        codigo_original: string;
      }[] = [];

      for (const produto of produtosPreparados) {
        const produtoId = mapaProdutosSalvos.get(
          produto.codigoPrincipal
        );

        if (!produtoId) {
          continue;
        }

        for (const codigo of produto.codigos) {
          linhasCodigos.push({
            user_id: user.id,
            fornecedor_produto_id: produtoId,
            codigo_original: codigo,
          });
        }
      }

      for (const lote of dividirEmLotes(linhasCodigos)) {
        const { error } = await supabase
          .from("fornecedor_produto_codigos")
          .upsert(lote, {
            onConflict:
              "user_id,fornecedor_produto_id,codigo_original",
            ignoreDuplicates: true,
          });

        if (error) {
          throw error;
        }
      }

      const { error: erroHistorico } = await supabase
        .from("fornecedor_importacoes")
        .insert({
          user_id: user.id,
          fornecedor_id: fornecedorImportacao.id,
          nome_arquivo: arquivoNome,
          quantidade_itens: produtosPreparados.length,
          quantidade_novos: quantidadeNovos,
          quantidade_atualizados: quantidadeAtualizados,
        });

      if (erroHistorico) {
        console.error(
          "Erro ao salvar histórico:",
          erroHistorico
        );
      }

      alert(
        `Importação concluída!\n\n` +
          `Produtos processados: ${produtosPreparados.length}\n` +
          `Novos: ${quantidadeNovos}\n` +
          `Atualizados: ${quantidadeAtualizados}\n\n` +
          `${
            tipoImportacao === "completa"
              ? "Produtos que não estavam na nova tabela foram inativados."
              : "Os demais produtos do fornecedor foram mantidos ativos."
          }`
      );

      fecharImportacao();
    } catch (error) {
      console.error("Erro na importação:", error);

      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro desconhecido.";

      alert("Erro ao importar planilha: " + mensagem);
    } finally {
      setImportando(false);
    }
  }

  const preview = linhasPlanilha.slice(0, 5);

  return (
    <MainLayout>
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Fornecedores
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Consulte preços, códigos originais e fornecedores.
          </p>
        </div>

        <button
          onClick={() => setMostrarCadastro(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#071E49] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={18} />
          Novo fornecedor
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#F47B20]">
            <PackageSearch size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Pesquisa de peças
            </h2>

            <p className="text-sm text-slate-500">
              Pesquise um código original e compare os preços.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={codigoBusca}
              onChange={(e) =>
                setCodigoBusca(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  pesquisarCodigo();
                }
              }}
              placeholder="Digite o código original..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#071E49]"
            />
          </div>

          <button
            onClick={pesquisarCodigo}
            disabled={pesquisando}
            className="h-12 rounded-xl bg-[#F47B20] px-6 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {pesquisando
              ? "Pesquisando..."
              : "Pesquisar"}
          </button>
        </div>
      </div>

      {pesquisou && !pesquisando && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Resultado da pesquisa
            </h2>

            <p className="text-sm text-slate-500">
              {resultados.length > 0
                ? `${resultados.length} fornecedor(es) encontrado(s)`
                : "Nenhum fornecedor encontrado para este código"}
            </p>
          </div>

          {resultados.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">
                      Fornecedor
                    </th>
                    <th className="px-5 py-3">
                      Código
                    </th>
                    <th className="px-5 py-3">
                      Produto
                    </th>
                    <th className="px-5 py-3 text-right">
                      Preço
                    </th>
                    <th className="px-5 py-3">
                      Atualização
                    </th>
                    <th className="px-5 py-3">
                      Situação
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {resultados.map(
                    (resultado, index) => (
                      <tr
                        key={`${resultado.produtoId}-${resultado.fornecedorId}`}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {resultado.fornecedor}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {resultado.codigoOriginal}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {resultado.descricao}
                        </td>

                        <td className="px-5 py-4 text-right font-bold text-slate-900">
                          {formatarDinheiro(
                            resultado.preco
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatarData(
                            resultado.ultimaAtualizacao
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {index === 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                              <Trophy size={14} />
                              Melhor preço
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Fornecedores cadastrados
          </h2>

          <p className="text-sm text-slate-500">
            {fornecedores.length} fornecedor(es)
          </p>
        </div>

        {carregando ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Carregando fornecedores...
          </div>
        ) : fornecedores.length === 0 ? (
          <div className="p-10 text-center">
            <Building2
              size={38}
              className="mx-auto mb-3 text-slate-300"
            />

            <p className="font-medium text-slate-700">
              Nenhum fornecedor cadastrado
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Cadastre seu primeiro fornecedor para começar.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {fornecedores.map((fornecedor) => (
              <div
                key={fornecedor.id}
                className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-[#071E49]">
                    <Building2 size={20} />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {fornecedor.nome}
                    </p>

                    <p className="text-sm text-slate-500">
                      {fornecedor.contato ||
                        fornecedor.telefone ||
                        fornecedor.email ||
                        "Sem contato informado"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    abrirImportacao(fornecedor)
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Upload size={17} />
                  Importar planilha
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {mostrarCadastro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Novo fornecedor
                </h2>

                <p className="text-sm text-slate-500">
                  Cadastre os dados do fornecedor.
                </p>
              </div>

              <button
                onClick={() =>
                  setMostrarCadastro(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nome *
                </label>

                <input
                  value={nome}
                  onChange={(e) =>
                    setNome(e.target.value)
                  }
                  placeholder="Nome do fornecedor"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#071E49]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  CNPJ
                </label>

                <input
                  value={cnpj}
                  onChange={(e) =>
                    setCnpj(e.target.value)
                  }
                  placeholder="00.000.000/0000-00"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#071E49]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Contato
                </label>

                <input
                  value={contato}
                  onChange={(e) =>
                    setContato(e.target.value)
                  }
                  placeholder="Nome do contato"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#071E49]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Telefone
                  </label>

                  <input
                    value={telefone}
                    onChange={(e) =>
                      setTelefone(e.target.value)
                    }
                    placeholder="(00) 00000-0000"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#071E49]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    E-mail
                  </label>

                  <input
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="email@fornecedor.com"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#071E49]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() =>
                  setMostrarCadastro(false)
                }
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancelar
              </button>

              <button
                onClick={cadastrarFornecedor}
                disabled={salvando}
                className="rounded-xl bg-[#071E49] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {salvando
                  ? "Salvando..."
                  : "Cadastrar fornecedor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarImportacao &&
        fornecedorImportacao && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Importar tabela de preços
                  </h2>

                  <p className="text-sm text-slate-500">
                    {fornecedorImportacao.nome}
                  </p>
                </div>

                <button
                  onClick={fecharImportacao}
                  disabled={importando}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="mb-3 font-semibold text-slate-900">
                    Tipo de importação
                  </p>

                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        setTipoImportacao("completa")
                      }
                      className={`rounded-xl border p-4 text-left ${
                        tipoImportacao === "completa"
                          ? "border-[#F47B20] bg-orange-50"
                          : "border-slate-200"
                      }`}
                    >
                      <p className="font-semibold text-slate-900">
                        Tabela completa
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Atualiza os produtos da planilha e
                        inativa os que não estiverem nela.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setTipoImportacao("parcial")
                      }
                      className={`rounded-xl border p-4 text-left ${
                        tipoImportacao === "parcial"
                          ? "border-[#F47B20] bg-orange-50"
                          : "border-slate-200"
                      }`}
                    >
                      <p className="font-semibold text-slate-900">
                        Atualização parcial
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Atualiza somente os produtos enviados e
                        mantém os demais ativos.
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    ref={inputArquivoRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={lerPlanilha}
                    className="hidden"
                  />

                  {!arquivoNome ? (
                    <button
                      onClick={() =>
                        inputArquivoRef.current?.click()
                      }
                      className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-10 transition hover:border-[#F47B20] hover:bg-orange-50/30"
                    >
                      <FileSpreadsheet
                        size={40}
                        className="mb-3 text-[#F47B20]"
                      />

                      <p className="font-semibold text-slate-900">
                        Selecionar planilha
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Excel XLSX, XLS ou CSV
                      </p>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-green-600" />

                        <div>
                          <p className="font-semibold text-green-900">
                            {arquivoNome}
                          </p>

                          <p className="text-sm text-green-700">
                            {linhasPlanilha.length} linhas
                            encontradas
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          inputArquivoRef.current?.click()
                        }
                        className="text-sm font-semibold text-green-700"
                      >
                        Trocar arquivo
                      </button>
                    </div>
                  )}
                </div>

                {linhasPlanilha.length > 0 && (
                  <>
                    <div>
                      <h3 className="mb-1 font-semibold text-slate-900">
                        Identifique as colunas
                      </h3>

                      <p className="mb-4 text-sm text-slate-500">
                        Informe qual coluna representa cada
                        informação.
                      </p>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Código original *
                          </label>

                          <select
                            value={colunaCodigo}
                            onChange={(e) =>
                              setColunaCodigo(
                                e.target.value
                              )
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#071E49]"
                          >
                            <option value="">
                              Selecione...
                            </option>

                            {colunasPlanilha.map(
                              (coluna) => (
                                <option
                                  key={coluna}
                                  value={coluna}
                                >
                                  {coluna}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Descrição
                          </label>

                          <select
                            value={colunaDescricao}
                            onChange={(e) =>
                              setColunaDescricao(
                                e.target.value
                              )
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#071E49]"
                          >
                            <option value="">
                              Não utilizar
                            </option>

                            {colunasPlanilha.map(
                              (coluna) => (
                                <option
                                  key={coluna}
                                  value={coluna}
                                >
                                  {coluna}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Preço *
                          </label>

                          <select
                            value={colunaPreco}
                            onChange={(e) =>
                              setColunaPreco(
                                e.target.value
                              )
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#071E49]"
                          >
                            <option value="">
                              Selecione...
                            </option>

                            {colunasPlanilha.map(
                              (coluna) => (
                                <option
                                  key={coluna}
                                  value={coluna}
                                >
                                  {coluna}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-3">
                        <h3 className="font-semibold text-slate-900">
                          Prévia da planilha
                        </h3>

                        <p className="text-sm text-slate-500">
                          Exibindo as primeiras 5 linhas.
                        </p>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[700px]">
                          <thead>
                            <tr className="bg-slate-50">
                              {colunasPlanilha.map(
                                (coluna) => (
                                  <th
                                    key={coluna}
                                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500"
                                  >
                                    {coluna}
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {preview.map(
                              (linha, index) => (
                                <tr key={index}>
                                  {colunasPlanilha.map(
                                    (coluna) => (
                                      <td
                                        key={coluna}
                                        className="max-w-[250px] truncate px-4 py-3 text-sm text-slate-600"
                                      >
                                        {String(
                                          linha[
                                            coluna
                                          ] ?? ""
                                        )}
                                      </td>
                                    )
                                  )}
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="sticky bottom-0 flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
                <p className="text-sm text-slate-500">
                  {linhasPlanilha.length > 0
                    ? `${linhasPlanilha.length} linhas na planilha`
                    : "Selecione uma planilha para continuar"}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={fecharImportacao}
                    disabled={importando}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={importarPlanilha}
                    disabled={
                      importando ||
                      !linhasPlanilha.length ||
                      !colunaCodigo ||
                      !colunaPreco
                    }
                    className="flex items-center gap-2 rounded-xl bg-[#F47B20] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <Upload size={17} />

                    {importando
                      ? "Importando..."
                      : "Importar produtos"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </MainLayout>
  );
}