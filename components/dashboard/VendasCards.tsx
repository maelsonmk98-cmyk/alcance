"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Wallet,
  Percent,
  Receipt,
  Target,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Venda = {
  data_venda: string;
  quantidade: number | null;
  faturamento: number | null;
  custo_total: number | null;
  lucro: number | null;
  custo_unitario: number | null;
  comissao: number | null;
  frete: number | null;
  promocao: number | null;
  tarifa_fixa: number | null;
  acos: number | null;
};

type Props = {
  dataInicio?: string;
  dataFim?: string;
};

type Resumo = {
  quantidade: number;
  faturamento: number;
  receitaLiquida: number;
  valorInvestido: number;
  investimentoProdutos: number;
  investimentoAds: number;
  custo: number;
  lucro: number;
  roi: number;
  margem: number;
};

function criarDataLocal(
  valor: string,
  finalDoDia = false
) {
  const [ano, mes, dia] = valor
    .split("-")
    .map(Number);

  const data = new Date(
    ano,
    mes - 1,
    dia
  );

  if (finalDoDia) {
    data.setHours(23, 59, 59, 999);
  } else {
    data.setHours(0, 0, 0, 0);
  }

  return data;
}

function formatarDataInput(data: Date) {
  const ano = data.getFullYear();

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export default function VendasCards({
  dataInicio,
  dataFim,
}: Props) {
  const [vendasAtuais, setVendasAtuais] =
    useState<Venda[]>([]);

  const [
    vendasAnteriores,
    setVendasAnteriores,
