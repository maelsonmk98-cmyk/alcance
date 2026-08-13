"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import MainLayout from "@/components/layout/MainLayout";
import ProductForm, {
  ProductFormData,
} from "@/components/produtos/ProductForm";

import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  RefreshCw,
  Package,
} from "lucide-react";

export default function EditarProduto() {
  const params = useParams();
  const router = useRouter();

  const id = params.id;

  const productId = Number(
    Array.isArray(id) ? id[0] : id
  );

  const [initialData, setInitialData] =
    useState<ProductFormData | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarProduto() {
      setCarregando(true);
      setErro("");

      if (
        !Number.isInteger(productId) ||
        productId <= 0
      ) {
        setErro("Produto inválido.");
        setCarregando(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error(
          "Erro ao verificar usuário:",
          userError
        );

        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("id", productId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao carregar produto:",
          error
        );

        setErro(
          "Erro ao carregar o produto: " +
            error.message
        );

        setCarregando(false);
        return;
      }

      if (!data) {
        setErro(
          "Produto não encontrado ou você não possui acesso a este produto."
        );

        setCarregando(false);
        return;
      }

      const produtoFormatado: ProductFormData = {
        nome: data.nome ?? "",
        sku: data.sku ?? "",

        codigo_barras:
          data.codigo_barras ?? "",

        numero_original:
          data.numero_original ?? "",

        categoria:
          data.categoria ?? "",

        marca:
          data.marca ?? "",

        fornecedor:
          data.fornecedor ?? "",

        custo_produto: Number(
          data.custo ?? 0
        ),

        frete: Number(
          data.frete ?? 0
        ),

        embalagem: Number(
          data.embalagem ?? 0
        ),

        comissao: Number(
          data.comissao ?? 0
        ),

        impostos: Number(
          data.impostos ?? 0
        ),

        acos: Number(
          data.acos ?? 0
        ),

        promocao: Number(
          data.promocao ?? 0
        ),

        outras_despesas: Number(
          data.outras_despesas ?? 0
        ),

        marketplace:
          data.marketplace ??
          "Mercado Livre",

        tipo_anuncio:
          data.tipo_anuncio ??
          "Clássico",

        preco_venda: Number(
          data.preco_venda ?? 0
        ),

        fulfillment: Boolean(
          data.fulfillment
        ),

        estoque: Number(
          data.estoque ?? 0
        ),

        peso: Number(
          data.peso ?? 0
        ),

        altura: Number(
          data.altura ?? 0
        ),

        largura: Number(
          data.largura ?? 0
        ),

        comprimento: Number(
          data.comprimento ?? 0
        ),

        descricao:
          data.descricao ?? "",

        observacoes:
          data.observacoes ?? "",
      };

      setInitialData(produtoFormatado);
      setCarregando(false);
    }

    carregarProduto();
  }, [productId, router]);

  return (
    <MainLayout>
      <div className="-m-6 min-h-[calc(100vh-64px)] bg-[#F4F7FB] p-6 lg:-m-8 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          {/* Voltar */}

          <button
            type="button"
            onClick={() =>
              router.push("/produtos")
            }
            className="mb-5 flex items-center gap-2 text-[11px] font-semibold text-slate-500 transition hover:text-[#071E49]"
          >
            <ArrowLeft size={14} />

            Voltar para produtos
          </button>

          {/* Cabeçalho */}

          <div className="mb-7 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white px-7 py-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)] lg:flex-row lg:items-center lg:justify-between">
            <div>
              {/* Breadcrumb */}

              <div className="flex items-center gap-2 text-[10px] font-semibold">
                <span className="text-slate-400">
                  Alcance
                </span>

                <span className="text-slate-300">
                  /
                </span>

                <span className="text-slate-400">
                  Produtos
                </span>

                <span className="text-slate-300">
                  /
                </span>

                <span className="text-[#071E49]">
                  Editar
                </span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#071E49]/[0.06]">
                  <Package
                    size={19}
                    className="text-[#071E49]"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-900">
                    Editar Produto
                  </h1>

                  <p className="mt-1 text-[12px] text-slate-500">
                    Atualize as informações, custos,
                    estoque e número original do produto.
                  </p>
                </div>
              </div>
            </div>

            {/* Identificação */}

            {!carregando &&
              !erro &&
              initialData && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      SKU
                    </p>

                    <p className="mt-0.5 font-mono text-[12px] font-bold text-[#071E49]">
                      {initialData.sku || "-"}
                    </p>
                  </div>

                  <div className="h-8 w-px bg-slate-200" />

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Número Original
                    </p>

                    <p
                      className="mt-0.5 max-w-[180px] truncate font-mono text-[11px] font-semibold text-slate-600"
                      title={
                        initialData.numero_original
                      }
                    >
                      {initialData.numero_original ||
                        "Não informado"}
                    </p>
                  </div>
                </div>
              )}
          </div>

          {/* Loading */}

          {carregando && (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#071E49]/[0.06]">
                <RefreshCw
                  size={20}
                  className="animate-spin text-[#071E49]"
                />
              </div>

              <p className="mt-4 text-[12px] text-slate-400">
                Carregando produto...
              </p>
            </div>
          )}

          {/* Erro */}

          {!carregando && erro && (
            <div className="rounded-2xl border border-red-100 bg-white p-7 shadow-sm">
              <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                <p className="text-sm font-semibold text-red-600">
                  Não foi possível abrir este produto
                </p>

                <p className="mt-2 text-[11px] leading-5 text-red-500">
                  {erro}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push("/produtos")
                }
                className="mt-5 rounded-xl bg-[#F47B20] px-5 py-2.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#E96F17]"
              >
                Voltar para Produtos
              </button>
            </div>
          )}

          {/* Formulário */}

          {!carregando &&
            !erro &&
            initialData && (
              <div className="pb-8">
                <ProductForm
                  initialData={initialData}
                  productId={productId}
                />
              </div>
            )}
        </div>
      </div>
    </MainLayout>
  );
}