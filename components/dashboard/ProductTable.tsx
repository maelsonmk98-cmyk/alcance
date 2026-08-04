export default function ProductTable() {
  const produtos = [
    {
      sku: "ALC-001",
      nome: "Headset Gamer HyperX Cloud II",
      custo: "R$ 350,00",
      venda: "R$ 599,90",
      margem: "35,42%",
    },
    {
      sku: "ALC-002",
      nome: "Teclado Redragon K552",
      custo: "R$ 210,00",
      venda: "R$ 399,90",
      margem: "33,18%",
    },
    {
      sku: "ALC-003",
      nome: "Mouse Logitech G403",
      custo: "R$ 180,00",
      venda: "R$ 329,90",
      margem: "31,52%",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Produtos Recentes
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Acompanhe os produtos cadastrados recentemente.
          </p>
        </div>

        <button
          type="button"
          className="text-sm font-semibold text-[#173967] transition hover:text-orange-500"
        >
          Ver todos
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px]">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                SKU
              </th>

              <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Produto
              </th>

              <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Custo
              </th>

              <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Venda
              </th>

              <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Margem
              </th>
            </tr>
          </thead>

          <tbody>
            {produtos.map((produto) => (
              <tr
                key={produto.sku}
                className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50"
              >
                <td className="py-4 text-sm font-medium text-slate-500">
                  {produto.sku}
                </td>

                <td className="py-4 pr-4">
                  <p className="max-w-[280px] truncate text-sm font-semibold text-slate-800">
                    {produto.nome}
                  </p>
                </td>

                <td className="py-4 text-sm text-slate-600">
                  {produto.custo}
                </td>

                <td className="py-4 text-sm font-medium text-slate-700">
                  {produto.venda}
                </td>

                <td className="py-4">
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                    {produto.margem}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}