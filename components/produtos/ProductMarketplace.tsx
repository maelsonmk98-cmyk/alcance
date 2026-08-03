import type { ProductFormData } from "./ProductForm";

type ProductMarketplaceProps = {
  data: ProductFormData;
  updateField: (
    field: string,
    value: string | number | boolean
  ) => void;
};

export default function ProductMarketplace({
  data,
  updateField,
}: ProductMarketplaceProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 mt-6">

      <h2 className="text-2xl font-bold mb-6">
        🛒 Marketplace
      </h2>

      <div className="grid grid-cols-2 gap-6">

        <div>
          <label className="block mb-2 font-medium">
            Marketplace
          </label>

          <select
            value={data.marketplace}
            onChange={(e) =>
              updateField("marketplace", e.target.value)
            }
            className="w-full border rounded-xl p-3"
          >
            <option>Mercado Livre</option>
            <option>Shopee</option>
            <option>Amazon</option>
            <option>Magalu</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Tipo de Anúncio
          </label>

          <select
            value={data.tipo_anuncio}
            onChange={(e) =>
              updateField("tipo_anuncio", e.target.value)
            }
            className="w-full border rounded-xl p-3"
          >
            <option>Clássico</option>
            <option>Premium</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Preço de Venda
          </label>

          <input
            type="number"
            value={data.preco_venda}
            onChange={(e) =>
              updateField(
                "preco_venda",
                Number(e.target.value)
              )
            }
            className="w-full border rounded-xl p-3"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Fulfillment
          </label>

          <select
            value={data.fulfillment ? "Sim" : "Não"}
            onChange={(e) =>
              updateField(
                "fulfillment",
                e.target.value === "Sim"
              )
            }
            className="w-full border rounded-xl p-3"
          >
            <option>Não</option>
            <option>Sim</option>
          </select>
        </div>

      </div>

    </div>
  );
}