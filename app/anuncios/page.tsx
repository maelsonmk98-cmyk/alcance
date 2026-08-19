"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Activity,
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  DollarSign,
  ExternalLink,
  Eye,
  LineChart,
  Megaphone,
  MousePointerClick,
  Package,
  PauseCircle,
  Percent,
  RefreshCw,
  Search,
  ShoppingBag,
  Tag,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import { useSearchParams } from "next/navigation";

type Anuncio = {
  id: string;
  titulo: string;
  sku: string | null;
  preco: number;
  estoque: number;
  vendidos: number;
  status: string;
  tipo_anuncio: string;
  imagem: string | null;
  permalink: string | null;
};

type Resumo = {
  total: number;
  ativos: number;
  pausados: number;
  fechados: number;
  estoque_total: number;
};

type ApiResponse = {
  conectado?: boolean;
  ml_user_id?: number;
  resumo?: Resumo;
  anuncios?: Anuncio[];
  error?: string;
  details?: unknown;
};

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
  comprador: {
    id: number | null;
    nickname: string | null;
  };
  produtos: ProdutoVenda[];
};

type ResumoVendas = {
  pedidos: number;
  unidades: number;
  faturamento: number;
  ticket_medio: number;
  taxas_marketplace: number;
  cancelados: number;
};

type VendasApiResponse = {
  conectado?: boolean;
  periodo?: {
    dias: number;
    inicio: string;
    fim: string;
  };
  resumo?: ResumoVendas;
  vendas?: VendaMercadoLivre[];
  error?: string;
};

