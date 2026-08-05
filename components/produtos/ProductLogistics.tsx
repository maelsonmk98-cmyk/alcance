import type { ProductFormData } from "./ProductForm";

type ProductLogisticsProps = {
  data: ProductFormData;
  updateField: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
};

export default function ProductLogistics({
  data,
  updateField,
}: ProductLogisticsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 mt-6">
      <h2 className="text-2xl font-bold mb-6">
        📦 Logística
      </h2>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 font-medium">
            Quantidade em Estoque
          </label>

          <input
            type="number"
            value={data.estoque}
            onChange={(e) =>
              updateField("estoque", Number(e.target.value))
            }
            className="w-full border rounded-xl p-3"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Peso (kg)
          </label>

          <input
            type="number"
            step="0.001"
            value={data.peso}
            onChange={(e) =>
              updateField("peso", Number(e.target.value))
            }
            className="w-full border rounded-xl p-3"
            placeholder="0.000"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Altura (cm)
          </label>

          <input
            type="number"
            value={data.altura}
            onChange={(e) =>
              updateField("altura", Number(e.target.value))
            }
            className="w-full border rounded-xl p-3"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Largura (cm)
          </label>

          <input
            type="number"
            value={data.largura}
            onChange={(e) =>
              updateField("largura", Number(e.target.value))
            }
            className="w-full border rounded-xl p-3"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Comprimento (cm)
          </label>

          <input
            type="number"
            value={data.comprimento}
            onChange={(e) =>
              updateField("comprimento", Number(e.target.value))
            }
            className="w-full border rounded-xl p-3"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}