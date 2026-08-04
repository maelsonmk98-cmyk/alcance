import { ArrowUpRight, Package } from "lucide-react";

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
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#071E49]/[0.06]">
              <Package
                size={16}
                strokeWidth={2}
                className="text-[#071E49]"
              />
            </div>

            <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
              Produtos Recentes
            </h2>
          </div>

          <p className="mt-1.5 text-[11px] text-slate-400">
            Acompanhe os produtos cadastrados recentemente.
          </p>
        </div>

        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-[#071E49] transition hover:bg-slate-50 sm:flex"
        >
          Ver todos
          <ArrowUpRight size={13} />
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-left">
              <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                SKU
              </th>

              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Produto
              </th>

              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Custo
              </th>

              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Venda
              </th>

              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Margem
              </th>
            </tr>
          </thead>

          <tbody>
            {produtos.map((produto) => (
              <tr
                key={produto.sku}
                className="group border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/70"
              >
                <td className="px-6 py-4">
                  <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-semibold text-slate-500">
                    {produto.sku}
                  </span>
                </td>

                <td className="px-4 py-4 pr-6">
                  <p className="max-w-[280px] truncate text-[12px] font-semibold text-slate-800">
                    {produto.nome}
                  </p>
                </td>

                <td className="px-4 py-4 text-[12px] text-slate-500">
                  {produto.custo}
                </td>

                <td className="px-4 py-4 text-[12px] font-semibold text-slate-700">
                  {produto.venda}
                </td>

                <td className="px-4 py-4">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 ring-1 ring-inset ring-emerald-500/10">
                    {produto.margem}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rodapé */}
      <div className="border-t border-slate-100 px-6 py-3.5">
        <p className="text-[10px] text-slate-400">
          Exibindo os produtos cadastrados mais recentemente.
        </p>
      </div>
    </div>
  );
}
