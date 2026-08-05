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
      const produto = {
        nome: data.nome,
        sku: data.sku,
        codigo_barras: data.codigo_barras || null,
        categoria: data.categoria || null,
        marca: data.marca || null,
        fornecedor: data.fornecedor || null,

        custo: data.custo_produto,
        frete: data.frete,
        embalagem: data.embalagem,
        comissao: data.comissao,
        impostos: data.impostos,
        acos: data.acos,
        promocao: data.promocao,
        outras_despesas: data.outras_despesas,

        marketplace: data.marketplace,
        tipo_anuncio: data.tipo_anuncio,
        preco_venda: data.preco_venda,
        fulfillment: data.fulfillment,

        estoque: data.estoque,
        peso: data.peso,
        altura: data.altura,
        largura: data.largura,
        comprimento: data.comprimento,

        descricao: data.descricao || null,
        observacoes: data.observacoes || null,
      };

      let error;

      if (productId) {
        const resultado = await supabase
          .from("produtos")
          .update(produto)
          .eq("id", productId);

        error = resultado.error;
      } else {
        const resultado = await supabase
          .from("produtos")
          .insert([produto]);

        error = resultado.error;
      }

      if (error) {
        console.error(error);

        setMensagem(
          "Erro ao salvar o produto: " + error.message
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
