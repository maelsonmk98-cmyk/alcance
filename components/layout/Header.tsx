import Link from "next/link";
import {
  Bell,
  Plus,
  Search,
} from "lucide-react";

export default function Header() {
  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-6 lg:px-8">
      {/* Busca */}
      <div className="hidden w-full max-w-[420px] md:flex">
        <div className="group flex h-10 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-slate-400 transition-all duration-200 focus-within:border-[#071E49]/20 focus-within:bg-white focus-within:shadow-sm">
          <Search
            size={17}
            strokeWidth={1.8}
            className="shrink-0 text-slate-400"
          />

          <span className="text-[12px] text-slate-400">
            Buscar produto, SKU...
          </span>

          <span className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-400 shadow-sm">
            /
          </span>
        </div>
      </div>

      {/* Ações */}
      <div className="ml-auto flex items-center gap-2.5">
        {/* Notificações */}
        <button
          type="button"
          aria-label="Notificações"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-slate-50 hover:text-[#071E49]"
        >
          <Bell size={18} strokeWidth={1.8} />

          <span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-[#F47B20] ring-2 ring-white" />
        </button>

        {/* Separador */}
        <div className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" />

        {/* Novo Produto */}
        <Link
          href="/produtos/novo"
          className="flex h-10 items-center gap-2 rounded-xl bg-[#F47B20] px-3.5 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(244,123,32,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E96F17] hover:shadow-[0_7px_18px_rgba(244,123,32,0.24)]"
        >
          <Plus size={16} strokeWidth={2.5} />

          <span className="hidden sm:inline">
            Novo Produto
          </span>
        </Link>
      </div>
    </header>
  );
}
