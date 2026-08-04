import Link from "next/link";
import {
  Bell,
  Plus,
  Search,
} from "lucide-react";

export default function Header() {
  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
      {/* Área de busca */}
      <div className="hidden md:flex w-full max-w-md">
        <div className="flex h-10 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400">
          <Search size={18} />

          <span className="text-sm">
            Buscar produto, SKU...
          </span>

          <span className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-400">
            /
          </span>
        </div>
      </div>

      {/* Ações */}
      <div className="ml-auto flex items-center gap-3">
        {/* Notificações */}
        <button
          type="button"
          aria-label="Notificações"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <Bell size={19} strokeWidth={1.8} />

          <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />
        </button>

        {/* Novo Produto */}
        <Link
          href="/produtos/novo"
          className="flex h-10 items-center gap-2 rounded-xl bg-[#F97316] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#EA580C] hover:shadow-md"
        >
          <Plus size={17} strokeWidth={2.5} />

          <span className="hidden sm:inline">
            Novo Produto
          </span>
        </Link>
      </div>
    </header>
  );
}