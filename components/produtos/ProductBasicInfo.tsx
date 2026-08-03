"use client";

import { ProductFormData } from "./ProductForm";

type Props = {
  data: ProductFormData;
  updateField: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
};

export default function ProductBasicInfo({
  data,
  updateField,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">

      <h2 className="text-2xl font-bold mb-6">
        📦 Informações Básicas
      </h2>

      <div className="grid grid-cols-2 gap-6">

        <div>
          <label className="block mb-2 font-medium">
            Nome do Produto
          </label>

          <input
            value={data.nome}
            onChange={(e) => updateField("nome", e.target.value)}
            className="w-full border rounded-xl p-3"
            placeholder="Digite o nome do produto"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            SKU
          </label>

          <input
            value={data.sku}
            onChange={(e) => updateField("sku", e.target.value)}
            className="w-full border rounded-xl p-3"
            placeholder="ALC-001"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Código de Barras
          </label>

          <input
            value={data.codigo_barras}
            onChange={(e) =>
              updateField("codigo_barras", e.target.value)
            }
            className="w-full border rounded-xl p-3"
            placeholder="7890000000000"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Categoria
          </label>

          <input
            value={data.categoria}
            onChange={(e) =>
              updateField("categoria", e.target.value)
            }
            className="w-full border rounded-xl p-3"
            placeholder="Eletrônicos"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Marca
          </label>

          <input
            value={data.marca}
            onChange={(e) =>
              updateField("marca", e.target.value)
            }
            className="w-full border rounded-xl p-3"
            placeholder="Ex.: Logitech"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Fornecedor
          </label>

          <input
            value={data.fornecedor}
            onChange={(e) =>
              updateField("fornecedor", e.target.value)
            }
            className="w-full border rounded-xl p-3"
            placeholder="Nome do fornecedor"
          />
        </div>

      </div>
    </div>
  );
}