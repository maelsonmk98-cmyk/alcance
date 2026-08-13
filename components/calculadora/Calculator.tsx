"use client";

import { useState } from "react";
import {
  Search,
  Package,
  DollarSign,
  Percent,
  Truck,
  Box,
  Receipt,
  Wallet,
  TrendingUp,
  RotateCcw,
  Calculator as CalculatorIcon,
} from "lucide-react";
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
  acos: number | null;
  promocao: number | null;

  embalagem: number | null;
  frete: number | null;
  outras_despesas: number | null;
};

type Modo = "produto" | "manual";

export default function Calculator() {
  const [modo, setModo] = useState<Modo>("produto");

  const [sku, setSku] = useState("");
  const [produto, setProduto] = useState<Produto | null>(null);

  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  const [nomeManual, setNomeManual] = useState("");

  const [custo, setCusto] = useState(0);
  const [precoVenda, setPrecoVenda] = useState(0);

  const [comissao, setComissao] = useState(0);
  const [tarifaFixa, setTarifaFixa] = useState(6.5);
  const [impostos, setImpostos] = useState(0);

  const [acos, setAcos] = useState(0);
  const [promocao, setPromocao] = useState(0);

  const [frete, setFrete] = useState(0);
  const [embalagem, setEmbalagem] = useState(0);

  const [outrasDespesas, setOutrasDespesas] =
    useState(0);

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
        `
        id,
        sku,
        nome,
        categoria,
        custo,
        preco_venda,
        comissao,
        impostos,
        acos,
        promocao,
        embalagem,
        frete,
        outras_despesas
        `
      )
      .eq("sku", skuBusca)
      .maybeSingle();

    if (error) {
      console.error(error);

      setErro(
        "Erro ao buscar produto: " +
          error.message
      );

      setProduto(null);
      setBuscando(false);

      return;
    }

    if (!data) {
      setErro(
        "Produto não encontrado para este SKU."
      );

      setProduto(null);
      setBuscando(false);

      return;
    }

    setProduto(data);

    setCusto(
      Number(data.custo ?? 0)
    );

    setPrecoVenda(
      Number(
        data.preco_venda ?? 0
      )
    );

    setComissao(
      Number(
        data.comissao ?? 0
      )
    );

    setImpostos(
      Number(
        data.impostos ?? 0
      )
    );

    setAcos(
      Number(data.acos ?? 0)
    );

    setPromocao(
      Number(
        data.promocao ?? 0
      )
    );

    setFrete(
      Number(data.frete ?? 0)
    );

    setEmbalagem(
      Number(
        data.embalagem ?? 0
      )
    );

    setOutrasDespesas(
      Number(
        data.outras_despesas ??
          0
      )
    );

    setBuscando(false);
  }

  function ativarModoManual() {
    setModo("manual");
    setProduto(null);
    setErro("");
  }

  function ativarModoProduto() {
    setModo("produto");
    setErro("");
  }

  function limparCalculadora() {
    setSku("");
    setProduto(null);
    setErro("");
    setNomeManual("");

    setCusto(0);
    setPrecoVenda(0);

    setComissao(0);
    setTarifaFixa(6.5);
    setImpostos(0);

    setAcos(0);
    setPromocao(0);

    setFrete(0);
    setEmbalagem(0);
    setOutrasDespesas(0);
  }

  const valorComissao =
    precoVenda *
    (comissao / 100);

  const valorImpostos =
    precoVenda *
    (impostos / 100);

  const valorAcOS =
    precoVenda *
    (acos / 100);

  const valorPromocao =
    precoVenda *
    (promocao / 100);

  const lucro =
    precoVenda -
    custo -
    valorComissao -
    tarifaFixa -
    valorImpostos -
    valorAcOS -
    valorPromocao -
    frete -
    embalagem -
    outrasDespesas;

  const margem =
    precoVenda > 0
      ? (lucro / precoVenda) *
        100
      : 0;

  const roi =
    custo > 0
      ? (lucro / custo) * 100
      : 0;

  const totalCustos =
    custo +
    valorComissao +
    tarifaFixa +
    valorImpostos +
    valorAcOS +
    valorPromocao +
    frete +
    embalagem +
    outrasDespesas;

  function formatarMoeda(
    valor: number
  ) {
    return valor.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  function campoClasse() {
    return "h-11 w-full rounded-xl border border-[#213A57] bg-[#0D223B] px-3.5 text-[12px] font-medium text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-[#315678] focus:ring-4 focus:ring-blue-500/[0.04]";
  }

  return (
    <div className="space-y-5">
      {/* =====================================================
          MODO DA CALCULADORA
      ===================================================== */}

      <div className="rounded-2xl border border-[#1B3352] bg-[#091B30] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
        <div>
          <h2 className="text-[15px] font-bold text-white">
            Como deseja calcular?
          </h2>

          <p className="mt-1 text-[10px] text-slate-500">
            Use um produto cadastrado ou faça uma simulação manual.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={ativarModoProduto}
            className={[
              "rounded-xl border p-4 text-left transition",
              modo === "produto"
                ? "border-[#F47B20] bg-orange-500/[0.06]"
                : "border-[#1B3352] bg-[#0D223B] hover:bg-white/[0.025]",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Search
                  size={18}
                  className="text-blue-400"
                />
              </div>

              <div>
                <p className="text-[12px] font-bold text-slate-100">
                  Produto cadastrado
                </p>

                <p className="mt-0.5 text-[10px] text-slate-500">
                  Buscar automaticamente pelo SKU.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={ativarModoManual}
            className={[
              "rounded-xl border p-4 text-left transition",
              modo === "manual"
                ? "border-[#F47B20] bg-orange-500/[0.06]"
                : "border-[#1B3352] bg-[#0D223B] hover:bg-white/[0.025]",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <CalculatorIcon
                  size={18}
                  className="text-violet-400"
                />
              </div>

              <div>
                <p className="text-[12px] font-bold text-slate-100">
                  Cálculo manual
                </p>

                <p className="mt-0.5 text-[10px] text-slate-500">
                  Calcule sem cadastrar um produto.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* =====================================================
          BUSCA
      ===================================================== */}

      {modo === "produto" && (
        <div className="rounded-2xl border border-[#1B3352] bg-[#091B30] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
            <div className="flex-1">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <Search
                    size={16}
                    className="text-blue-400"
                  />
                </div>

                <div>
                  <h2 className="text-[12px] font-bold text-white">
                    Buscar produto
                  </h2>

                  <p className="text-[10px] text-slate-500">
                    Informe o SKU para carregar os dados cadastrados.
                  </p>
                </div>
              </div>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="text"
                  value={sku}
                  onChange={(e) =>
                    setSku(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter"
                    ) {
                      buscarProduto();
                    }
                  }}
                  placeholder="Digite o SKU do produto..."
                  className={`${campoClasse()} pl-10`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={buscarProduto}
              disabled={buscando}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F47B20] px-6 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(244,123,32,0.18)] transition hover:bg-[#FF861F] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search size={16} />

              {buscando
                ? "Buscando..."
                : "Buscar produto"}
            </button>
          </div>

          {erro && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[11px] font-medium text-red-300">
              {erro}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          MANUAL
      ===================================================== */}

      {modo === "manual" && (
        <div className="rounded-2xl border border-[#1B3352] bg-[#091B30] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <CalculatorIcon
                size={18}
                className="text-violet-400"
              />
            </div>

            <div>
              <h2 className="text-[12px] font-bold text-white">
                Cálculo manual
              </h2>

              <p className="text-[10px] text-slate-500">
                Preencha os valores abaixo para fazer uma simulação.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-slate-400">
                Nome do produto
                <span className="ml-1 font-normal text-slate-600">
                  (opcional)
                </span>
              </label>

              <input
                type="text"
                value={nomeManual}
                onChange={(e) =>
                  setNomeManual(
                    e.target.value
                  )
                }
                placeholder="Ex.: Headset Gamer"
                className={campoClasse()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-slate-400">
                SKU
                <span className="ml-1 font-normal text-slate-600">
                  (opcional)
                </span>
              </label>

              <input
                type="text"
                value={sku}
                onChange={(e) =>
                  setSku(
                    e.target.value
                  )
                }
                placeholder="Ex.: ALC-001"
                className={campoClasse()}
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          PRODUTO SELECIONADO
      ===================================================== */}

      {modo === "produto" &&
        produto && (
          <div className="rounded-2xl border border-[#1B3352] bg-[#091B30] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                  <Package
                    size={21}
                    className="text-blue-400"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                    Produto selecionado
                  </p>

                  <h2 className="mt-1 truncate text-[16px] font-bold tracking-tight text-white">
                    {produto.nome ||
                      "Produto sem nome"}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  limparCalculadora
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-[#213A57] px-4 py-2.5 text-[10px] font-semibold text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
              >
                <RotateCcw size={14} />
                Limpar
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#17304D] pt-5 md:grid-cols-3">
              <Info
                label="SKU"
                valor={
                  produto.sku || "-"
                }
              />

              <Info
                label="Categoria"
                valor={
                  produto.categoria ||
                  "-"
                }
              />

              <Info
                label="Custo do produto"
                valor={formatarMoeda(
                  custo
                )}
              />
            </div>
          </div>
        )}

      {/* =====================================================
          DADOS DA OPERAÇÃO
      ===================================================== */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#1B3352] bg-[#091B30] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <DollarSign
                size={17}
                className="text-blue-400"
              />
            </div>

            <div>
              <h2 className="text-[12px] font-bold text-white">
                Dados da venda
              </h2>

              <p className="text-[10px] text-slate-500">
                Configure os valores da operação.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CampoNumero
              label="Preço de venda"
              value={precoVenda}
              setValue={
                setPrecoVenda
              }
              icon={
                <DollarSign
                  size={15}
                />
              }
            />

            <CampoNumero
              label="Comissão (%)"
              value={comissao}
              setValue={
                setComissao
              }
              icon={
                <Percent
                  size={14}
                />
              }
              ajuda="Percentual sobre o valor da venda."
            />

            <CampoNumero
              label="Tarifa fixa"
              value={tarifaFixa}
              setValue={
                setTarifaFixa
              }
              ajuda="Valor padrão: R$ 6,50"
            />

            <CampoNumero
              label="Custo do produto"
              value={custo}
              setValue={setCusto}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#1B3352] bg-[#091B30] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
              <Wallet
                size={17}
                className="text-orange-400"
              />
            </div>

            <div>
              <h2 className="text-[12px] font-bold text-white">
                Outros custos
              </h2>

              <p className="text-[10px] text-slate-500">
                Despesas adicionais da operação.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CampoNumero
              label="Impostos (%)"
              value={impostos}
              setValue={
                setImpostos
              }
              icon={
                <Percent
                  size={12}
                />
              }
              ajuda="Percentual sobre o valor da venda."
            />

            <CampoNumero
              label="ACOS (%)"
              value={acos}
              setValue={setAcos}
              icon={
                <Percent
                  size={12}
                />
              }
              ajuda="Percentual sobre o valor da venda."
            />

            <CampoNumero
              label="Promoção (%)"
              value={promocao}
              setValue={
                setPromocao
              }
              icon={
                <Percent
                  size={12}
                />
              }
              ajuda="Percentual sobre o valor da venda."
            />

            <CampoNumero
              label="Frete"
              value={frete}
              setValue={setFrete}
              icon={
                <Truck
                  size={12}
                />
              }
            />

            <CampoNumero
              label="Embalagem"
              value={embalagem}
              setValue={
                setEmbalagem
              }
              icon={
                <Box size={12} />
              }
            />

            <CampoNumero
              label="Outras despesas"
              value={
                outrasDespesas
              }
              setValue={
                setOutrasDespesas
              }
              icon={
                <Receipt
                  size={12}
                />
              }
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          RESUMO DOS PERCENTUAIS
      ===================================================== */}

      <div className="rounded-2xl border border-[#1B3352] bg-[#091B30] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
        <div className="mb-5">
          <h2 className="text-[12px] font-bold text-white">
            Resumo dos percentuais
          </h2>

          <p className="mt-1 text-[10px] text-slate-500">
            Valores calculados automaticamente sobre o preço de venda.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ResumoPercentual
            titulo="Comissão"
            valor={formatarMoeda(
              valorComissao
            )}
            percentual={comissao}
          />

          <ResumoPercentual
            titulo="Impostos"
            valor={formatarMoeda(
              valorImpostos
            )}
            percentual={impostos}
          />

          <ResumoPercentual
            titulo="ACOS"
            valor={formatarMoeda(
              valorAcOS
            )}
            percentual={acos}
          />

          <ResumoPercentual
            titulo="Promoção"
            valor={formatarMoeda(
              valorPromocao
            )}
            percentual={promocao}
          />
        </div>
      </div>

      {/* =====================================================
          RESULTADO
      ===================================================== */}

      <div className="rounded-2xl border border-[#1B3352] bg-[#091B30] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <CalculatorIcon
                size={17}
                className="text-emerald-400"
              />
            </div>

            <div>
              <h2 className="text-[12px] font-bold text-white">
                Resultado da análise
              </h2>

              <p className="text-[10px] text-slate-500">
                Resultado calculado com os valores informados.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              limparCalculadora
            }
            className="flex items-center gap-2 rounded-xl border border-[#213A57] px-4 py-2.5 text-[10px] font-semibold text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
          >
            <RotateCcw
              size={14}
            />

            Limpar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ResultadoCard
            titulo="Total de custos"
            valor={formatarMoeda(
              totalCustos
            )}
            tipo="neutral"
            icon={
              <Wallet
                size={16}
              />
            }
          />

          <ResultadoCard
            titulo="Lucro líquido"
            valor={formatarMoeda(
              lucro
            )}
            tipo={
              lucro >= 0
                ? "green"
                : "red"
            }
            icon={
              <DollarSign
                size={16}
              />
            }
          />

          <ResultadoCard
            titulo="Margem"
            valor={`${margem.toFixed(
              2
            )}%`}
            tipo={
              margem >= 0
                ? "blue"
                : "red"
            }
            icon={
              <Percent
                size={16}
              />
            }
          />

          <ResultadoCard
            titulo="ROI"
            valor={`${roi.toFixed(
              2
            )}%`}
            tipo={
              roi >= 0
                ? "orange"
                : "red"
            }
            icon={
              <TrendingUp
                size={16}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}

function CampoNumero({
  label,
  value,
  setValue,
  icon,
  ajuda,
}: {
  label: string;
  value: number;
  setValue: (
    value: number
  ) => void;
  icon?: React.ReactNode;
  ajuda?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
        {icon}
        {label}
      </label>

      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) =>
          setValue(
            Number(
              e.target.value
            )
          )
        }
        className="h-11 w-full rounded-xl border border-[#213A57] bg-[#0D223B] px-3.5 text-[12px] font-medium text-slate-200 outline-none transition focus:border-[#315678] focus:ring-4 focus:ring-blue-500/[0.04]"
      />

      {ajuda && (
        <p className="mt-1 text-[9px] text-slate-600">
          {ajuda}
        </p>
      )}
    </div>
  );
}

function Info({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-[11px] font-semibold text-slate-300">
        {valor}
      </p>
    </div>
  );
}

function ResumoPercentual({
  titulo,
  valor,
  percentual,
}: {
  titulo: string;
  valor: string;
  percentual: number;
}) {
  return (
    <div className="rounded-xl border border-[#1B3352] bg-[#0D223B] p-4">
      <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 text-[13px] font-bold text-white">
        {valor}
      </p>

      <p className="mt-1 text-[9px] text-slate-500">
        {percentual.toFixed(2)}%
      </p>
    </div>
  );
}

function ResultadoCard({
  titulo,
  valor,
  tipo,
  icon,
}: {
  titulo: string;
  valor: string;
  tipo:
    | "neutral"
    | "green"
    | "blue"
    | "orange"
    | "red";
  icon: React.ReactNode;
}) {
  const estilos = {
    neutral:
      "border-[#1B3352] bg-[#0D223B] text-slate-300",

    green:
      "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-400",

    blue:
      "border-blue-500/20 bg-blue-500/[0.07] text-blue-400",

    orange:
      "border-orange-500/20 bg-orange-500/[0.07] text-orange-400",

    red:
      "border-red-500/20 bg-red-500/[0.07] text-red-400",
  };

  return (
    <div
      className={`rounded-xl border p-5 ${estilos[tipo]}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium">
          {titulo}
        </p>

        {icon}
      </div>

      <p className="mt-3 text-[19px] font-bold tracking-tight">
        {valor}
      </p>
    </div>
  );
}