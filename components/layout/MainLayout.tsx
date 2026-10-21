
"use client";

import { useEffect, useState } from "react";
import Sidebar, { type SidebarProps } from "./Sidebar";
import Header from "./Header";
import { supabase } from "@/lib/supabase";

type AccountRole = NonNullable<SidebarProps["role"]>;

type MainLayoutProps = {
  children: React.ReactNode;
  fullWidth?: boolean;
  dark?: boolean;
};

export default function MainLayout({
  children,
  fullWidth = false,
  dark = false,
}: MainLayoutProps) {
  const [role, setRole] = useState<AccountRole>("user");

  useEffect(() => {
    let mounted = true;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    async function refreshRole() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (!mounted) return;

        setRole(
          !error && data.user?.app_metadata?.role === "admin"
            ? "admin"
            : "user"
        );
      } catch {
        if (mounted) {
          setRole("user");
        }
      }
    }

    void refreshRole();

    const { data: listener } = supabase.auth.onAuthStateChange(
      () => {
        const timer = setTimeout(() => {
          timers.delete(timer);

          if (mounted) {
            void refreshRole();
          }
        }, 0);

        timers.add(timer);
      }
    );

    return () => {
      mounted = false;

      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();

      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div
      className={`relative flex h-dvh w-full overflow-hidden ${
        dark ? "bg-[#07111f]" : "bg-[#F6F8FB]"
      }`}
    >
      {/* Fundo permanente da coluna lateral no desktop */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed inset-y-0 left-0 z-0
          hidden w-[250px]
          bg-[#071E49]
          md:block
        "
      />

      {/* Coluna lateral */}
      <div
        className="
          relative z-20
          hidden h-full w-[250px]
          shrink-0
          overflow-hidden
          bg-[#071E49]
          md:block
        "
      >
        <Sidebar role={role} />
      </div>

      {/* Sidebar mobile */}
      <div className="md:hidden">
        <Sidebar role={role} />
      </div>

      {/* Área principal */}
      <div
        className="
          relative z-10
          flex h-full min-h-0 min-w-0
          flex-1 flex-col
          overflow-hidden
        "
      >
        {/* Cabeçalho */}
        <div className="shrink-0">
          <Header />
        </div>

        {/* Conteúdo com rolagem independente */}
        <main
          className={`min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto ${
            dark ? "bg-[#07111f]" : "bg-[#F6F8FB]"
          }`}
        >
          {fullWidth ? (
            <div className="min-w-0 pt-16 md:pt-0">
              {children}
            </div>
          ) : (
            <div
              className="
                min-w-0
                px-4 pb-6 pt-20
                sm:px-5 sm:pb-7
                md:px-6 md:pt-6
                lg:px-8 lg:py-7
              "
            >
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
