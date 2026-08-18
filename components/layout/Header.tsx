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
    <header
      className="
        flex
        h-[64px]
        w-full
        shrink-0
        items-center
        border-b
        border-[#1d2d44]
        bg-[#081321]
        px-3
        pl-[72px]
        sm:px-4
        sm:pl-[76px]
        md:h-[70px]
        md:px-6
        md:pl-6
      "
    >
      {/* BUSCA DESKTOP */}
      <div className="hidden w-full max-w-[520px] items-center md:flex">
        <div
          className="
            flex
            h-10
            w-full
            items-center
            gap-3
            rounded-xl
            border
            border-[#263951]
            bg-[#0d1b2f]
            px-3.5
            transition
            focus-within:border-blue-500/40
          "
        >
          <Search
            size={17}
            strokeWidth={1.8}
            className="text-slate-500"
          />

          <span className="text-[11px] text-slate-500">
            Buscar produto, SKU, categoria...
          </span>

          <span
            className="
              ml-auto
              rounded-md
              border
              border-[#263951]
              bg-[#102039]
              px-2
              py-0.5
              text-[9px]
              font-medium
              text-slate-500
            "
          >
            /
          </span>
        </div>
      </div>

      {/* TÍTULO MOBILE */}
      <div className="min-w-0 md:hidden">
        <p className="truncate text-[14px] font-semibold text-white">
          Alcance
        </p>

        <p className="truncate text-[9px] text-slate-500">
          Gestão de e-commerce
        </p>
      </div>

      {/* AÇÕES */}
      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        {/* NOTIFICAÇÕES */}
        <button
          type="button"
          aria-label="Notificações"
          className="
            relative
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            text-slate-500
            transition
            hover:bg-[#102039]
            hover:text-slate-300
            md:h-10
            md:w-10
          "
        >
          <Bell
            size={18}
            strokeWidth={1.8}
          />

          <span
            className="
              absolute
              right-2
              top-1.5
              h-1.5
              w-1.5
              rounded-full
              bg-[#F47B20]
              ring-2
              ring-[#081321]
              md:right-2.5
              md:top-2
            "
          />
        </button>

        {/* SEPARADOR DESKTOP */}
        <div className="mx-1 hidden h-7 w-px bg-[#1d2d44] md:block" />

        {/* NOVO PRODUTO */}
        <Link
          href="/produtos/novo"
          aria-label="Novo produto"
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            bg-[#F47B20]
            text-white
            shadow-[0_6px_18px_rgba(244,123,32,0.18)]
            transition-all
            duration-200
            hover:bg-[#E96F17]
            sm:h-10
            sm:w-auto
            sm:px-3
            md:px-4
          "
        >
          <Plus
            size={16}
            strokeWidth={2.5}
          />

          <span className="ml-2 hidden text-[11px] font-semibold sm:inline">
            Novo Produto
          </span>
        </Link>

        {/* SAIR */}
        <button
          type="button"
          onClick={sair}
          aria-label="Sair"
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            border
            border-[#263951]
            bg-[#0d1b2f]
            text-slate-300
            transition
            hover:border-red-500/30
            hover:bg-red-500/10
            hover:text-red-400
            sm:h-10
            sm:w-auto
            sm:px-3
            md:px-4
          "
        >
          <LogOut
            size={16}
            strokeWidth={2}
          />

          <span className="ml-2 hidden text-[11px] font-semibold sm:inline">
            Sair
          </span>
        </button>
      </div>
    </header>
  );
}