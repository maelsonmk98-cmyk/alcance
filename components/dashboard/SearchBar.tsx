import Link from "next/link";
import { Plus, Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Busca */}
      <div className="relative w-full sm:max-w-[380px]">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
          strokeWidth={1.8}
        />

        <input
          type="text"
          placeholder="Buscar por SKU ou nome..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-[12px] text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.025)] outline-none transition placeholder:text-slate-400 focus:border-[#071E49]/20 focus:ring-4 focus:ring-[#071E49]/[0.04]"
        />
      </div>

      {/* Novo Produto */}
      <Link
        href="/produtos/novo"
        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#071E49] px-4 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(7,30,73,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0A2860] hover:shadow-[0_7px_18px_rgba(7,30,73,0.18)]"
      >
        <Plus size={15} strokeWidth={2.5} />
        Novo Produto
      </Link>
    </div>
  );
}
