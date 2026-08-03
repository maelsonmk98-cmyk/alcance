import type { ProductFormData } from "./ProductForm";

type ProductCostsProps = {
  data: ProductFormData;
  updateField: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
};

export default function ProductCosts({
  data,
  updateField,
}: ProductCostsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 mt-6">

      <h2 className="text-2xl font-bold mb-6">
        💰 Custos
      </h2>

      <div className="grid grid-cols-2 gap-6">

        <div>
          <label className="block mb-2 font-medium">
            Custo do Produto
          </label>

          <input
            type="number"
            value={data.custo_produto ?? ""}
            onChange={(e) =>
              updateField("custo_produto", Number(e.target.value))
            }
            className="w-full border rounded-xl p-3"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Frete
          </label>

          <input
            type="number"
            value={data.frete ?? ""}
            onChange={(e) =>
              updateField("frete", Number(e.target.value))
            }
            className="w-full border rounded-xl p-3"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Embalagem
          </label>

          <input
            type="number"
            value={data.embalagem ?? ""}
            onChange={(e) =>
              updateField("embalagem", Number(e.target.value))
            }
            className="w-full border rounded-xl p-3"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Comissão (%)
          </label>

          <input
            type="number"
            value={data.comissao ?? ""}
            onChange={(e) =>
              updateField("comissao", Number(e.target.value))
            }
            className="w-full border rounded-xl p-3"
            placeholder="16"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Impostos
          </label>

          <input
            type="number"
            value={data.impostos ?? ""}
            onChange={(e) =>
              updateField("impostos", Number(e.target.value))
            }
            className="w-full border rounded-xl p-3"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Outras Despesas
          </label>

          <input
            type="number"
            value={data.outras_despesas ?? ""}
            onChange={(e) =>
              updateField("outras_despesas", Number(e.target.value))
            }
            className="w-full border rounded-xl p-3"
            placeholder="0,00"
          />
        </div>

      </div>

    </div>
  );
}