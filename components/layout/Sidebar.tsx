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
            <span className="text-[13px] font-semibold">Precisa de ajuda?</span>
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
      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-white/[0.055]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F47B20] text-[11px] font-bold text-white">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold">Alcance Digital</p>
            <p className="mt-0.5 text-[10px] text-white/35">Administrador</p>
          </div>
          <ChevronDown size={16} className="text-white/30" />
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
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
      {/* Desktop */}
      <aside className="hidden h-screen w-[250px] shrink-0 flex-col bg-[#071E49] text-white md:flex">
        <SidebarContent />
      </aside>

      {/* Botão do menu mobile */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
        className="fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-[#071E49] text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] md:hidden"
      >
        <Menu size={23} />
      </button>

      {/* Overlay mobile */}
      <div
        onClick={() => setMobileOpen(false)}
        className={[
          "fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 md:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* Sidebar mobile */}
      <aside
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
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
