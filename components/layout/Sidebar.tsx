"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  Menu,
  X,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Estoque", href: "/", icon: Package },
  { label: "Produtos", href: "/produtos", icon: Package },
  { label: "Vendas", href: "/vendas", icon: Wallet },
  { label: "Calculadora", href: "/calculadora", icon: Calculator },
  { label: "Anúncios", href: "/anuncios", icon: Megaphone },
  { label: "Fornecedores", href: "/fornecedores", icon: Truck },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Despesas", href: "/despesas", icon: Wallet },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

export type SidebarProps = {
  /** Permissão verificada pela autenticação no servidor. Padrão seguro: user. */
  role?: "admin" | "user";
};

type SidebarContentProps = SidebarProps & {
  onNavigate?: () => void;
};

function SidebarContent({ onNavigate, role = "user" }: SidebarContentProps) {
  const pathname = usePathname();
  const roleLabel = role === "admin" ? "Administrador" : "Usuário";

  return (
    <>
      {/* Identidade visual superior */}
      <div className="flex h-[96px] shrink-0 items-center border-b border-white/[0.07] px-4">
        <Link href="/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <div className="relative h-[54px] w-[54px] shrink-0">
            <Image src="/logo-alcance-clara.png" alt="Logo Alcance" fill sizes="54px" className="object-contain" priority />
          </div>
          <div className="min-w-0">
            <h1 className="text-[23px] font-bold leading-none tracking-[-0.04em] text-white">Alcance</h1>
            <p className="mt-1.5 text-[8px] font-medium uppercase leading-3 tracking-[-0.01em] text-white/50">
              Análise de produtos e margens
            </p>
          </div>
        </Link>
      </div>

      {/* Navegação */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">Menu principal</p>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={[
                  "group relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-[13.5px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/[0.10] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                    : "text-white/55 hover:bg-white/[0.055] hover:text-white",
                ].join(" ")}
              >
                {isActive && <span className="absolute left-0 top-2.5 h-6 w-[3px] rounded-r-full bg-[#F47B20]" />}
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? "text-[#F47B20]" : "text-white/45 group-hover:text-white"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.045] p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F47B20]/10">
              <CircleHelp size={16} className="text-[#F47B20]" />
            </div>
            <span className="text-[13px] font-semibold">Precisa de ajuda?</span>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-white/40">Acesse nossa central de ajuda e tire suas dúvidas.</p>
          <button type="button" className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[11px] font-medium text-white/65 transition hover:bg-white/[0.08] hover:text-white">
            Acessar ajuda <ExternalLink size={12} />
          </button>
        </div>
      </nav>

      {/* Rodapé: logo, Alcance e perfil; sem subtítulo */}
      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <div className="flex w-full items-center gap-3 rounded-xl p-2">
          <div className="relative h-11 w-11 shrink-0">
            <Image src="/logo-alcance-clara.png" alt="Logo Alcance" fill sizes="44px" className="object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold leading-tight text-white">Alcance</p>
            <p className="mt-1 text-[12px] font-semibold text-[#F47B20]">{roleLabel}</p>
          </div>
          <ChevronDown size={16} className="text-white/30" aria-hidden="true" />
        </div>
      </div>
    </>
  );
}

export default function Sidebar({ role = "user" }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <aside className="hidden h-screen w-[250px] shrink-0 flex-col bg-[#071E49] text-white md:flex">
        <SidebarContent role={role} />
      </aside>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={mobileOpen}
        className="fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-[#071E49] text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] md:hidden"
      >
        <Menu size={23} />
      </button>

      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={[
          "fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 md:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        aria-label="Menu lateral"
        aria-hidden={!mobileOpen}
        className={[
          "fixed inset-y-0 left-0 z-[80] flex w-[285px] max-w-[86vw] flex-col bg-[#071E49] text-white shadow-[20px_0_60px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/70 transition hover:bg-white/[0.10] hover:text-white"
        >
          <X size={20} />
        </button>
        <SidebarContent role={role} onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
