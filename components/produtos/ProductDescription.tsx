import type { ProductFormData } from "./ProductForm";

type ProductDescriptionProps = {
  data: ProductFormData;
  updateField: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
};

export default function ProductDescription({
  data,
  updateField,
}: ProductDescriptionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 mt-6">
      <h2 className="text-2xl font-bold mb-6">
        📝 Informações Adicionais
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block mb-2 font-medium">
            Descrição do Produto
          </label>

          <textarea
            rows={5}
            value={data.descricao}
            onChange={(e) =>
              updateField("descricao", e.target.value)
            }
            className="w-full border rounded-xl p-3"
            placeholder="Descreva o produto..."
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Observações
          </label>

          <textarea
            rows={3}
            value={data.observacoes}
            onChange={(e) =>
              updateField("observacoes", e.target.value)
            }
            className="w-full border rounded-xl p-3"
            placeholder="Informações internas..."
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Imagem do Produto
          </label>

          <input
            type="file"
            className="w-full border rounded-xl p-3"
          />
        </div>
      </div>
    </div>
  );
}