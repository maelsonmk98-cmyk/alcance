export default function ProductTable() {
  const produtos = [
    {
      sku: "ALC-001",
      nome: "Headset Gamer HyperX Cloud II",
      custo: "R$ 350,00",
      venda: "R$ 599,90",
      margem: "35,42%",
    },
    {
      sku: "ALC-002",
      nome: "Teclado Redragon K552",
      custo: "R$ 210,00",
      venda: "R$ 399,90",
      margem: "33,18%",
    },
    {
      sku: "ALC-003",
      nome: "Mouse Logitech G403",
      custo: "R$ 180,00",
      venda: "R$ 329,90",
      margem: "31,52%",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm mt-6 p-6">
      <h2 className="text-xl font-bold mb-4">
        Produtos Recentes
      </h2>

      <table className="w-full">
        <thead>
          <tr className="text-left border-b">
            <th className="pb-3">SKU</th>
            <th>Produto</th>
            <th>Custo</th>
            <th>Venda</th>
            <th>Margem</th>
          </tr>
        </thead>

        <tbody>
          {produtos.map((produto) => (
            <tr
              key={produto.sku}
              className="border-b hover:bg-gray-50"
            >
              <td className="py-4">{produto.sku}</td>
              <td>{produto.nome}</td>
              <td>{produto.custo}</td>
              <td>{produto.venda}</td>
              <td className="text-green-600 font-semibold">
                {produto.margem}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}