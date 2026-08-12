"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [busca, setBusca] = useState("");
  const router = useRouter();

  function pesquisar() {
    const termo = busca.trim();

    if (!termo) return;

    router.push(
      `/produtos?busca=${encodeURIComponent(termo)}`
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      {/* BUSCA */}
      <div
        className="
          group
          flex
          h-[42px]
          w-full
          max-w-[440px]
          items-center
          gap-3
          rounded-[12px]
          border
          border-[#243b5a]
          bg-[#0d1b2f]
          px-4
          shadow-[0_5px_18px_rgba(0,0,0,0.12)]
          transition-all
          duration-200
          focus-within:border-blue-500/60
          focus-within:bg-[#10213a]
          focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]
        "
      >
        <Search
          size={16}
          strokeWidth={2}
          className="
            shrink-0
            text-slate-500
            transition-colors
            group-focus-within:text-blue-400
          "
        />

        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              pesquisar();
            }
          }}
          placeholder="Buscar por SKU ou nome..."
          className="
            h-full
            min-w-0
            flex-1
            bg-transparent
            text-[12px]
            font-medium
            text-slate-200
            outline-none
            placeholder:text-slate-600
          "
        />

        {busca && (
          <button
            type="button"
            onClick={() => setBusca("")}
            className="
              flex
              h-5
              w-5
              items-center
              justify-center
              rounded-md
              text-[13px]
              text-slate-600
              transition
              hover:bg-[#172a45]
              hover:text-slate-300
            "
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}