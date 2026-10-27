
"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Plus,
  Search,
  LogOut,
  X,
  PackageSearch,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const router = useRouter();

  const [busca, setBusca] = useState("");
  const [notificacoesAbertas, setNotificacoesAbertas] =
    useState(false);
  const [saindo, setSaindo] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const notificacoesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function atalhos(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (event.key === "Escape") {
        inputRef.current?.blur();
        setNotificacoesAbertas(false);
      }
    }

    window.addEventListener("keydown", atalhos);

    return () => {
      window.removeEventListener("keydown", atalhos);
    };
  }, []);

  useEffect(() => {
    function fecharAoClicarFora(event: MouseEvent) {
      if (
        notificacoesRef.current &&
        !notificacoesRef.current.contains(
          event.target as Node
        )
      ) {
        setNotificacoesAbertas(false);
      }
    }

    document.addEventListener(
      "mousedown",
      fecharAoClicarFora
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharAoClicarFora
      );
    };
  }, []);

  function pesquisar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const termo = busca.trim();

    if (!termo) {
      inputRef.current?.focus();
      return;
    }

    router.push(
      `/produtos?busca=${encodeURIComponent(termo)}`
    );
  }

  async function sair() {
    if (saindo) return;

    setSaindo(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair:", error);
      alert("Não foi possível sair da conta.");
      setSaindo(false);
    }
  }

  return (
    <header
      className="
        relative z-40 flex h-[72px] w-full shrink-0
        items-center justify-between
        border-b border-[#1D3049]
        bg-[#061324]
        px-3 pl-[72px]
        sm:px-5 sm:pl-[76px]
        md:h-[80px] md:px-7 md:pl-7
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_at_30%_0%,rgba(26,72,128,0.12),transparent_55%)]
        "
      />

      {/* BUSCA */}
      <form
        onSubmit={pesquisar}
        role="search"
        className="
          relative hidden h-[44px] w-full max-w-[610px]
          items-center gap-3 rounded-2xl
          border border-[#263D5C]
          bg-[#0B1E35]/90 px-4
          shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]
          transition-colors
          focus-within:border-[#F47B20]/60
          md:flex
        "
      >
        <Search
          size={19}
          strokeWidth={1.8}
          className="shrink-0 text-[#8296B3]"
        />

        <input
          ref={inputRef}
          type="search"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar produto, SKU, categoria ou fornecedor..."
          aria-label="Buscar produtos"
          className="
            h-full min-w-0 flex-1 bg-transparent
            text-[12px] text-white outline-none
            placeholder:text-[#7388A6]
          "
        />

        {busca ? (
          <button
            type="button"
            onClick={() => {
              setBusca("");
              inputRef.current?.focus();
            }}
            aria-label="Limpar busca"
            className="text-slate-500 hover:text-white"
          >
            <X size={15} />
          </button>
        ) : (
          <div className="hidden items-center gap-1 lg:flex">
            <kbd className="rounded-md bg-[#152D4A] px-1.5 py-1 text-[10px] text-slate-400">
              Ctrl
            </kbd>
            <kbd className="rounded-md bg-[#152D4A] px-1.5 py-1 text-[10px] text-slate-400">
              K
            </kbd>
          </div>
        )}
      </form>

      {/* IDENTIDADE MOBILE */}
      <div className="relative min-w-0 md:hidden">
        <p className="truncate text-[16px] font-bold text-white">
          Alcance
        </p>
        <p className="text-[9px] text-[#8296B3]">
          Gestão de e-commerce
        </p>
      </div>

      {/* AÇÕES */}
      <div className="relative ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        {/* NOTIFICAÇÕES */}
        <div ref={notificacoesRef} className="relative">
          <button
            type="button"
            onClick={() =>
              setNotificacoesAbertas((valor) => !valor)
            }
            aria-label="Notificações"
            aria-expanded={notificacoesAbertas}
            aria-haspopup="dialog"
            className="
              flex h-10 w-10 items-center justify-center
              rounded-xl text-[#94A8C3]
              transition-all duration-200
              hover:bg-white/[0.055]
              hover:text-white
            "
          >
            <Bell size={20} strokeWidth={1.8} />
          </button>

          {notificacoesAbertas && (
            <div
              role="dialog"
              aria-label="Painel de notificações"
              className="
                absolute right-0 top-[52px] z-50
                w-[280px] rounded-2xl
                border border-[#294260]
                bg-[#0B1D33] p-4
                shadow-[0_24px_70px_rgba(0,0,0,0.45)]
                sm:w-[320px]
              "
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-white">
                  Notificações
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setNotificacoesAbertas(false)
                  }
                  aria-label="Fechar notificações"
                  className="text-slate-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-5 flex flex-col items-center gap-3 py-5 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#142D49] text-[#8296B3]">
                  <Bell size={22} />
                </div>

                <p className="text-[12px] font-semibold text-slate-200">
                  Central de notificações
                </p>

                <p className="max-w-[230px] text-[11px] leading-5 text-slate-400">
                  Os alertas automáticos ainda não estão
                  integrados ao sistema.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mx-1 hidden h-7 w-px bg-[#243850] sm:block" />

        {/* NOVO PRODUTO */}
        <Link
          href="/produtos/novo"
          className="
            flex h-[42px] items-center justify-center
            gap-2 rounded-xl
            bg-[#F47B20] px-3
            text-white
            shadow-[0_6px_22px_rgba(244,123,32,0.20)]
            transition-all duration-200
            hover:bg-[#FF8A32]
            hover:shadow-[0_8px_26px_rgba(244,123,32,0.30)]
            sm:px-5
            md:h-[46px]
          "
        >
          <Plus size={19} strokeWidth={2.3} />

          <span className="hidden whitespace-nowrap text-[12px] font-semibold sm:inline">
            Novo Produto
          </span>
        </Link>

        {/* SAIR */}
        <button
          type="button"
          onClick={sair}
          disabled={saindo}
          aria-label="Sair da conta"
          className="
            flex h-[42px] items-center justify-center
            gap-2 rounded-xl
            border border-[#2B4360]
            bg-[#0C1D32] px-3
            text-[#D8E4F4]
            transition-all duration-200
            hover:border-red-500/40
            hover:bg-red-500/10
            hover:text-red-300
            disabled:cursor-wait disabled:opacity-60
            sm:px-4
            md:h-[46px]
          "
        >
          <LogOut size={17} strokeWidth={1.9} />

          <span className="hidden text-[12px] font-semibold sm:inline">
            {saindo ? "Saindo..." : "Sair"}
          </span>
        </button>
      </div>
    </header>
  );
}
