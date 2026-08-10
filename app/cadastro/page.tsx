"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    setErro("");
    setMensagem("");

    if (!nome.trim()) {
      setErro("Informe seu nome.");
      return;
    }

    if (!email.trim()) {
      setErro("Informe seu e-mail.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setCarregando(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          data: {
            nome: nome.trim(),
          },
        },
      });

      if (error) {
        setErro(error.message);
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setMensagem(
        "Cadastro realizado. Verifique seu e-mail para confirmar sua conta."
      );
    } catch (err) {
      console.error("Erro no cadastro:", err);
      setErro("Erro inesperado ao criar a conta.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-[440px] rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold text-[#071E49]">
            Criar conta
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Cadastre-se para acessar a Alcance
          </p>
        </div>

        <input
          className="mb-4 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#071E49]"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <input
          className="mb-4 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#071E49]"
          placeholder="Seu e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="mb-4 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#071E49]"
          placeholder="Crie uma senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <input
          className="mb-4 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#071E49]"
          placeholder="Confirme sua senha"
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
        />

        {erro && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
            {mensagem}
          </div>
        )}

        <button
          onClick={cadastrar}
          disabled={carregando}
          className="w-full rounded-xl bg-[#F47B20] p-3 font-semibold text-white transition hover:bg-[#E96F17] disabled:bg-slate-400"
        >
          {carregando ? "Criando conta..." : "Criar conta"}
        </button>

        <div className="mt-6 border-t border-slate-100 pt-6 text-center">
          <p className="text-sm text-slate-500">
            Já possui uma conta?
          </p>

          <Link
            href="/login"
            className="mt-2 inline-block font-semibold text-[#071E49] hover:underline"
          >
            Entrar
          </Link>
        </div>
      </div>
    </main>
  );
}