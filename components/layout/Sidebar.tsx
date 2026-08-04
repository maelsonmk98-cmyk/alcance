"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
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
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
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
    <aside className="flex h-screen w-[260px] shrink-0 flex-col bg-[#071E49] text-white">
      {/* Logo */}
      <div className="flex h-[112px] items-center border-b border-white/[0.08] px-7">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F47B20] shadow-sm">
            <span className="text-[22px] font-bold text-white">A</span>
          </div>

          <div>
            <h1 className="text-[25px] font-bold leading-none tracking-[-0.03em]">
              Alcance
            </h1>

            <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.16em] text-white/55">
              Análise de produtos e margens
            </p>
          </div>
        </Link>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
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
                  "group relative flex h-11 items-center gap-3 rounded-xl px-4 text-[14px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/[0.10] text-white"
                    : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                ].join(" ")}
              >
                {isActive && (
                  <span className="absolute left-0 top-2.5 h-6 w-[3px] rounded-r-full bg-[#F47B20]" />
                )}

                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={
                    isActive
                      ? "text-[#F47B20]"
                      : "text-white/55 group-hover:text-white"
                  }
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Ajuda */}
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.055] p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F47B20]/15">
              <CircleHelp size={17} className="text-[#F47B20]" />
            </div>

            <span className="text-sm font-semibold">
              Precisa de ajuda?
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-white/50">
            Acesse nossa central de ajuda e tire suas dúvidas.
          </p>

          <button
            type="button"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/[0.08] hover:text-white"
          >
            Acessar ajuda
            <ExternalLink size={13} />
          </button>
        </div>
      </nav>

      {/* Usuário */}
      <div className="border-t border-white/[0.08] p-4">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.06]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F47B20] text-xs font-bold text-white">
            AD
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              Alcance Digital
            </p>

            <p className="mt-0.5 text-[11px] text-white/45">
              Administrador
            </p>
          </div>

          <ChevronDown size={17} className="text-white/40" />
        </button>
      </div>
    </aside>
  );
}
