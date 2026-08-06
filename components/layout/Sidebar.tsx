"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  Calculator,
  Megaphone,
  Truck,
  BarChart3,
  Wallet,
  Settings,
  ChevronDown,
  CircleHelp,
  ExternalLink,
} from "lucide-react";

const menuItems = [
  {
    label: "Estoque",
    href: "/",
    icon: Package,
  },
  {
    label: "Produtos",
    href: "/produtos",
    icon: Package,
  },
  {
    label: "Calculadora",
    href: "/calculadora",
    icon: Calculator,
  },
  {
    label: "Anúncios",
    href: "/anuncios",
    icon: Megaphone,
  },
  {
    label: "Fornecedores",
    href: "/fornecedores",
    icon: Truck,
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
  },
  {
    label: "Despesas",
    href: "/despesas",
    icon: Wallet,
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[250px] shrink-0 flex-col bg-[#071E49] text-white">
      {/* Logo */}
      <div className="flex h-[96px] items-center border-b border-white/[0.07] px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47B20] shadow-[0_6px_18px_rgba(244,123,32,0.25)]">
            <span className="text-xl font-bold text-white">A</span>
          </div>

          <div>
            <h1 className="text-[23px] font-bold leading-none tracking-[-0.04em]">
              Alcance
            </h1>

            <p className="mt-1.5 text-[8px] font-medium uppercase tracking-[0.15em] text-white/40">
              Análise de produtos e margens
            </p>
          </div>
        </Link>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
          Menu principal
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-[13.5px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/[0.10] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                    : "text-white/55 hover:bg-white/[0.055] hover:text-white",
                ].join(" ")}
              >
                {isActive && (
                  <span className="absolute left-0 top-2.5 h-6 w-[3px] rounded-r-full bg-[#F47B20]" />
                )}

                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={
                    isActive
                      ? "text-[#F47B20]"
                      : "text-white/45 group-hover:text-white"
                  }
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Ajuda */}
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.045] p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F47B20]/10">
              <CircleHelp size={16} className="text-[#F47B20]" />
            </div>

            <span className="text-[13px] font-semibold">
              Precisa de ajuda?
            </span>
          </div>

          <p className="mt-3 text-[11px] leading-5 text-white/40">
            Acesse nossa central de ajuda e tire suas dúvidas.
          </p>

          <button
            type="button"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[11px] font-medium text-white/65 transition hover:bg-white/[0.08] hover:text-white"
          >
            Acessar ajuda
            <ExternalLink size={12} />
          </button>
        </div>
      </nav>

      {/* Usuário */}
      <div className="border-t border-white/[0.07] p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-white/[0.055]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F47B20] text-[11px] font-bold text-white">
            AD
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold">
              Alcance Digital
            </p>

            <p className="mt-0.5 text-[10px] text-white/35">
              Administrador
            </p>
          </div>

          <ChevronDown size={16} className="text-white/30" />
        </button>
      </div>
    </aside>
  );
}