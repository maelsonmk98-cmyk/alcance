"use client";

import {
  Suspense,
} from "react";

import {
  CheckCircle2,
  ExternalLink,
  Link2,
  Megaphone,
  PackageSearch,
  RefreshCw,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import { useSearchParams } from "next/navigation";

export default function AnunciosPage() {
  return (
    <MainLayout>
      <Suspense
        fallback={
          <div className="-m-6 min-h-[calc(100vh-64px)] bg-[#07182B] p-6 lg:-m-8 lg:p-8">
            <div className="mx-auto flex min-h-[400px] max-w-[1600px] items-center justify-center">
              <RefreshCw
                size={22}
                className="animate-spin text-blue-400"
              />
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
  const searchParams =
    useSearchParams();

  const conectado =
    searchParams.get(
      "mercadolivre"
    ) === "conectado";

  const erro =
    searchParams.get(
      "ml_error"
    );

  return (
    <div className="-m-6 min-h-[calc(100vh-64px)] bg-[#07182B] p-6 lg:-m-8 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Cabeçalho */}

        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold">
            <span className="text-slate-500">
              Alcance
            </span>

            <span className="text-slate-700">
              /
            </span>

            <span className="text-slate-300">
              Anúncios
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white">
            Anúncios
          </h1>

          <p className="mt-1.5 text-sm text-slate-400">
            Conecte seus marketplaces e acompanhe
            seus anúncios em um só lugar.
          </p>
        </div>

        {/* Sucesso */}

        {conectado && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <CheckCircle2
              size={18}
              className="text-emerald-400"
            />

            <div>
              <p className="text-[11px] font-bold text-emerald-300">
                Mercado Livre conectado com sucesso.
              </p>

              <p className="mt-0.5 text-[10px] text-emerald-300/60">
                A autorização OAuth foi concluída.
              </p>
            </div>
          </div>
        )}

        {/* Erro */}

        {erro && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-[11px] font-bold text-red-300">
              Não foi possível conectar ao Mercado
              Livre.
            </p>

            <p className="mt-1 text-[10px] text-red-300/60">
              {erro}
            </p>
          </div>
        )}

        {/* Mercado Livre */}

        <div className="overflow-hidden rounded-2xl border border-[#1B3352] bg-[#091B30] shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
          <div className="border-b border-[#17304D] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10">
                <Megaphone
                  size={20}
                  className="text-yellow-400"
                />
              </div>

              <div>
                <h2 className="text-[15px] font-bold text-white">
                  Mercado Livre
                </h2>

                <p className="mt-1 text-[10px] text-slate-500">
                  Integre sua conta para importar e
                  analisar seus anúncios.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-6 lg:grid-cols-[1fr_380px]">
            <div className="rounded-2xl border border-[#1B3352] bg-[#0D223B] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Link2
                  size={21}
                  className="text-blue-400"
                />
              </div>

              <h3 className="mt-5 text-lg font-bold text-white">
                Conectar conta do Mercado Livre
              </h3>

              <p className="mt-2 max-w-[600px] text-[11px] leading-5 text-slate-500">
                Autorize o Alcance a consultar os
                dados da sua conta do Mercado Livre.
                Você será redirecionado para o Mercado
                Livre para fazer a autorização.
              </p>

              <a
                href="/api/mercadolivre/connect"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F47B20] px-5 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(244,123,32,0.18)] transition hover:bg-[#FF861F]"
              >
                <ExternalLink size={15} />

                Conectar Mercado Livre
              </a>
            </div>

            <div className="rounded-2xl border border-[#1B3352] bg-[#0D223B] p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Próximas funções
              </p>

              <div className="mt-5 space-y-4">
                <Funcao
                  icon={
                    <PackageSearch
                      size={15}
                    />
                  }
                  titulo="Importar anúncios"
                  descricao="Trazer os anúncios reais da conta conectada."
                />

                <Funcao
                  icon={
                    <RefreshCw
                      size={15}
                    />
                  }
                  titulo="Sincronizar dados"
                  descricao="Atualizar preço, estoque e status."
                />

                <Funcao
                  icon={
                    <Megaphone
                      size={15}
                    />
                  }
                  titulo="Analisar performance"
                  descricao="Cruzar vendas, Ads, ACOS, margem e ROI."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Funcao({
  icon,
  titulo,
  descricao,
}: {
  icon: React.ReactNode;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
        {icon}
      </div>

      <div>
        <p className="text-[11px] font-semibold text-slate-300">
          {titulo}
        </p>

        <p className="mt-1 text-[9px] leading-4 text-slate-600">
          {descricao}
        </p>
      </div>
    </div>
  );
}