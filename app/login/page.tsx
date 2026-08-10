"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro("");
    setCarregando(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });

      if (error) {
        setErro(error.message);
        return;
      }

      if (!data.session) {
        setErro("Não foi possível criar a sessão.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Erro no login:", err);
      setErro("Erro inesperado ao fazer login.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold text-[#071E49]">
            Entrar
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Acesse sua conta Alcance
          </p>
        </div>

        <input
          className="mb-4 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#071E49]"
          placeholder="Digite seu e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              entrar();
            }
          }}
        />

        <input
          className="mb-4 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#071E49]"
          placeholder="Digite sua senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              entrar();
            }
          }}
        />

        {erro && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {erro}
          </div>
        )}

        <button
          type="button"
          onClick={entrar}
          disabled={carregando}
          className="w-full rounded-xl bg-[#F47B20] p-3 font-semibold text-white transition hover:bg-[#E96F17] disabled:bg-slate-400"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        <div className="mt-6 border-t border-slate-100 pt-6 text-center">
          <p className="text-sm text-slate-500">
            Ainda não possui uma conta?
          </p>

          <Link
            href="/cadastro"
            className="mt-2 inline-block font-semibold text-[#071E49] hover:underline"
          >
            Criar minha conta
          </Link>
        </div>
      </div>
    </main>
  );
}