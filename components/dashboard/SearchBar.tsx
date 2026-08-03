import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="relative w-96">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />

        <input
          type="text"
          placeholder="Buscar por SKU ou nome..."
          className="w-full border rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <button className="bg-[#081E4A] text-white px-6 py-3 rounded-xl hover:bg-blue-900 transition">
        + Novo Produto
      </button>
    </div>
  );
}