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
  { label: "Ajuda", href: "/ajuda", icon: CircleHelp },
];

export type SidebarProps = {
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
      <div className="relative flex h-[104px] shrink-0 items-center border-b border-white/[0.07] px-5">
        <Link href="/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <div className="relative h-[55px] w-[55px] shrink-0">
            <Image src="/logo-alcance-clara.png" alt="Logo Alcance" fill sizes="55px" className="object-contain" priority />
          </div>
          <div className="min-w-0">
            <h1 className="text-[23px] font-bold leading-none tracking-[-0.04em] text-white">Alcance</h1>
            <p className="mt-1.5 text-[8px] font-medium uppercase leading-3 tracking-[-0.01em] text-slate-400">
              Análise de produtos e margens
            </p>
          </div>
        </Link>
      </div>

      <nav aria-label="Navegação principal" className="min-h-0 flex-1 overflow-y-auto px-3 py-5 [scrollbar-color:#294160_transparent] [scrollbar-width:thin]">
        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "group relative flex h-[46px] items-center gap-3.5 rounded-xl px-4 text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-[linear-gradient(90deg,rgba(249,115,22,0.19),rgba(249,115,22,0.055))] text-white shadow-[inset_0_0_0_1px_rgba(249,115,22,0.10),0_8px_24px_rgba(0,0,0,0.12)]"
                    : "text-slate-300/80 hover:bg-white/[0.055] hover:text-white",
                ].join(" ")}
              >
                {isActive && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#ff7a1a] shadow-[0_0_12px_rgba(249,115,22,0.75)]" />}
                <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? "text-[#ff861e]" : "text-slate-400 group-hover:text-orange-300"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="shrink-0 border-t border-white/[0.08] bg-[#071a30]/80 px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl px-1 py-1">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-orange-400/20 bg-[linear-gradient(135deg,#86512f,#39291f)] text-[13px] font-bold text-white shadow-[0_0_24px_rgba(249,115,22,0.10)]" aria-label="Perfil Alcance">
            AL
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">Alcance</p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#ff8b2b]">{roleLabel}</p>
          </div>
          <ChevronDown size={16} className="text-slate-500" aria-hidden="true" />
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
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  return (
    <>
      <aside className="relative hidden h-screen w-[250px] shrink-0 flex-col overflow-hidden border-r border-[#1c3551]/70 bg-[#061a30] text-white md:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_5%_0%,rgba(14,51,85,0.65),transparent_56%)]" />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <SidebarContent role={role} />
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={mobileOpen}
        aria-controls="alcance-mobile-sidebar"
        className="fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.12] bg-[#071a30] text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] md:hidden"
      >
        <Menu size={23} />
      </button>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-[3px] md:hidden"
        />
      )}

      <aside
        id="alcance-mobile-sidebar"
        aria-label="Menu lateral"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        className={[
          "fixed inset-y-0 left-0 z-[80] flex w-[285px] max-w-[86vw] flex-col overflow-hidden border-r border-[#1c3551] bg-[#061a30] text-white shadow-[20px_0_60px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.07] text-white/80 transition hover:bg-white/[0.12] hover:text-white"
        >
          <X size={20} />
        </button>
        <SidebarContent role={role} onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