type DadoGraficoVendas = {
  data: string;
  label: string;
  faturamento: number;
  pedidos: number;
  unidades: number;
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

type CampanhaAds = {
  id: number | null;
  nome: string;
  status: string;
  strategy: string | null;
  budget: number;
  acos_target: number;
  roas_target: number;
  investimento: number;
  cliques: number;
  impressoes: number;
  receita_ads: number;
  vendas_ads: number;
  acos: number;
  roas: number;
  cpc: number;
};

type MetricasAdsResponse = {
  mercado_ads?: boolean;
  advertiser_id?: number;
  site_id?: string;
  periodo?: {
    dias: number;
    date_from: string;
    date_to: string;
  };
  resumo?: ResumoAds;
  total_campanhas?: number;
  campanhas?: CampanhaAds[];
  error?: string;
};

type ProdutoAds = {
  id: number | string | null;
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
  vendas_diretas: number;
  vendas_indiretas: number;
  receita_direta: number;
  receita_indireta: number;
  acos: number;
  roas: number;
};

type ProdutosAdsResponse = {
  mercado_ads?: boolean;
  advertiser_id?: number;
  site_id?: string;
  resumo?: ResumoAds;
  total_produtos?: number;
  produtos?: ProdutoAds[];
  error?: string;
};

type VisitaPerformance = {
  item_id: string;
  total: number;
};

type ResumoVisitasPerformance = {
  total_anuncios: number;
  total_visitas: number;
  media_visitas_anuncio: number;
  anuncios_com_visitas: number;
  anuncios_sem_visitas: number;
};

type VisitasPerformanceResponse = {
  conectado?: boolean;
  periodo?: {
    dias: number;
    tipo?: string;
  };
  resumo?: ResumoVisitasPerformance;
  visitas?: VisitaPerformance[];
  rankings?: {
    mais_visitados?: VisitaPerformance[];
  };
  error?: string;
};

const RESUMO_VISITAS_INICIAL: ResumoVisitasPerformance = {
  total_anuncios: 0,
  total_visitas: 0,
  media_visitas_anuncio: 0,
  anuncios_com_visitas: 0,
  anuncios_sem_visitas: 0,
};

type FiltroStatus = "todos" | "active" | "paused" | "closed";
type Aba = "visao-geral" | "anuncios" | "vendas" | "ads" | "performance";

const RESUMO_VENDAS_INICIAL: ResumoVendas = {
  pedidos: 0,
  unidades: 0,
  faturamento: 0,
  ticket_medio: 0,
  taxas_marketplace: 0,
  cancelados: 0,
};

const RESUMO_ADS_INICIAL: ResumoAds = {
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

export default function AnunciosPage() {
  return (
    <MainLayout>
      <Suspense
        fallback={
          <div className="-m-6 min-h-[calc(100vh-64px)] bg-[#061426] p-6 lg:-m-8 lg:p-8">
            <div className="mx-auto flex min-h-[500px] max-w-[1700px] items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-blue-400" />
            </div>
          </div>
        }
      >
        <AnunciosContent />
      </Suspense>
    </MainLayout>
  );
}

function AnunciosContent() {
  const searchParams = useSearchParams();
  const conectadoOAuth = searchParams.get("mercadolivre") === "conectado";
  const erroOAuth = searchParams.get("ml_error");

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [erro, setErro] = useState("");
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [resumo, setResumo] = useState<Resumo>({
    total: 0,
    ativos: 0,
    pausados: 0,
    fechados: 0,
    estoque_total: 0,
  });

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [abaAtiva, setAbaAtiva] = useState<Aba>("visao-geral");
  const [periodo, setPeriodo] = useState("30");

  const [carregandoVendas, setCarregandoVendas] = useState(false);
  const [erroVendas, setErroVendas] = useState("");
  const [vendas, setVendas] = useState<VendaMercadoLivre[]>([]);
  const [resumoVendas, setResumoVendas] = useState<ResumoVendas>(
    RESUMO_VENDAS_INICIAL
  );

  const [carregandoAds, setCarregandoAds] = useState(false);
  const [erroAds, setErroAds] = useState("");
  const [resumoAds, setResumoAds] = useState<ResumoAds>(RESUMO_ADS_INICIAL);
  const [campanhasAds, setCampanhasAds] = useState<CampanhaAds[]>([]);
  const [produtosAds, setProdutosAds] = useState<ProdutoAds[]>([]);

  const [carregandoPerformance, setCarregandoPerformance] = useState(false);
  const [erroPerformance, setErroPerformance] = useState("");
  const [resumoVisitas, setResumoVisitas] = useState<ResumoVisitasPerformance>(
    RESUMO_VISITAS_INICIAL
  );
  const [visitasPerformance, setVisitasPerformance] = useState<VisitaPerformance[]>([]);

  async function carregarAnuncios(mostrarAtualizacao = false) {
    if (mostrarAtualizacao) setAtualizando(true);
    else setCarregando(true);

    setErro("");

    try {
      const response = await fetch("/api/mercadolivre/anuncios", {
        method: "GET",
        cache: "no-store",
      });
      const data: ApiResponse = await response.json();

      if (response.status === 404) {
        setConectado(false);
        setAnuncios([]);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível carregar os anúncios.");
      }

      setConectado(data.conectado === true);
      setAnuncios(Array.isArray(data.anuncios) ? data.anuncios : []);
      if (data.resumo) setResumo(data.resumo);
    } catch (error) {
      console.error("Erro ao carregar anúncios:", error);
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os anúncios."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  async function carregarVendas() {
    setCarregandoVendas(true);
    setErroVendas("");

    try {
      const response = await fetch(`/api/mercadolivre/vendas?dias=${periodo}`, {
        method: "GET",
        cache: "no-store",
      });
      const data: VendasApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível carregar as vendas.");
      }

      setVendas(Array.isArray(data.vendas) ? data.vendas : []);
      setResumoVendas(data.resumo ?? RESUMO_VENDAS_INICIAL);
    } catch (error) {
      console.error("Erro ao carregar vendas Mercado Livre:", error);
      setErroVendas(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as vendas."
      );
    } finally {
      setCarregandoVendas(false);
    }
  }

  async function carregarAds() {
    setCarregandoAds(true);
    setErroAds("");

    try {
      const [metricasResponse, produtosResponse] = await Promise.all([
        fetch(`/api/mercadolivre/ads/metricas?dias=${periodo}`, {
          method: "GET",
          cache: "no-store",
        }),
        fetch(`/api/mercadolivre/ads/produtos?dias=${periodo}`, {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const metricasData: MetricasAdsResponse = await metricasResponse.json();
      const produtosData: ProdutosAdsResponse = await produtosResponse.json();

      if (!metricasResponse.ok) {
        throw new Error(
          metricasData.error || "Não foi possível carregar as métricas do Mercado Ads."
        );
      }

      if (!produtosResponse.ok) {
        throw new Error(
          produtosData.error || "Não foi possível carregar os produtos do Mercado Ads."
        );
      }

      setResumoAds(metricasData.resumo ?? RESUMO_ADS_INICIAL);
      setCampanhasAds(
        Array.isArray(metricasData.campanhas) ? metricasData.campanhas : []
      );
      setProdutosAds(
        Array.isArray(produtosData.produtos) ? produtosData.produtos : []
      );
    } catch (error) {
      console.error("Erro ao carregar Mercado Ads:", error);
      setErroAds(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o Mercado Ads."
      );
    } finally {
      setCarregandoAds(false);
    }
  }

  async function carregarPerformance() {
    setCarregandoPerformance(true);
    setErroPerformance("");

    try {
      const response = await fetch(
        `/api/mercadolivre/performance/visitas?dias=${periodo}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data: VisitasPerformanceResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível carregar a performance dos anúncios."
        );
      }

      setResumoVisitas(data.resumo ?? RESUMO_VISITAS_INICIAL);
      setVisitasPerformance(
        Array.isArray(data.visitas) ? data.visitas : []
      );
    } catch (error) {
      console.error("Erro ao carregar Performance Mercado Livre:", error);
      setErroPerformance(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a performance dos anúncios."
      );
    } finally {
      setCarregandoPerformance(false);
    }
  }

  useEffect(() => {
    carregarAnuncios();
  }, []);

  useEffect(() => {
    if (conectado && abaAtiva === "vendas") carregarVendas();
  }, [conectado, abaAtiva, periodo]);

  useEffect(() => {
    if (conectado && abaAtiva === "ads") carregarAds();
  }, [conectado, abaAtiva, periodo]);

  useEffect(() => {
    if (conectado && abaAtiva === "performance") carregarPerformance();
  }, [conectado, abaAtiva, periodo]);

  const anunciosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return anuncios.filter((anuncio) => {
      const correspondeStatus =
        filtroStatus === "todos" || anuncio.status === filtroStatus;
      if (!correspondeStatus) return false;
      if (!termo) return true;

      return [anuncio.titulo, anuncio.id, anuncio.sku ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(termo);
    });
  }, [anuncios, busca, filtroStatus]);

  const valorEstoque = useMemo(
    () =>
      anuncios.reduce(
        (total, anuncio) => total + anuncio.preco * anuncio.estoque,
        0
      ),
    [anuncios]
  );

  const valorAnunciosAtivos = useMemo(
    () =>
      anuncios
        .filter((anuncio) => anuncio.status === "active")
        .reduce(
          (total, anuncio) => total + anuncio.preco * anuncio.estoque,
          0
        ),
    [anuncios]
  );

  const totalVendidos = useMemo(
    () => anuncios.reduce((total, anuncio) => total + anuncio.vendidos, 0),
    [anuncios]
  );

  const dadosGraficoVendas = useMemo<DadoGraficoVendas[]>(() => {
    const diasSelecionados = Math.max(1, Number(periodo) || 30);
    const mapa = new Map<string, DadoGraficoVendas>();
    const hoje = new Date();

    for (let i = diasSelecionados - 1; i >= 0; i--) {
      const data = new Date(hoje);
      data.setHours(12, 0, 0, 0);
      data.setDate(data.getDate() - i);

      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      const dia = String(data.getDate()).padStart(2, "0");
      const chave = `${ano}-${mes}-${dia}`;

      mapa.set(chave, {
        data: chave,
        label: `${dia}/${mes}`,
        faturamento: 0,
        pedidos: 0,
        unidades: 0,
      });
    }

    vendas
      .filter((venda) => venda.status !== "cancelled" && venda.data)
      .forEach((venda) => {
        const dataVenda = new Date(venda.data as string);
        const ano = dataVenda.getFullYear();
        const mes = String(dataVenda.getMonth() + 1).padStart(2, "0");
        const dia = String(dataVenda.getDate()).padStart(2, "0");
        const chave = `${ano}-${mes}-${dia}`;
        const existente = mapa.get(chave);

        if (!existente) return;
        existente.faturamento += Number(venda.faturamento ?? 0);
        existente.pedidos += 1;
        existente.unidades += Number(venda.quantidade ?? 0);
      });

    return Array.from(mapa.values());
  }, [vendas, periodo]);

  const outrosStatus = Math.max(
    0,
    resumo.total - resumo.ativos - resumo.pausados - resumo.fechados
  );

  if (carregando) {
    return (
      <div className="-m-6 min-h-[calc(100vh-64px)] bg-[#061426] p-6 lg:-m-8 lg:p-8">
        <div className="mx-auto flex min-h-[520px] max-w-[1700px] flex-col items-center justify-center">
          <RefreshCw size={28} className="animate-spin text-blue-400" />
          <p className="mt-4 text-[11px] text-slate-500">
            Sincronizando dados do Mercado Livre...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-64px)] bg-[#061426] p-5 lg:-m-8 lg:p-7">
      <div className="mx-auto max-w-[1700px] space-y-5">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <span className="text-slate-600">Alcance</span>
              <ChevronRight size={11} className="text-slate-700" />
              <span className="text-slate-300">Mercado Livre</span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F47B20]/10">
                <Megaphone size={21} className="text-[#F47B20]" />
              </div>
              <div>
                <h1 className="text-[28px] font-bold tracking-[-0.04em] text-white">
                  Mercado Livre
                </h1>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Gestão integrada de anúncios, vendas, Ads e performance.
                </p>
              </div>
            </div>
          </div>

          {conectado && (
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex h-10 items-center gap-2 rounded-xl border border-[#1B3555] bg-[#091B30] px-3">
                <CalendarDays size={14} className="text-slate-500" />
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="bg-transparent text-[10px] font-semibold text-slate-300 outline-none"
                >
                  {[7, 30, 60, 90].map((dias) => (
                    <option key={dias} className="bg-[#091B30]" value={dias}>
                      Últimos {dias} dias
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  carregarAnuncios(true);
                  if (abaAtiva === "vendas") carregarVendas();
                  if (abaAtiva === "ads") carregarAds();
                  if (abaAtiva === "performance") carregarPerformance();
                }}
                disabled={atualizando}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#1D3A5C] bg-[#0A1D34] px-4 text-[10px] font-bold text-slate-300 transition hover:border-blue-500/40 hover:text-white disabled:opacity-60"
              >
                <RefreshCw
                  size={14}
                  className={atualizando ? "animate-spin" : ""}
                />
                {atualizando ? "Sincronizando..." : "Sincronizar"}
              </button>

              <a
                href="/api/mercadolivre/connect"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#F47B20] px-4 text-[10px] font-bold text-white transition hover:bg-[#ff8627]"
              >
                <RefreshCw size={13} />
                Reconectar
              </a>
            </div>
          )}
        </div>

        {conectadoOAuth && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3">
            <CheckCircle2 size={17} className="text-emerald-400" />
            <div>
              <p className="text-[10px] font-bold text-emerald-300">
                Mercado Livre conectado com sucesso
              </p>
              <p className="mt-0.5 text-[9px] text-emerald-400/60">
                A conta foi autorizada e vinculada ao Alcance.
              </p>
            </div>
          </div>
        )}

        {erroOAuth && (
          <AvisoErro
            titulo="Não foi possível conectar ao Mercado Livre."
            descricao={erroOAuth}
          />
        )}

        {erro && (
          <AvisoErro
            titulo="Erro ao carregar dados do Mercado Livre"
            descricao={erro}
          />
        )}

        {!conectado && !erro && (
          <div className="rounded-2xl border border-[#1B3352] bg-[#091B30] p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47B20]/10">
              <Megaphone size={24} className="text-[#F47B20]" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-white">
              Conectar Mercado Livre
            </h2>
            <p className="mt-2 max-w-[650px] text-[11px] leading-5 text-slate-500">
              Autorize o Alcance a consultar seus anúncios, vendas, Mercado Ads e performance.
            </p>
            <a
              href="/api/mercadolivre/connect"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#F47B20] px-5 text-[11px] font-bold text-white"
            >
              <ExternalLink size={14} />
              Conectar Mercado Livre
            </a>
          </div>
        )}

        {conectado && (
          <>
            <div className="overflow-x-auto border-b border-[#142B45]">
              <div className="flex min-w-max items-center gap-7">
                <TabButton
                  ativa={abaAtiva === "visao-geral"}
                  onClick={() => setAbaAtiva("visao-geral")}
                  icon={<Activity size={14} />}
                >
                  Visão Geral
                </TabButton>
                <TabButton
                  ativa={abaAtiva === "anuncios"}
                  onClick={() => setAbaAtiva("anuncios")}
                  icon={<Megaphone size={14} />}
                >
                  Anúncios
                </TabButton>
                <TabButton
                  ativa={abaAtiva === "vendas"}
                  onClick={() => setAbaAtiva("vendas")}
                  icon={<ShoppingBag size={14} />}
                >
                  Vendas
                </TabButton>
                <TabButton
                  ativa={abaAtiva === "ads"}
                  onClick={() => setAbaAtiva("ads")}
                  icon={<BarChart3 size={14} />}
                >
                  Mercado Ads
                </TabButton>
                <TabButton
                  ativa={abaAtiva === "performance"}
                  onClick={() => setAbaAtiva("performance")}
                  icon={<TrendingUp size={14} />}
                >
                  Performance
                </TabButton>
              </div>
            </div>

            {abaAtiva === "visao-geral" && (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <KpiCard
                    titulo="Total de anúncios"
                    valor={formatarNumero(resumo.total)}
                    detalhe="Publicações encontradas"
                    icon={<Megaphone size={17} />}
                  />
                  <KpiCard
                    titulo="Anúncios ativos"
                    valor={formatarNumero(resumo.ativos)}
                    detalhe={`${calcularPercentual(resumo.ativos, resumo.total)}% do total`}
                    icon={<CheckCircle2 size={17} />}
                  />
                  <KpiCard
                    titulo="Pausados"
                    valor={formatarNumero(resumo.pausados)}
                    detalhe={`${calcularPercentual(resumo.pausados, resumo.total)}% do total`}
                    icon={<PauseCircle size={17} />}
                  />
                  <KpiCard
                    titulo="Estoque disponível"
                    valor={formatarNumero(resumo.estoque_total)}
                    detalhe="Unidades anunciadas"
                    icon={<Package size={17} />}
                  />
                  <KpiCard
                    titulo="Unidades vendidas"
                    valor={formatarNumero(totalVendidos)}
                    detalhe="Histórico dos anúncios"
                    icon={<ShoppingBag size={17} />}
                  />
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  <MetricCard
                    titulo="Valor do estoque anunciado"
                    valor={formatarMoeda(valorEstoque)}
                    descricao="Preço atual × estoque disponível"
                    icon={<Wallet size={18} />}
                  />
                  <MetricCard
                    titulo="Valor em anúncios ativos"
                    valor={formatarMoeda(valorAnunciosAtivos)}
                    descricao="Valor dos produtos atualmente ativos"
                    icon={<DollarSign size={18} />}
                  />
                  <MetricCard
                    titulo="Outros status"
                    valor={formatarNumero(outrosStatus)}
                    descricao="Anúncios fora de ativo, pausado ou fechado"
                    icon={<Activity size={18} />}
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
                  <Painel
                    titulo="Performance comercial"
                    subtitulo="Vendas e Ads já possuem módulos próprios."
                    icon={<LineChart size={16} />}
                  >
                    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-[#1D3858] bg-[#07182B]/50 text-center">
                      <LineChart size={32} className="text-slate-700" />
                      <p className="mt-4 text-[11px] font-bold text-slate-400">
                        Performance consolidada
                      </p>
                      <p className="mt-1 max-w-[420px] text-[9px] leading-4 text-slate-600">
                        O cruzamento entre vendas, Ads e custos será feito na aba Performance.
                      </p>
                    </div>
                  </Painel>

                  <Painel
                    titulo="Distribuição dos anúncios"
                    subtitulo="Situação atual das publicações."
                    icon={<BarChart3 size={16} />}
                  >
                    <div className="space-y-5 pt-2">
                      <StatusBar nome="Ativos" valor={resumo.ativos} total={resumo.total} />
                      <StatusBar nome="Pausados" valor={resumo.pausados} total={resumo.total} />
                      <StatusBar nome="Fechados" valor={resumo.fechados} total={resumo.total} />
                      <StatusBar nome="Outros" valor={outrosStatus} total={resumo.total} />
                    </div>
                  </Painel>
                </div>

                <TabelaAnuncios
                  titulo="Anúncios recentes"
                  anuncios={anunciosFiltrados}
                  anunciosTotal={anuncios.length}
                  busca={busca}
                  setBusca={setBusca}
                  filtroStatus={filtroStatus}
                  setFiltroStatus={setFiltroStatus}
                  limite={10}
                  onVerTodos={() => setAbaAtiva("anuncios")}
                />
              </div>
            )}

            {abaAtiva === "anuncios" && (
              <TabelaAnuncios
                titulo="Todos os anúncios"
                anuncios={anunciosFiltrados}
                anunciosTotal={anuncios.length}
                busca={busca}
                setBusca={setBusca}
                filtroStatus={filtroStatus}
                setFiltroStatus={setFiltroStatus}
              />
            )}

            {abaAtiva === "vendas" && (
              <VendasMercadoLivre
                carregando={carregandoVendas}
                erro={erroVendas}
                resumo={resumoVendas}
                vendas={vendas}
                atualizar={carregarVendas}
                dadosGrafico={dadosGraficoVendas}
              />
            )}

            {abaAtiva === "ads" && (
              <MercadoAds
                carregando={carregandoAds}
                erro={erroAds}
                resumo={resumoAds}
                campanhas={campanhasAds}
                produtos={produtosAds}
                atualizar={carregarAds}
                anuncios={anuncios}
              />
            )}

            {abaAtiva === "performance" && (
              <PerformanceAnuncios
                carregando={carregandoPerformance}
                erro={erroPerformance}
                resumo={resumoVisitas}
                visitas={visitasPerformance}
                anuncios={anuncios}
                atualizar={carregarPerformance}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabelaAnuncios({
  titulo,
  anuncios,
  anunciosTotal,
  busca,
  setBusca,
  filtroStatus,
  setFiltroStatus,
  limite,
  onVerTodos,
}: {
  titulo: string;
  anuncios: Anuncio[];
  anunciosTotal: number;
  busca: string;
  setBusca: (valor: string) => void;
  filtroStatus: FiltroStatus;
  setFiltroStatus: (valor: FiltroStatus) => void;
  limite?: number;
  onVerTodos?: () => void;
}) {
  const exibidos = typeof limite === "number" ? anuncios.slice(0, limite) : anuncios;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#17304D] bg-[#081A2E] shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
      <div className="flex flex-col gap-4 border-b border-[#142B45] p-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone size={16} className="text-[#F47B20]" />
            <h2 className="text-[13px] font-bold text-white">{titulo}</h2>
          </div>
          <p className="mt-1 text-[9px] text-slate-600">
            {anuncios.length} de {anunciosTotal} anúncios
          </p>
        </div>

        <div className="flex flex-col gap-2.5 md:flex-row">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
            />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar produto, SKU ou MLB..."
              className="h-10 w-full rounded-xl border border-[#1A3555] bg-[#061426] pl-9 pr-4 text-[10px] text-white outline-none placeholder:text-slate-700 focus:border-blue-500/50 md:w-[285px]"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(event) => setFiltroStatus(event.target.value as FiltroStatus)}
            className="h-10 rounded-xl border border-[#1A3555] bg-[#061426] px-3 text-[10px] font-semibold text-slate-300 outline-none"
          >
            <option value="todos">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="paused">Pausados</option>
            <option value="closed">Fechados</option>
          </select>

          {onVerTodos && (
            <button
              type="button"
              onClick={onVerTodos}
              className="h-10 rounded-xl border border-[#1A3555] bg-[#0B2038] px-4 text-[10px] font-bold text-slate-300 transition hover:text-white"
            >
              Ver todos
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px]">
          <thead>
            <tr className="border-b border-[#142B45] bg-[#07182B]">
              <Th>Produto</Th>
              <Th>SKU</Th>
              <Th>Preço</Th>
              <Th>Estoque</Th>
              <Th>Vendidos</Th>
              <Th>Tipo</Th>
              <Th>Status</Th>
              <Th align="right">Ação</Th>
            </tr>
          </thead>
          <tbody>
            {exibidos.map((anuncio) => (
              <AnuncioRow key={anuncio.id} anuncio={anuncio} />
            ))}
          </tbody>
        </table>

        {exibidos.length === 0 && (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <Search size={27} className="text-slate-700" />
            <p className="mt-4 text-[11px] font-bold text-slate-400">
              Nenhum anúncio encontrado
            </p>
            <p className="mt-1 text-[9px] text-slate-600">
              Altere a busca ou o filtro.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AnuncioRow({ anuncio }: { anuncio: Anuncio }) {
  return (
    <tr className="border-b border-[#122941] transition last:border-0 hover:bg-[#0B2038]">
      <td className="px-5 py-3.5">
        <div className="flex min-w-[310px] items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1A3555] bg-white">
            {anuncio.imagem ? (
              <img src={anuncio.imagem} alt="" className="h-full w-full object-contain" />
            ) : (
              <Package size={17} className="text-slate-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="max-w-[430px] truncate text-[10px] font-semibold text-slate-200">
              {anuncio.titulo}
            </p>
            <p className="mt-1 text-[8px] font-medium text-slate-600">{anuncio.id}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-[10px] font-semibold text-slate-400">
        {anuncio.sku || "—"}
      </td>
      <td className="px-5 py-3.5 text-[10px] font-bold text-white">
        {formatarMoeda(anuncio.preco)}
      </td>
      <td className="px-5 py-3.5 text-[10px] font-semibold text-slate-300">
        {formatarNumero(anuncio.estoque)}
      </td>
      <td className="px-5 py-3.5 text-[10px] font-semibold text-slate-300">
        {formatarNumero(anuncio.vendidos)}
      </td>
      <td className="px-5 py-3.5"><TipoBadge tipo={anuncio.tipo_anuncio} /></td>
      <td className="px-5 py-3.5"><StatusBadge status={anuncio.status} /></td>
      <td className="px-5 py-3.5 text-right">
        {anuncio.permalink ? (
          <a
            href={anuncio.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#1C3959] bg-[#091D34] px-3 text-[9px] font-bold text-slate-300 transition hover:border-blue-500/40 hover:text-white"
          >
            Abrir <ExternalLink size={11} />
          </a>
        ) : (
          <span className="text-slate-700">—</span>
        )}
      </td>
    </tr>
  );
}

function VendasMercadoLivre({
  carregando,
  erro,
  resumo,
  vendas,
  atualizar,
  dadosGrafico,
}: {
  carregando: boolean;
  erro: string;
  resumo: ResumoVendas;
  vendas: VendaMercadoLivre[];
  atualizar: () => void;
  dadosGrafico: DadoGraficoVendas[];
}) {
  if (carregando) return <LoaderCard texto="Carregando vendas do Mercado Livre..." />;

  return (
    <div className="space-y-5">
      <SectionHeader
        titulo="Vendas do Mercado Livre"
        descricao="Pedidos reais da conta conectada no período selecionado."
        botao="Atualizar vendas"
        onClick={atualizar}
      />

      {erro && <AvisoErro titulo="Erro ao carregar vendas" descricao={erro} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard titulo="Faturamento" valor={formatarMoeda(resumo.faturamento)} detalhe="Pedidos não cancelados" icon={<DollarSign size={17} />} />
        <KpiCard titulo="Pedidos" valor={formatarNumero(resumo.pedidos)} detalhe="Pedidos válidos" icon={<ShoppingBag size={17} />} />
        <KpiCard titulo="Unidades vendidas" valor={formatarNumero(resumo.unidades)} detalhe="Itens vendidos no período" icon={<Package size={17} />} />
        <KpiCard titulo="Ticket médio" valor={formatarMoeda(resumo.ticket_medio)} detalhe="Faturamento por pedido" icon={<Wallet size={17} />} />
        <KpiCard titulo="Cancelados" valor={formatarNumero(resumo.cancelados)} detalhe="Pedidos cancelados" icon={<AlertCircle size={17} />} />
      </div>

      <div className="rounded-2xl border border-[#17304D] bg-[#081A2E] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <LineChart size={16} />
            </div>
            <div>
              <h3 className="text-[12px] font-bold text-white">Faturamento por período</h3>
              <p className="mt-0.5 text-[8px] text-slate-600">Evolução diária das vendas não canceladas.</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[8px] font-semibold uppercase tracking-[0.06em] text-slate-600">Total no período</p>
            <p className="mt-1 text-[16px] font-bold text-white">{formatarMoeda(resumo.faturamento)}</p>
          </div>
        </div>

        <div className="mt-5 h-[285px] w-full">
          {dadosGrafico.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={dadosGrafico} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#16304D" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={22} tick={{ fill: "#64748B", fontSize: 9 }} />
                <YAxis axisLine={false} tickLine={false} width={58} tick={{ fill: "#64748B", fontSize: 9 }} tickFormatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`} />
                <Tooltip cursor={{ stroke: "#274968", strokeDasharray: "4 4" }} content={<TooltipVendas />} />
                <Line type="monotone" dataKey="faturamento" stroke="#3B82F6" strokeWidth={3} dot={{ r: 2.5, fill: "#3B82F6", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#60A5FA", stroke: "#061426", strokeWidth: 2 }} />
              </RechartsLineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState titulo="Sem vendas no período" descricao="Altere o período selecionado." />
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#17304D] bg-[#081A2E]">
        <div className="border-b border-[#142B45] p-5">
          <h3 className="text-[13px] font-bold text-white">Pedidos recentes</h3>
          <p className="mt-1 text-[9px] text-slate-600">{vendas.length} pedidos encontrados</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead><tr className="border-b border-[#142B45] bg-[#07182B]"><Th>Data</Th><Th>Pedido</Th><Th>Produto</Th><Th>SKU</Th><Th>Qtd.</Th><Th>Valor</Th><Th>Status</Th></tr></thead>
            <tbody>
              {vendas.map((venda) => {
                const produto = venda.produtos?.[0];
                return (
                  <tr key={String(venda.id)} className="border-b border-[#122941] transition last:border-0 hover:bg-[#0B2038]">
                    <td className="px-5 py-4 text-[9px] text-slate-400">{formatarData(venda.data)}</td>
                    <td className="px-5 py-4 text-[9px] font-semibold text-slate-300">{venda.id ?? "—"}</td>
                    <td className="px-5 py-4"><div className="max-w-[360px]"><p className="truncate text-[10px] font-semibold text-slate-200">{produto?.titulo || "Produto"}</p><p className="mt-1 text-[8px] text-slate-600">{produto?.mlb || "—"}</p></div></td>
                    <td className="px-5 py-4 text-[9px] font-semibold text-slate-400">{produto?.sku || "—"}</td>
                    <td className="px-5 py-4 text-[9px] font-semibold text-white">{venda.quantidade}</td>
                    <td className="px-5 py-4 text-[10px] font-bold text-white">{formatarMoeda(venda.faturamento)}</td>
                    <td className="px-5 py-4"><StatusVenda status={venda.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {vendas.length === 0 && <EmptyState titulo="Nenhuma venda encontrada" descricao="Não há pedidos no período selecionado." />}
        </div>
      </div>
    </div>
  );
}

function MercadoAds({
  carregando,
  erro,
  resumo,
  campanhas,
  produtos,
  atualizar,
  anuncios,
}: {
  carregando: boolean;
  erro: string;
  resumo: ResumoAds;
  campanhas: CampanhaAds[];
  produtos: ProdutoAds[];
  atualizar: () => void;
  anuncios: Anuncio[];
}) {
  const campanhaPorId = useMemo(() => {
    const mapa = new Map<number, CampanhaAds>();
    campanhas.forEach((campanha) => {
      if (campanha.id !== null) mapa.set(campanha.id, campanha);
    });
    return mapa;
  }, [campanhas]);

  const anuncioPorMlb = useMemo(() => {
    const mapa = new Map<string, Anuncio>();
    anuncios.forEach((anuncio) => mapa.set(anuncio.id, anuncio));
    return mapa;
  }, [anuncios]);

  if (carregando) return <LoaderCard texto="Carregando Mercado Ads..." />;

  return (
    <div className="space-y-5">
      <SectionHeader
        titulo="Mercado Ads"
        descricao="Métricas reais das campanhas de Product Ads no período selecionado."
        botao="Atualizar Ads"
        onClick={atualizar}
      />

      {erro && <AvisoErro titulo="Erro ao carregar Mercado Ads" descricao={erro} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard titulo="Investimento" valor={formatarMoeda(resumo.investimento)} detalhe="Gasto em publicidade" icon={<CircleDollarSign size={17} />} />
        <KpiCard titulo="Impressões" valor={formatarNumero(resumo.impressoes)} detalhe="Exibições dos anúncios" icon={<Eye size={17} />} />
        <KpiCard titulo="Cliques" valor={formatarNumero(resumo.cliques)} detalhe="Cliques recebidos" icon={<MousePointerClick size={17} />} />
        <KpiCard titulo="CTR" valor={formatarPercentual(resumo.ctr)} detalhe="Cliques ÷ impressões" icon={<Percent size={17} />} />
        <KpiCard titulo="CPC médio" valor={formatarMoeda(resumo.cpc)} detalhe="Custo médio por clique" icon={<Target size={17} />} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard titulo="Receita atribuída Ads" valor={formatarMoeda(resumo.receita_ads)} descricao="Receita atribuída pelo Mercado Ads" icon={<DollarSign size={18} />} />
        <MetricCard titulo="Vendas via Ads" valor={formatarNumero(resumo.vendas_ads)} descricao="Itens atribuídos à publicidade" icon={<ShoppingBag size={18} />} />
        <MetricCard titulo="ACOS" valor={formatarPercentual(resumo.acos)} descricao="Investimento ÷ receita Ads" icon={<Percent size={18} />} />
        <MetricCard titulo="ROAS" valor={formatarMultiplicador(resumo.roas)} descricao="Receita Ads ÷ investimento" icon={<TrendingUp size={18} />} />
      </div>

      {resumo.investimento > 0 && resumo.receita_ads === 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3">
          <p className="text-[10px] font-bold text-amber-300">Há investimento, mas a API retornou receita atribuída igual a zero.</p>
          <p className="mt-1 text-[9px] leading-4 text-amber-300/60">Por isso ACOS e ROAS aparecem zerados. O Alcance não está estimando esses valores; mostra apenas a atribuição devolvida pelo Mercado Ads.</p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <div className="overflow-hidden rounded-2xl border border-[#17304D] bg-[#081A2E]">
          <div className="border-b border-[#142B45] p-5">
            <div className="flex items-center gap-2"><BarChart3 size={16} className="text-[#F47B20]" /><h3 className="text-[13px] font-bold text-white">Campanhas</h3></div>
            <p className="mt-1 text-[9px] text-slate-600">{campanhas.length} campanhas encontradas</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead><tr className="border-b border-[#142B45] bg-[#07182B]"><Th>Campanha</Th><Th>Status</Th><Th>Orçamento</Th><Th>Investimento</Th><Th>Impressões</Th><Th>Cliques</Th><Th>CPC</Th><Th>ACOS</Th><Th>ROAS</Th></tr></thead>
              <tbody>
                {campanhas.map((campanha) => (
                  <tr key={String(campanha.id)} className="border-b border-[#122941] last:border-0 hover:bg-[#0B2038]">
                    <td className="px-5 py-4"><p className="max-w-[260px] truncate text-[10px] font-semibold text-slate-200">{campanha.nome || "Sem nome"}</p><p className="mt-1 text-[8px] text-slate-600">ID {campanha.id ?? "—"}</p></td>
                    <td className="px-5 py-4"><StatusAds status={campanha.status} /></td>
                    <td className="px-5 py-4 text-[9px] font-semibold text-slate-300">{formatarMoeda(campanha.budget)}</td>
                    <td className="px-5 py-4 text-[10px] font-bold text-white">{formatarMoeda(campanha.investimento)}</td>
                    <td className="px-5 py-4 text-[9px] text-slate-300">{formatarNumero(campanha.impressoes)}</td>
                    <td className="px-5 py-4 text-[9px] text-slate-300">{formatarNumero(campanha.cliques)}</td>
                    <td className="px-5 py-4 text-[9px] text-slate-300">{formatarMoeda(campanha.cpc)}</td>
                    <td className="px-5 py-4 text-[9px] text-slate-300">{formatarPercentual(campanha.acos)}</td>
                    <td className="px-5 py-4 text-[9px] text-slate-300">{formatarMultiplicador(campanha.roas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {campanhas.length === 0 && <EmptyState titulo="Nenhuma campanha encontrada" descricao="Não há campanhas de Product Ads no período." />}
          </div>
        </div>

        <div className="rounded-2xl border border-[#17304D] bg-[#081A2E] p-5">
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><Target size={16} /></div><div><h3 className="text-[12px] font-bold text-white">Metas das campanhas</h3><p className="mt-0.5 text-[8px] text-slate-600">ACOS e ROAS configurados no Mercado Ads.</p></div></div>
          <div className="mt-5 space-y-3">
            {campanhas.map((campanha) => (
              <div key={`meta-${campanha.id}`} className="rounded-xl border border-[#16304D] bg-[#07182B] p-4">
                <p className="truncate text-[9px] font-bold text-slate-300">{campanha.nome}</p>
                <div className="mt-3 grid grid-cols-2 gap-3"><MiniMetric label="ACOS alvo" value={formatarPercentual(campanha.acos_target)} /><MiniMetric label="ROAS alvo" value={formatarMultiplicador(campanha.roas_target)} /></div>
              </div>
            ))}
            {campanhas.length === 0 && <p className="text-[9px] text-slate-600">Sem metas disponíveis.</p>}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#17304D] bg-[#081A2E]">
        <div className="border-b border-[#142B45] p-5">
          <div className="flex items-center gap-2"><Package size={16} className="text-[#F47B20]" /><h3 className="text-[13px] font-bold text-white">Produtos vinculados ao Mercado Ads</h3></div>
          <p className="mt-1 text-[9px] text-slate-600">{produtos.length} produtos retornados pela API</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px]">
            <thead><tr className="border-b border-[#142B45] bg-[#07182B]"><Th>Produto</Th><Th>SKU</Th><Th>Campanha</Th><Th>Status</Th><Th>Investimento</Th><Th>Impressões</Th><Th>Cliques</Th><Th>CPC</Th><Th>Receita Ads</Th><Th>ACOS</Th><Th>ROAS</Th></tr></thead>
            <tbody>
              {produtos.map((produto, index) => {
                const anuncio = produto.item_id ? anuncioPorMlb.get(produto.item_id) : undefined;
                const campanha = produto.campaign_id ? campanhaPorId.get(produto.campaign_id) : undefined;
                return (
                  <tr key={`${produto.item_id ?? produto.id ?? "produto"}-${index}`} className="border-b border-[#122941] last:border-0 hover:bg-[#0B2038]">
                    <td className="px-5 py-4"><div className="max-w-[360px]"><p className="truncate text-[10px] font-semibold text-slate-200">{produto.titulo || anuncio?.titulo || "Produto"}</p><p className="mt-1 text-[8px] text-slate-600">{produto.item_id || "—"}</p></div></td>
                    <td className="px-5 py-4 text-[9px] font-semibold text-slate-400">{anuncio?.sku || "—"}</td>
                    <td className="px-5 py-4"><p className="max-w-[240px] truncate text-[9px] text-slate-300">{produto.campaign_name || campanha?.nome || produto.campaign_id || "—"}</p></td>
                    <td className="px-5 py-4"><StatusAds status={produto.status || ""} /></td>
                    <td className="px-5 py-4 text-[10px] font-bold text-white">{formatarMoeda(produto.investimento)}</td>
                    <td className="px-5 py-4 text-[9px] text-slate-300">{formatarNumero(produto.impressoes)}</td>
                    <td className="px-5 py-4 text-[9px] text-slate-300">{formatarNumero(produto.cliques)}</td>
                    <td className="px-5 py-4 text-[9px] text-slate-300">{formatarMoeda(produto.cpc)}</td>
                    <td className="px-5 py-4 text-[9px] text-slate-300">{formatarMoeda(produto.receita_ads)}</td>
                    <td className="px-5 py-4 text-[9px] text-slate-300">{formatarPercentual(produto.acos)}</td>
                    <td className="px-5 py-4 text-[9px] text-slate-300">{formatarMultiplicador(produto.roas)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {produtos.length === 0 && <EmptyState titulo="Nenhum produto encontrado" descricao="A API não retornou produtos de Product Ads." />}
        </div>
      </div>
    </div>
  );
}

function PerformanceAnuncios({
  carregando,
  erro,
  resumo,
  visitas,
  anuncios,
  atualizar,
}: {
  carregando: boolean;
  erro: string;
  resumo: ResumoVisitasPerformance;
  visitas: VisitaPerformance[];
  anuncios: Anuncio[];
  atualizar: () => void;
}) {
  const linhas = useMemo(() => {
    const visitasPorMlb = new Map<string, number>();

    visitas.forEach((item) => {
      visitasPorMlb.set(item.item_id, Number(item.total ?? 0));
    });

    return anuncios
      .map((anuncio) => {
        const visualizacoes = visitasPorMlb.get(anuncio.id) ?? 0;
        const vendas = Number(anuncio.vendidos ?? 0);
        const conversao =
          visualizacoes > 0 ? (vendas / visualizacoes) * 100 : 0;

        return {
          ...anuncio,
          visualizacoes,
          vendas,
          conversao,
        };
      })
      .sort((a, b) => b.visualizacoes - a.visualizacoes);
  }, [anuncios, visitas]);

  const totalVendidos = useMemo(
    () => linhas.reduce((total, item) => total + item.vendas, 0),
    [linhas]
  );

  const conversaoGeral =
    resumo.total_visitas > 0
      ? (totalVendidos / resumo.total_visitas) * 100
      : 0;

  const maisVisitados = linhas.filter((item) => item.visualizacoes > 0).slice(0, 10);

  const melhoresConversoes = [...linhas]
    .filter((item) => item.visualizacoes >= 10 && item.vendas > 0)
    .sort((a, b) => b.conversao - a.conversao)
    .slice(0, 10);

  const muitaVisitaPoucaVenda = [...linhas]
    .filter((item) => item.visualizacoes >= 20 && item.conversao < 1)
    .sort((a, b) => b.visualizacoes - a.visualizacoes)
    .slice(0, 10);

  if (carregando) {
    return <LoaderCard texto="Carregando performance dos anúncios..." />;
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        titulo="Performance dos anúncios"
        descricao="Visualizações históricas, vendas acumuladas e conversão por anúncio do Mercado Livre."
        botao="Atualizar performance"
        onClick={atualizar}
      />

      {erro && (
        <AvisoErro
          titulo="Erro ao carregar performance"
          descricao={erro}
        />
      )}

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3">
        <p className="text-[10px] font-bold text-blue-300">
          As visualizações exibidas abaixo são históricas/acumuladas.
        </p>
        <p className="mt-1 text-[9px] leading-4 text-blue-300/60">
          O endpoint por período do Mercado Livre retornou zero mesmo para anúncios com histórico. Por isso o Alcance usa a fonte histórica validada da API para não exibir dados incorretos.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          titulo="Visualizações"
          valor={formatarNumero(resumo.total_visitas)}
          detalhe="Visitas históricas dos anúncios"
          icon={<Eye size={17} />}
        />
        <KpiCard
          titulo="Anúncios com visitas"
          valor={formatarNumero(resumo.anuncios_com_visitas)}
          detalhe={`${formatarNumero(resumo.anuncios_sem_visitas)} sem visitas`}
          icon={<Megaphone size={17} />}
        />
        <KpiCard
          titulo="Média por anúncio"
          valor={formatarNumero(resumo.media_visitas_anuncio)}
          detalhe="Visualizações médias por anúncio"
          icon={<BarChart3 size={17} />}
        />
        <KpiCard
          titulo="Unidades vendidas"
          valor={formatarNumero(totalVendidos)}
          detalhe="Quantidade acumulada nos anúncios"
          icon={<ShoppingBag size={17} />}
        />
        <KpiCard
          titulo="Conversão geral"
          valor={formatarPercentual(conversaoGeral)}
          detalhe="Unidades vendidas ÷ visualizações"
          icon={<TrendingUp size={17} />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Painel
          titulo="Mais visualizados"
          subtitulo="Anúncios com maior volume de visitas."
          icon={<Eye size={16} />}
        >
          <div className="space-y-2">
            {maisVisitados.map((item, index) => (
              <div
                key={`visitas-${item.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#16304D] bg-[#07182B] px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[9px] font-semibold text-slate-300">
                    {index + 1}. {item.titulo}
                  </p>
                  <p className="mt-1 text-[8px] text-slate-600">
                    {item.sku || "Sem SKU"} • {item.id}
                  </p>
                </div>
                <p className="shrink-0 text-[11px] font-bold text-white">
                  {formatarNumero(item.visualizacoes)}
                </p>
              </div>
            ))}
            {maisVisitados.length === 0 && (
              <p className="text-[9px] text-slate-600">Sem visitas disponíveis.</p>
            )}
          </div>
        </Painel>

        <Painel
          titulo="Melhor conversão"
          subtitulo="Mínimo de 10 visualizações para evitar distorções."
          icon={<TrendingUp size={16} />}
        >
          <div className="space-y-2">
            {melhoresConversoes.map((item, index) => (
              <div
                key={`conversao-${item.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#16304D] bg-[#07182B] px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[9px] font-semibold text-slate-300">
                    {index + 1}. {item.titulo}
                  </p>
                  <p className="mt-1 text-[8px] text-slate-600">
                    {formatarNumero(item.vendas)} vendas • {formatarNumero(item.visualizacoes)} visitas
                  </p>
                </div>
                <p className="shrink-0 text-[11px] font-bold text-emerald-400">
                  {formatarPercentual(item.conversao)}
                </p>
              </div>
            ))}
            {melhoresConversoes.length === 0 && (
              <p className="text-[9px] text-slate-600">Sem dados suficientes.</p>
            )}
          </div>
        </Painel>

        <Painel
          titulo="Atenção"
          subtitulo="Muitas visitas e conversão abaixo de 1%."
          icon={<AlertCircle size={16} />}
        >
          <div className="space-y-2">
            {muitaVisitaPoucaVenda.map((item) => (
              <div
                key={`atencao-${item.id}`}
                className="rounded-xl border border-amber-500/10 bg-amber-500/[0.04] px-3 py-3"
              >
                <p className="truncate text-[9px] font-semibold text-slate-300">
                  {item.titulo}
                </p>
                <p className="mt-1 text-[8px] text-amber-300/70">
                  {formatarNumero(item.visualizacoes)} visitas • {formatarNumero(item.vendas)} vendas • {formatarPercentual(item.conversao)} conversão
                </p>
              </div>
            ))}
            {muitaVisitaPoucaVenda.length === 0 && (
              <p className="text-[9px] text-slate-600">Nenhum anúncio crítico encontrado.</p>
            )}
          </div>
        </Painel>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#17304D] bg-[#081A2E]">
        <div className="border-b border-[#142B45] p-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-[#F47B20]" />
            <h3 className="text-[13px] font-bold text-white">
              Performance por anúncio
            </h3>
          </div>
          <p className="mt-1 text-[9px] text-slate-600">
            {linhas.length} anúncios analisados
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px]">
            <thead>
              <tr className="border-b border-[#142B45] bg-[#07182B]">
                <Th>Produto</Th>
                <Th>SKU</Th>
                <Th>Visualizações</Th>
                <Th>Vendidos</Th>
                <Th>Conversão</Th>
                <Th>Preço</Th>
                <Th>Estoque</Th>
                <Th>Tipo</Th>
                <Th>Status</Th>
                <Th align="right">Ação</Th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((item) => (
                <tr
                  key={`performance-${item.id}`}
                  className="border-b border-[#122941] transition last:border-0 hover:bg-[#0B2038]"
                >
                  <td className="px-5 py-4">
                    <div className="max-w-[360px]">
                      <p className="truncate text-[10px] font-semibold text-slate-200">
                        {item.titulo}
                      </p>
                      <p className="mt-1 text-[8px] text-slate-600">{item.id}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[9px] font-semibold text-slate-400">
                    {item.sku || "—"}
                  </td>
                  <td className="px-5 py-4 text-[10px] font-bold text-white">
                    {formatarNumero(item.visualizacoes)}
                  </td>
                  <td className="px-5 py-4 text-[9px] font-semibold text-slate-300">
                    {formatarNumero(item.vendas)}
                  </td>
                  <td className="px-5 py-4 text-[9px] font-bold text-emerald-400">
                    {formatarPercentual(item.conversao)}
                  </td>
                  <td className="px-5 py-4 text-[9px] font-semibold text-slate-300">
                    {formatarMoeda(item.preco)}
                  </td>
                  <td className="px-5 py-4 text-[9px] font-semibold text-slate-300">
                    {formatarNumero(item.estoque)}
                  </td>
                  <td className="px-5 py-4">
                    <TipoBadge tipo={item.tipo_anuncio} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    {item.permalink ? (
                      <a
                        href={item.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#1C3959] bg-[#091D34] px-3 text-[9px] font-bold text-slate-300 transition hover:border-blue-500/40 hover:text-white"
                      >
                        Abrir <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {linhas.length === 0 && (
            <EmptyState
              titulo="Nenhum anúncio encontrado"
              descricao="Não há dados de performance disponíveis."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TooltipVendas({ active, payload, label }: { active?: boolean; payload?: Array<{ payload?: DadoGraficoVendas }>; label?: string | number }) {
  if (!active || !payload || payload.length === 0) return null;
  const dados = payload[0]?.payload;
  if (!dados) return null;

  return (
    <div className="min-w-[150px] rounded-xl border border-[#1A3555] bg-[#061426] px-4 py-3 shadow-2xl">
      <p className="text-[9px] font-bold text-slate-300">{String(label ?? dados.label)}</p>
      <p className="mt-2 text-[12px] font-bold text-white">{formatarMoeda(dados.faturamento)}</p>
      <div className="mt-2 space-y-1">
        <p className="text-[8px] text-slate-500">Pedidos: <span className="font-semibold text-slate-300">{dados.pedidos}</span></p>
        <p className="text-[8px] text-slate-500">Unidades: <span className="font-semibold text-slate-300">{dados.unidades}</span></p>
      </div>
    </div>
  );
}

function KpiCard({ titulo, valor, detalhe, icon }: { titulo: string; valor: string; detalhe: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#17304D] bg-[#081A2E] p-4">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-slate-600">{titulo}</p><p className="mt-2 text-[23px] font-bold tracking-[-0.04em] text-white">{valor}</p><p className="mt-1 text-[8px] text-slate-600">{detalhe}</p></div><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">{icon}</div></div>
    </div>
  );
}

function MetricCard({ titulo, valor, descricao, icon }: { titulo: string; valor: string; descricao: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#17304D] bg-[#081A2E] p-5">
      <div className="flex items-start justify-between"><div><p className="text-[9px] font-semibold text-slate-500">{titulo}</p><p className="mt-2 text-xl font-bold text-white">{valor}</p><p className="mt-1 text-[8px] text-slate-600">{descricao}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47B20]/10 text-[#F47B20]">{icon}</div></div>
    </div>
  );
}

function Painel({ titulo, subtitulo, icon, children }: { titulo: string; subtitulo: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#17304D] bg-[#081A2E] p-5">
      <div className="mb-5 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">{icon}</div><div><h3 className="text-[12px] font-bold text-white">{titulo}</h3><p className="mt-0.5 text-[8px] text-slate-600">{subtitulo}</p></div></div>{children}
    </div>
  );
}

function StatusBar({ nome, valor, total }: { nome: string; valor: number; total: number }) {
  const percentual = calcularPercentual(valor, total);
  return (
    <div><div className="mb-2 flex items-center justify-between"><span className="text-[9px] font-semibold text-slate-400">{nome}</span><span className="text-[9px] font-bold text-white">{formatarNumero(valor)} <span className="text-slate-600">{percentual}%</span></span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#102B46]"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, percentual)}%` }} /></div></div>
  );
}

function TabButton({ ativa, onClick, icon, children }: { ativa: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={`flex h-11 items-center gap-2 border-b-2 px-1 text-[10px] font-bold transition ${ativa ? "border-[#F47B20] text-white" : "border-transparent text-slate-600 hover:text-slate-300"}`}><span className={ativa ? "text-[#F47B20]" : ""}>{icon}</span>{children}</button>;
}

function SectionHeader({ titulo, descricao, botao, onClick }: { titulo: string; descricao: string; botao: string; onClick: () => void }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-[16px] font-bold text-white">{titulo}</h2><p className="mt-1 text-[9px] text-slate-600">{descricao}</p></div><button type="button" onClick={onClick} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#1B3555] bg-[#091B30] px-4 text-[9px] font-bold text-slate-300 transition hover:text-white"><RefreshCw size={13} />{botao}</button></div>
  );
}

function LoaderCard({ texto }: { texto: string }) {
  return <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-[#17304D] bg-[#081A2E]"><div className="text-center"><RefreshCw size={24} className="mx-auto animate-spin text-blue-400" /><p className="mt-3 text-[10px] text-slate-500">{texto}</p></div></div>;
}

function EmptyState({ titulo, descricao }: { titulo: string; descricao: string }) {
  return <div className="flex min-h-[200px] flex-col items-center justify-center text-center"><BarChart3 size={28} className="text-slate-700" /><p className="mt-3 text-[10px] font-bold text-slate-400">{titulo}</p><p className="mt-1 text-[8px] text-slate-600">{descricao}</p></div>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[8px] text-slate-600">{label}</p><p className="mt-1 text-[11px] font-bold text-white">{value}</p></div>;
}

function ModuloEmConstrucao({ titulo, descricao, icon, cards }: { titulo: string; descricao: string; icon: ReactNode; cards: string[] }) {
  return (
    <div className="space-y-4"><div className="rounded-2xl border border-[#17304D] bg-[#081A2E] p-6"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F47B20]/10 text-[#F47B20]">{icon}</div><div><h2 className="text-[16px] font-bold text-white">{titulo}</h2><p className="mt-1 max-w-[750px] text-[10px] leading-5 text-slate-500">{descricao}</p></div></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map((card) => <div key={card} className="rounded-2xl border border-[#17304D] bg-[#081A2E] p-5"><p className="text-[9px] font-semibold text-slate-600">{card}</p><p className="mt-3 text-2xl font-bold text-white">—</p><p className="mt-1 text-[8px] text-slate-700">Aguardando integração</p></div>)}</div><EmptyState titulo="Dados ainda não integrados" descricao="Este módulo será conectado na próxima etapa." /></div>
  );
}

function AvisoErro({ titulo, descricao }: { titulo: string; descricao: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3"><AlertCircle size={17} className="shrink-0 text-red-400" /><div><p className="text-[10px] font-bold text-red-300">{titulo}</p><p className="mt-0.5 text-[9px] text-red-400/60">{descricao}</p></div></div>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge color="emerald">Ativo</Badge>;
  if (status === "paused") return <Badge color="amber">Pausado</Badge>;
  if (status === "closed") return <Badge color="red">Finalizado</Badge>;
  return <Badge color="slate">{status || "—"}</Badge>;
}

function StatusVenda({ status }: { status: string }) {
  if (status === "paid") return <Badge color="emerald">Pago</Badge>;
  if (status === "cancelled") return <Badge color="red">Cancelado</Badge>;
  return <Badge color="slate">{status || "—"}</Badge>;
}

function StatusAds({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  if (normalized === "active") return <Badge color="emerald">Ativa</Badge>;
  if (["paused", "hold"].includes(normalized)) return <Badge color="amber">{normalized === "hold" ? "Em espera" : "Pausada"}</Badge>;
  if (["deleted", "closed", "inactive"].includes(normalized)) return <Badge color="red">Inativa</Badge>;
  return <Badge color="slate">{status || "—"}</Badge>;
}

function Badge({ color, children }: { color: "emerald" | "amber" | "red" | "slate"; children: ReactNode }) {
  const classes = {
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    red: "border-red-500/20 bg-red-500/10 text-red-400",
    slate: "border-slate-500/20 bg-slate-500/10 text-slate-400",
  }[color];
  return <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[8px] font-bold ${classes}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{children}</span>;
}

function TipoBadge({ tipo }: { tipo: string }) {
  let nome = tipo;
  if (tipo === "gold_special") nome = "Clássico";
  if (tipo === "gold_pro") nome = "Premium";
  if (tipo === "free") nome = "Grátis";
  return <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-2.5 py-1 text-[8px] font-bold text-blue-400"><Tag size={9} />{nome || "—"}</span>;
}

function Th({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  return <th className={`px-5 py-3 text-[8px] font-bold uppercase tracking-[0.08em] text-slate-600 ${align === "right" ? "text-right" : "text-left"}`}>{children}</th>;
}

function formatarData(data: string | null) {
  if (!data) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(data));
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor) || 0);
}

function formatarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(Number(valor) || 0);
}

function formatarPercentual(valor: number) {
  return `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(valor) || 0)}%`;
}

function formatarMultiplicador(valor: number) {
  return `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(valor) || 0)}x`;
}

function calcularPercentual(valor: number, total: number) {
  if (!total) return 0;
  return Number(((valor / total) * 100).toFixed(1));
}