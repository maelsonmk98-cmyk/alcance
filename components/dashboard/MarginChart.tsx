import { TrendingUp } from "lucide-react";

const faixas = [
  {
    label: "Acima de 30%",
    quantidade: 142,
    percentual: "57%",
    barra: "bg-emerald-500",
    ponto: "bg-emerald-500",
  },
  {
    label: "Entre 20% e 30%",
    quantidade: 68,
    percentual: "27%",
    barra: "bg-blue-500",
    ponto: "bg-blue-500",
  },
  {
    label: "Entre 10% e 20%",
    quantidade: 26,
    percentual: "10%",
    barra: "bg-[#F47B20]",
    ponto: "bg-[#F47B20]",
  },
  {
    label: "Abaixo de 10%",
    quantidade: 12,
    percentual: "6%",
    barra: "bg-red-500",
    ponto: "bg-red-500",
  },
];

export default function MarginChart() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-slate-900">
            Margem por Faixa
          </h2>

          <p className="mt-1 text-[12px] text-slate-500">
            Distribuição das margens dos produtos.
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
          <TrendingUp
            size={17}
            strokeWidth={2}
            className="text-emerald-600"
          />
        </div>
      </div>

      <div className="flex justify-center py-7">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[13px] border-slate-100" />

          <div className="absolute inset-0 rounded-full border-[13px] border-transparent border-t-emerald-500 border-r-emerald-500 rotate-[-25deg]" />

          <div className="relative text-center">
            <p className="text-[29px] font-bold tracking-tight text-slate-900">
              57%
            </p>

            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              acima de 30%
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4.5">
        {faixas.map((faixa) => (
          <div key={faixa.label}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2 w-2 rounded-full ${faixa.ponto}`}
                />

                <span className="text-[12px] font-medium text-slate-600">
                  {faixa.label}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-bold text-slate-800">
                  {faixa.quantidade}
                </span>

                <span className="text-[10px] text-slate-400">
                  ({faixa.percentual})
                </span>
              </div>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${faixa.barra} transition-all`}
                style={{
                  width: faixa.percentual,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="text-[10px] text-slate-400">
          Baseado nos produtos cadastrados
        </p>
      </div>
    </div>
  );
}
