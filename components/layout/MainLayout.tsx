"use client";

import { useEffect, useState } from "react";
import Sidebar, { type SidebarProps } from "./Sidebar";
import Header from "./Header";
import { supabase } from "@/lib/supabase";

type AccountRole = NonNullable<SidebarProps["role"]>;

export default function MainLayout({
  children,
  fullWidth = false,
  dark = false,
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
  dark?: boolean;
}) {
  const [role, setRole] = useState<AccountRole>("user");

  useEffect(() => {
    let mounted = true;

    async function refreshRole() {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      setRole(!error && data.user?.app_metadata?.role === "admin" ? "admin" : "user");
    }

    void refreshRole();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => {
        if (mounted) void refreshRole();
      }, 0);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div
      className={`flex h-dvh min-h-0 w-full overflow-hidden ${
        dark ? "bg-[#07111f]" : "bg-[#F6F8FB]"
      }`}
    >
      <Sidebar role={role} />

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0">
          <Header />
        </div>

        <main
          className={`min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto ${
            dark ? "bg-[#07111f]" : "bg-[#F6F8FB]"
          }`}
        >
          {fullWidth ? (
            <div className="min-w-0 pt-16 md:pt-0">{children}</div>
          ) : (
            <div className="min-w-0 px-4 pb-6 pt-20 sm:px-5 sm:pb-7 md:px-6 md:pt-6 lg:px-8 lg:py-7">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
