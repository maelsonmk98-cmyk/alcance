"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setErro(error.message);
        setCarregando(false);
        return;
      }

console.log("Usuário logado:", data.user);
console.log("Sessão:", data.session);

alert(data.session ? "TEM SESSÃO" : "SEM SESSÃO");

router.push("/");
router.refresh();

    } catch (err) {
      console.error(err);
      setErro("Erro inesperado ao fazer login.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">

      <div className="bg-white p-8 rounded-2xl shadow-xl w-[420px]">

        <h1 className="text-3xl font-bold mb-6 text-center">
          Login
        </h1>

        <input
          className="border rounded-xl p-3 w-full mb-4"
          placeholder="Digite seu e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border rounded-xl p-3 w-full mb-4"
          placeholder="Digite sua senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        {erro && (
          <div className="text-red-500 text-sm mb-4">
            {erro}
          </div>
        )}

        <button
          onClick={entrar}
          disabled={carregando}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-xl p-3 font-semibold"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>

      </div>

    </main>
  );
}