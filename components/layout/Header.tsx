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
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Erro ao sair:",
        error
      );

      alert(
        "Não foi possível sair da conta."
      );

      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <header
      className="
        flex
        h-[70px]
        w-full
        shrink-0
        items-center
        border-b
        border-[#1d2d44]
        bg-[#081321]
        px-4
        md:px-6
      "
    >
      {/* BUSCA */}
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

      {/* AÇÕES */}
      <div className="ml-auto flex items-center gap-2.5">

        {/* NOTIFICAÇÕES */}
        <button
          type="button"
          aria-label="Notificações"
          className="
            relative
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            text-slate-500
            transition
            hover:bg-[#102039]
            hover:text-slate-300
          "
        >
          <Bell
            size={18}
            strokeWidth={1.8}
          />

          <span
            className="
              absolute
              right-2.5
              top-2
              h-1.5
              w-1.5
              rounded-full
              bg-[#F47B20]
              ring-2
              ring-[#081321]
            "
          />
        </button>

        {/* SEPARADOR */}
        <div className="mx-1 hidden h-7 w-px bg-[#1d2d44] sm:block" />

        {/* NOVO PRODUTO */}
        <Link
          href="/produtos/novo"
          className="
            flex
            h-10
            items-center
            gap-2
            rounded-xl
            bg-[#F47B20]
            px-4
            text-[11px]
            font-semibold
            text-white
            shadow-[0_6px_18px_rgba(244,123,32,0.18)]
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:bg-[#E96F17]
          "
        >
          <Plus
            size={16}
            strokeWidth={2.5}
          />

          <span className="hidden sm:inline">
            Novo Produto
          </span>
        </Link>

        {/* SAIR */}
        <button
          type="button"
          onClick={sair}
          className="
            flex
            h-10
            items-center
            gap-2
            rounded-xl
            border
            border-[#263951]
            bg-[#0d1b2f]
            px-4
            text-[11px]
            font-semibold
            text-slate-300
            transition
            hover:border-red-500/30
            hover:bg-red-500/10
            hover:text-red-400
          "
        >
          <LogOut
            size={16}
            strokeWidth={2}
          />

          <span className="hidden sm:inline">
            Sair
          </span>
        </button>
      </div>
    </header>
  );
}