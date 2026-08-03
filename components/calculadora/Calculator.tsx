"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Produto = {
  id: number;
  sku: string | null;
  nome: string | null;
  categoria: string | null;
  custo: number | null;
  preco_venda: number | null;
  comissao: number | null;
  impostos: number | null;
  embalagem: number | null;
  frete: number | null;
  outras_despesas: number | null;
};

export default function Calculator() {
  const [sku, setSku] = useState("");
  const [produto, setProduto] = useState<Produto | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  const [precoVenda, setPrecoVenda] = useState(0);
  const [comissao, setComissao] = useState(0);
  const [tarifaFixa, setTarifaFixa] = useState(6.5);
  const [impostos, setImpostos] = useState(0);
  const [frete, setFrete] = useState(0);
  const [embalagem, setEmbalagem] = useState(0);
  const [outrasDespesas, setOutrasDespesas] = useState(0);

  async function buscarProduto() {
    const skuBusca = sku.trim();

    if (!skuBusca) {
      setErro("Digite um SKU para buscar.");
      setProduto(null);
      return;
    }

    setBuscando(true);
    setErro("");

    const { data, error } = await supabase
      .from("produtos")
      .select(
        "id, sku, nome, categoria, custo, preco_venda, comissao, impostos, embalagem, frete, outras_despesas"
      )
      .eq("sku", skuBusca)
      .maybeSingle();

    if (error) {
      console.error(error);
      setErro("Erro ao buscar produto: " + error.message);
      setProduto(null);
      setBuscando(false);
      return;
    }

    if (!data) {
      setErro("Produto não encontrado para este SKU.");
      setProduto(null);
      setBuscando(false);
      return;
    }

    setProduto(data);

    setPrecoVenda(Number(data.preco_venda ?? 0));
    setComissao(Number(data.comissao ?? 0));
    setImpostos(Number(data.impostos ?? 0));
    setFrete(Number(data.frete ?? 0));
    setEmbalagem(Number(data.embalagem ?? 0));
    setOutrasDespesas(Number(data.outras_despesas ?? 0));

    setBuscando(false);
  }

  const custo = Number(produto?.custo ?? 0);

  const valorComissao = precoVenda * (comissao / 100);
  const valorImpostos = precoVenda * (impostos / 100);

  const lucro =
    precoVenda -
    custo -
    valorComissao -
    tarifaFixa -
    valorImpostos -
    frete -
    embalagem -
    outrasDespesas;

  const margem =
    precoVenda > 0
      ? (lucro / precoVenda) * 100
      : 0;

  const roi =
    custo > 0
      ? (lucro / custo) * 100
      : 0;

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">
          🧮 Calculadora de Custos
        </h2>

        <p className="text-gray-500 mt-1">
          Busque um produto pelo SKU para calcular sua margem.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              buscarProduto();
            }
          }}
          placeholder="Digite o SKU..."
          className="border rounded-xl px-4 py-3 flex-1"
        />

        <button
          type="button"
          onClick={buscarProduto}
          disabled={buscando}
          className="bg-[#081E4A] text-white px-6 py-3 rounded-xl hover:bg-blue-900 transition disabled:opacity-50"
        >
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {erro && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600">
          {erro}
        </div>
      )}

      {produto && (
        <>
          <div className="border rounded-xl p-5">
            <h3 className="font-semibold text-lg">
              {produto.nome || "Produto sem nome"}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <span className="text-gray-500">SKU</span>
                <p className="font-medium">
                  {produto.sku || "-"}
                </p>
              </div>

              <div>
                <span className="text-gray-500">Categoria</span>
                <p className="font-medium">
                  {produto.categoria || "-"}
                </p>
              </div>

              <div>
                <span className="text-gray-500">
                  Custo do produto
                </span>
                <p className="font-medium">
                  {formatarMoeda(custo)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Preço de Venda
              </label>

              <input
                type="number"
                step="0.01"
                value={precoVenda}
                onChange={(e) =>
                  setPrecoVenda(Number(e.target.value))
                }
                className="border rounded-xl px-4 py-3 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Comissão (%)
              </label>

              <input
                type="number"
                step="0.01"
                value={comissao}
                onChange={(e) =>
                  setComissao(Number(e.target.value))
                }
                className="border rounded-xl px-4 py-3 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tarifa Fixa
              </label>

              <input
                type="number"
                step="0.01"
                value={tarifaFixa}
                onChange={(e) =>
                  setTarifaFixa(Number(e.target.value))
                }
                className="border rounded-xl px-4 py-3 w-full"
              />

              <p className="text-xs text-gray-500 mt-1">
                Valor padrão: R$ 6,50
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Impostos (%)
              </label>

              <input
                type="number"
                step="0.01"
                value={impostos}
                onChange={(e) =>
                  setImpostos(Number(e.target.value))
                }
                className="border rounded-xl px-4 py-3 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Frete
              </label>

              <input
                type="number"
                step="0.01"
                value={frete}
                onChange={(e) =>
                  setFrete(Number(e.target.value))
                }
                className="border rounded-xl px-4 py-3 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Embalagem
              </label>

              <input
                type="number"
                step="0.01"
                value={embalagem}
                onChange={(e) =>
                  setEmbalagem(Number(e.target.value))
                }
                className="border rounded-xl px-4 py-3 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Outras Despesas
              </label>

              <input
                type="number"
                step="0.01"
                value={outrasDespesas}
                onChange={(e) =>
                  setOutrasDespesas(Number(e.target.value))
                }
                className="border rounded-xl px-4 py-3 w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                Lucro Líquido
              </p>

              <p
                className={`text-2xl font-bold ${
                  lucro >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatarMoeda(lucro)}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                Margem
              </p>

              <p
                className={`text-2xl font-bold ${
                  margem >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {margem.toFixed(2)}%
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                ROI
              </p>

              <p
                className={`text-2xl font-bold ${
                  roi >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {roi.toFixed(2)}%
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}