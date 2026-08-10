"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Plus,
  Search,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const router = useRouter();

  async function sair() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erro ao sair:", error);
      alert("Não foi possível sair da conta.");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 w-full items-center border-b border-slate-200 bg-white px-4 md:px-6">
      {/* Busca */}
      <div className="hidden w-full max-w-md items-center md:flex">
        <div className="flex h-10 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5">
          <Search
            size={17}
            strokeWidth={1.8}
            className="text-slate-400"
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

        {/* Sair */}
        <button
          type="button"
          onClick={sair}
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-[12px] font-semibold text-slate-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={16} strokeWidth={2} />

          <span className="hidden sm:inline">
            Sair
          </span>
        </button>
      </div>
    </header>
  );
}