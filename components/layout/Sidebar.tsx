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
    <aside className="flex h-screen w-[270px] shrink-0 flex-col bg-[#061C46] text-white">
      {/* Logo */}
      <div className="flex h-[112px] items-center border-b border-white/10 px-7">
        <div className="flex items-center gap-3">
          {/* Temporariamente usamos o símbolo estilizado.
              Depois vamos colocar a logo oficial enviada. */}
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-xl font-bold">
            A
          </div>

          <div>
            <h1 className="text-[25px] font-bold leading-none tracking-tight">
              Alcance
            </h1>

            <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.16em] text-white/60">
              Análise de produtos e margens
            </p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-1.5">
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
                  "group flex h-12 items-center gap-4 rounded-xl px-4 text-[15px] font-medium transition-all",
                  isActive
                    ? "bg-[#173967] text-white shadow-sm"
                    : "text-white/80 hover:bg-white/8 hover:text-white",
                ].join(" ")}
              >
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={
                    isActive
                      ? "text-orange-400"
                      : "text-white/80 group-hover:text-white"
                  }
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Ajuda */}
        <div className="mt-8 rounded-2xl bg-[#173967] p-4">
          <div className="flex items-center gap-2">
            <CircleHelp size={18} className="text-white" />

            <span className="text-sm font-semibold">
              Precisa de ajuda?
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-white/65">
            Acesse nossa central de ajuda e tire suas dúvidas.
          </p>

          <button
            type="button"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/30 px-3 py-2 text-xs font-medium transition hover:bg-white/10"
          >
            Acessar ajuda
            <ExternalLink size={13} />
          </button>
        </div>
      </nav>

      {/* Usuário */}
      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/8"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
            AD
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              Alcance Digital
            </p>

            <p className="mt-0.5 text-xs text-white/55">
              Administrador
            </p>
          </div>

          <ChevronDown size={18} className="text-white/60" />
        </button>
      </div>
    </aside>
  );
}