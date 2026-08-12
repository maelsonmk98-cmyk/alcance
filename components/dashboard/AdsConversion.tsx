"use client";

import {
  Eye,
  MousePointerClick,
  ShoppingCart,
  Target,
} from "lucide-react";

export default function AdsConversion() {
  const impressoes = 0;
  const cliques = 0;
  const carrinhos = 0;
  const compras = 0;

  const ctr =
    impressoes > 0
      ? (cliques / impressoes) * 100
      : 0;

  const taxaCarrinho =
    cliques > 0
      ? (carrinhos / cliques) * 100
      : 0;

  const taxaConversao =
    carrinhos > 0
      ? (compras / carrinhos) * 100
      : 0;

  return (
    <div
      className="
        relative
        h-[250px]
        overflow-hidden
        rounded-[14px]
        border
        border-[#233754]
        bg-[#0d1b2f]
        px-3.5
        py-3
        shadow-[0_8px_24px_rgba(0,0,0,0.15)]
      "
    >
      {/* Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-violet-500/[0.025] to-transparent" />

      <div className="relative flex h-full flex-col">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-bold text-white">
              Conversão de Anúncios
            </h2>

            <p className="mt-0.5 text-[8px] text-slate-600">
              Funil de desempenho dos anúncios
            </p>
          </div>

          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-500/10 bg-violet-500/10">
            <Target
              size={13}
              className="text-violet-400"
            />
          </div>
        </div>

        {/* Funil + dados */}
        <div className="mt-3 grid min-h-0 flex-1 grid-cols-[1fr_1fr] items-center gap-4">

          {/* Funil */}
          <div className="flex h-[135px] flex-col items-center justify-center gap-[3px]">

            {/* Impressões */}
            <div
              className="
                flex
                h-[28px]
                w-full
                max-w-[155px]
                items-center
                justify-center
                bg-gradient-to-r
                from-blue-600
                to-blue-400
              "
              style={{
                clipPath:
                  "polygon(0 0, 100% 0, 90% 100%, 10% 100%)",
              }}
            />

            {/* Cliques */}
            <div
              className="
                flex
                h-[28px]
                w-[78%]
                max-w-[120px]
                items-center
                justify-center
                bg-gradient-to-r
                from-emerald-600
                to-emerald-400
              "
              style={{
                clipPath:
                  "polygon(5% 0, 95% 0, 85% 100%, 15% 100%)",
              }}
            />

            {/* Carrinhos */}
            <div
              className="
                flex
                h-[28px]
                w-[56%]
                max-w-[88px]
                items-center
                justify-center
                bg-gradient-to-r
                from-orange-600
                to-orange-400
              "
              style={{
                clipPath:
                  "polygon(10% 0, 90% 0, 78% 100%, 22% 100%)",
              }}
            />

            {/* Compras */}
            <div
              className="
                flex
                h-[28px]
                w-[32%]
                max-w-[52px]
                items-center
                justify-center
                bg-gradient-to-r
                from-violet-600
                to-violet-400
              "
              style={{
                clipPath:
                  "polygon(15% 0, 85% 0, 68% 100%, 32% 100%)",
              }}
            />
          </div>

          {/* Indicadores */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3 border-b border-[#1b2b42] pb-1.5">
              <div className="flex items-center gap-2">
                <Eye
                  size={11}
                  className="text-blue-400"
                />

                <span className="text-[8px] text-slate-500">
                  Impressões
                </span>
              </div>

              <div className="text-right">
                <p className="text-[9px] font-bold text-white">
                  {impressoes.toLocaleString("pt-BR")}
                </p>

                <p className="text-[7px] text-blue-400">
                  100%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-[#1b2b42] pb-1.5">
              <div className="flex items-center gap-2">
                <MousePointerClick
                  size={11}
                  className="text-emerald-400"
                />

                <span className="text-[8px] text-slate-500">
                  Cliques
                </span>
              </div>

              <div className="text-right">
                <p className="text-[9px] font-bold text-white">
                  {cliques.toLocaleString("pt-BR")}
                </p>

                <p className="text-[7px] text-emerald-400">
                  {ctr.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-[#1b2b42] pb-1.5">
              <div className="flex items-center gap-2">
                <ShoppingCart
                  size={11}
                  className="text-orange-400"
                />

                <span className="text-[8px] text-slate-500">
                  Carrinhos
                </span>
              </div>

              <div className="text-right">
                <p className="text-[9px] font-bold text-white">
                  {carrinhos.toLocaleString("pt-BR")}
                </p>

                <p className="text-[7px] text-orange-400">
                  {taxaCarrinho.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Target
                  size={11}
                  className="text-violet-400"
                />

                <span className="text-[8px] text-slate-500">
                  Compras
                </span>
              </div>

              <div className="text-right">
                <p className="text-[9px] font-bold text-white">
                  {compras.toLocaleString("pt-BR")}
                </p>

                <p className="text-[7px] text-violet-400">
                  {taxaConversao.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <button
          type="button"
          className="
            mt-2
            flex
            h-7
            w-full
            items-center
            justify-center
            rounded-md
            border
            border-[#28405e]
            bg-[#102039]
            text-[8px]
            font-medium
            text-slate-400
            transition
            hover:border-violet-500/30
            hover:bg-[#132844]
            hover:text-slate-200
          "
        >
          Ver relatório completo
        </button>

        <p className="mt-1 text-center text-[7px] text-slate-700">
          Dados disponíveis após integração com Ads
        </p>
      </div>
    </div>
  );
}