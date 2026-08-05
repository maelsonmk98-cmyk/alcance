"use client";

import { useState } from "react";

import ProductBasicInfo from "./ProductBasicInfo";
import ProductCosts from "./ProductCosts";
import ProductMarketplace from "./ProductMarketplace";
import ProductLogistics from "./ProductLogistics";
import ProductDescription from "./ProductDescription";
import ProductActions from "./ProductActions";

export type ProductFormData = {
  nome: string;
  sku: string;
  codigo_barras: string;
  categoria: string;
  marca: string;
  fornecedor: string;

  custo_produto: number;
  frete: number;
  embalagem: number;
  comissao: number;
  impostos: number;
  acos: number;
  promocao: number;
  outras_despesas: number;

  marketplace: string;
  tipo_anuncio: string;
  preco_venda: number;
  fulfillment: boolean;

  estoque: number;
  peso: number;
  altura: number;
  largura: number;
  comprimento: number;

  descricao: string;
  observacoes: string;
};

type ProductFormProps = {
  initialData?: ProductFormData;
  productId?: number;
};

const defaultFormData: ProductFormData = {
  nome: "",
  sku: "",
  codigo_barras: "",
  categoria: "",
  marca: "",
  fornecedor: "",

  custo_produto: 0,
  frete: 0,
  embalagem: 0,
  comissao: 16,
  impostos: 0,
  acos: 0,
  promocao: 0,
  outras_despesas: 0,

  marketplace: "Mercado Livre",
  tipo_anuncio: "Clássico",
  preco_venda: 0,
  fulfillment: false,

  estoque: 0,
  peso: 0,
  altura: 0,
  largura: 0,
  comprimento: 0,

  descricao: "",
  observacoes: "",
};

export default function ProductForm({
  initialData,
  productId,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>(
    initialData ?? defaultFormData
  );

  const updateField = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <ProductBasicInfo
        data={formData}
        updateField={updateField}
      />

      <ProductCosts
        data={formData}
        updateField={updateField}
      />

      <ProductMarketplace
        data={formData}
        updateField={updateField}
      />

      <ProductLogistics
        data={formData}
        updateField={updateField}
      />

      <ProductDescription
        data={formData}
        updateField={updateField}
      />

      <ProductActions
        data={formData}
        productId={productId}
      />
    </div>
  );
}
