"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function cadastrar() {
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome,
        },
      },
    });

    if (error) {
      setMensagem(error.message);
      return;
    }

    setMensagem("Cadastro realizado! Verifique seu e-mail.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">
          Criar Cadastro
        </h1>

        <input
          className="border p-2 w-full"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button
          onClick={cadastrar}
          className="bg-black text-white p-2 w-full rounded"
        >
          Cadastrar
        </button>

        {mensagem && (
          <p>{mensagem}</p>
        )}
      </div>
    </main>
  );
}