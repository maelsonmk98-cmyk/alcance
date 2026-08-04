const faixas = [
  {
    label: "Acima de 30%",
    quantidade: 142,
    percentual: "57%",
    barra: "bg-emerald-500",
  },
  {
    label: "Entre 20% e 30%",
    quantidade: 68,
    percentual: "27%",
    barra: "bg-blue-500",
  },
  {
    label: "Entre 10% e 20%",
    quantidade: 26,
    percentual: "10%",
    barra: "bg-orange-500",
  },
  {
    label: "Abaixo de 10%",
    quantidade: 12,
    percentual: "6%",
    barra: "bg-red-500",
  },
];

export default function MarginChart() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">
          Margem por Faixa
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Distribuição das margens dos produtos.
        </p>
      </div>

      {/* Indicador principal */}
      <div className="flex justify-center py-2">
        <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-[18px] border-slate-100">
          <div className="absolute inset-[-18px] rounded-full border-[18px] border-transparent border-t-emerald-500 border-r-emerald-500 rotate-[-25deg]" />

          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">
              57%
            </p>

            <p className="mt-1 text-xs text-slate-500">
              acima de 30%
            </p>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-7 space-y-5">
        {faixas.map((faixa) => (
          <div key={faixa.label}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${faixa.barra}`}
                />

                <span className="text-sm text-slate-600">
                  {faixa.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  {faixa.quantidade}
                </span>

                <span className="text-xs text-slate-400">
                  ({faixa.percentual})
                </span>
              </div>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${faixa.barra}`}
                style={{
                  width: faixa.percentual,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}