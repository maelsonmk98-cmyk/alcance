"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import type { ProductFormData } from "./ProductForm";

type ProductActionsProps = {
  data: ProductFormData;
  productId?: number;
};

export default function ProductActions({
  data,
  productId,
}: ProductActionsProps) {
  const router = useRouter();

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function salvarProduto() {
    setMensagem("");

    if (!data.nome.trim()) {
      setMensagem("Digite o nome do produto.");
      return;
    }

    if (!data.sku.trim()) {
      setMensagem("Digite o SKU do produto.");
      return;
    }

    setSalvando(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError);

        setMensagem(
          "Erro ao verificar o usuário logado."
        );

        return;
      }

      if (!user) {
        setMensagem(
          "Sua sessão expirou. Faça login novamente."
        );

        router.push("/login");

        return;
      }

      const produto = {
        nome: data.nome.trim(),
        sku: data.sku.trim(),

        codigo_barras:
          data.codigo_barras.trim() || null,

        numero_original:
          data.numero_original.trim() || null,

        categoria:
          data.categoria.trim() || null,

        marca:
          data.marca.trim() || null,

        fornecedor:
          data.fornecedor.trim() || null,

        custo: Number(
          data.custo_produto || 0
        ),

        frete: Number(
          data.frete || 0
        ),

        embalagem: Number(
          data.embalagem || 0
        ),

        comissao: Number(
          data.comissao || 0
        ),

        impostos: Number(
          data.impostos || 0
        ),

        acos: Number(
          data.acos || 0
        ),

        promocao: Number(
          data.promocao || 0
        ),

        outras_despesas: Number(
          data.outras_despesas || 0
        ),

        marketplace:
          data.marketplace || null,

        tipo_anuncio:
          data.tipo_anuncio || null,

        preco_venda: Number(
          data.preco_venda || 0
        ),

        fulfillment: Boolean(
          data.fulfillment
        ),

        estoque: Number(
          data.estoque || 0
        ),

        peso: Number(
          data.peso || 0
        ),

        altura: Number(
          data.altura || 0
        ),

        largura: Number(
          data.largura || 0
        ),

        comprimento: Number(
          data.comprimento || 0
        ),

        descricao:
          data.descricao.trim() || null,

        observacoes:
          data.observacoes.trim() || null,

        user_id: user.id,
      };

      let error;

      if (productId) {
        const resultado = await supabase
          .from("produtos")
          .update(produto)
          .eq("id", productId)
          .eq("user_id", user.id);

        error = resultado.error;
      } else {
        const resultado = await supabase
          .from("produtos")
          .insert([produto]);

        error = resultado.error;
      }

      if (error) {
        console.error(
          "Erro ao salvar produto:",
          error
        );

        setMensagem(
          "Erro ao salvar o produto: " +
            error.message
        );

        return;
      }

      setMensagem(
        productId
          ? "✅ Produto atualizado com sucesso!"
          : "✅ Produto cadastrado com sucesso!"
      );

      setTimeout(() => {
        router.push("/produtos");
        router.refresh();
      }, 800);
    } catch (error) {
      console.error(error);

      setMensagem(
        "Ocorreu um erro ao salvar o produto."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col items-end gap-4">
      {mensagem && (
        <div className="w-full text-center font-medium">
          {mensagem}
        </div>
      )}

      <div className="flex justify-end gap-4">
        <a
          href="/produtos"
          className="rounded-xl border px-6 py-3 transition hover:bg-gray-100"
        >
          Cancelar
        </a>

        <button
          type="button"
          onClick={salvarProduto}
          disabled={salvando}
          className="rounded-xl bg-[#081E4A] px-8 py-3 text-white transition hover:bg-blue-900 disabled:opacity-50"
        >
          {salvando
            ? "Salvando..."
            : productId
              ? "Atualizar Produto"
              : "Salvar Produto"}
        </button>
      </div>
    </div>
  );
}