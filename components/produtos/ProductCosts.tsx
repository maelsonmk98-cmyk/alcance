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
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold">
        💰 Custos
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

        <div>
          <label className="mb-2 block font-medium">
            Custo do Produto
          </label>

          <input
            type="number"
            step="0.01"
            value={data.custo_produto ?? ""}
            onChange={(e) =>
              updateField(
                "custo_produto",
                Number(e.target.value)
              )
            }
            className="w-full rounded-xl border p-3"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Frete
          </label>

          <input
            type="number"
            step="0.01"
            value={data.frete ?? ""}
            onChange={(e) =>
              updateField(
                "frete",
                Number(e.target.value)
              )
            }
            className="w-full rounded-xl border p-3"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Embalagem
          </label>

          <input
            type="number"
            step="0.01"
            value={data.embalagem ?? ""}
            onChange={(e) =>
              updateField(
                "embalagem",
                Number(e.target.value)
              )
            }
            className="w-full rounded-xl border p-3"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Comissão (%)
          </label>

          <input
            type="number"
            step="0.01"
            value={data.comissao ?? ""}
            onChange={(e) =>
              updateField(
                "comissao",
                Number(e.target.value)
              )
            }
            className="w-full rounded-xl border p-3"
            placeholder="16"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Impostos (%)
          </label>

          <input
            type="number"
            step="0.01"
            value={data.impostos ?? ""}
            onChange={(e) =>
              updateField(
                "impostos",
                Number(e.target.value)
              )
            }
            className="w-full rounded-xl border p-3"
            placeholder="0"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Aços
          </label>

          <input
            type="number"
            step="0.01"
            value={data.acos ?? ""}
            onChange={(e) =>
              updateField(
                "acos",
                Number(e.target.value)
              )
            }
            className="w-full rounded-xl border p-3"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Promoção
          </label>

          <input
            type="number"
            step="0.01"
            value={data.promocao ?? ""}
            onChange={(e) =>
              updateField(
                "promocao",
                Number(e.target.value)
              )
            }
            className="w-full rounded-xl border p-3"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Outras Despesas
          </label>

          <input
            type="number"
            step="0.01"
            value={data.outras_despesas ?? ""}
            onChange={(e) =>
              updateField(
                "outras_despesas",
                Number(e.target.value)
              )
            }
            className="w-full rounded-xl border p-3"
            placeholder="0,00"
          />
        </div>

      </div>
    </div>
  );
}
