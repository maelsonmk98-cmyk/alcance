import { notFound } from "next/navigation";

import MainLayout from "@/components/layout/MainLayout";
import ProductForm, {
  ProductFormData,
} from "@/components/produtos/ProductForm";

import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarProduto({
  params,
}: Props) {
  const { id } = await params;

  const productId = Number(id);

  if (!Number.isInteger(productId)) {
    notFound();
  }

  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", productId)
    .single();

  if (error || !data) {
    notFound();
  }

  const initialData: ProductFormData = {
    nome: data.nome ?? "",
    sku: data.sku ?? "",
    codigo_barras: data.codigo_barras ?? "",
    categoria: data.categoria ?? "",
    marca: data.marca ?? "",
    fornecedor: data.fornecedor ?? "",

    custo_produto: Number(data.custo ?? 0),
    frete: Number(data.frete ?? 0),
    embalagem: Number(data.embalagem ?? 0),
    comissao: Number(data.comissao ?? 0),
    impostos: Number(data.impostos ?? 0),
    outras_despesas: Number(data.outras_despesas ?? 0),

    marketplace: data.marketplace ?? "Mercado Livre",
    tipo_anuncio: data.tipo_anuncio ?? "Clássico",
    preco_venda: Number(data.preco_venda ?? 0),
    fulfillment: Boolean(data.fulfillment),

    estoque: Number(data.estoque ?? 0),
    peso: Number(data.peso ?? 0),
    altura: Number(data.altura ?? 0),
    largura: Number(data.largura ?? 0),
    comprimento: Number(data.comprimento ?? 0),

    descricao: data.descricao ?? "",
    observacoes: data.observacoes ?? "",
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          ✏️ Editar Produto
        </h1>

        <p className="text-gray-500">
          Altere as informações do produto e salve as mudanças.
        </p>
      </div>

      <ProductForm
        initialData={initialData}
        productId={productId}
      />
    </MainLayout>
  );
}
