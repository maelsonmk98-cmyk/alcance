"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";

type Props = {
  dataInicio: string;
  dataFim: string;
  onChange: (
    dataInicio: string,
    dataFim: string
  ) => void;
};

type Atalho = {
  label: string;
  dias?: number;
  tipo?: "hoje" | "mes";
};

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const DIAS_SEMANA = [
  "D",
  "S",
  "T",
  "Q",
  "Q",
  "S",
  "S",
];

const atalhos: Atalho[] = [
  {
    label: "Hoje",
    tipo: "hoje",
  },
  {
    label: "7 dias",
    dias: 7,
  },
  {
    label: "15 dias",
    dias: 15,
  },
  {
    label: "30 dias",
    dias: 30,
  },
  {
    label: "Este mês",
    tipo: "mes",
  },
];

function formatarDataInput(
  data: Date
) {
  const ano =
    data.getFullYear();

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function criarDataLocal(
  valor: string
) {
  const [ano, mes, dia] =
    valor
      .split("-")
      .map(Number);

  return new Date(
    ano,
    mes - 1,
    dia
  );
}

function formatarPeriodoCurto(
  inicio: string,
  fim: string
) {
  const dataInicio =
    criarDataLocal(inicio);

  const dataFim =
    criarDataLocal(fim);

  const inicioTexto =
    dataInicio
      .toLocaleDateString(
        "pt-BR",
        {
          day: "2-digit",
          month: "short",
        }
      )
      .replace(".", "");

  const fimTexto =
    dataFim
      .toLocaleDateString(
        "pt-BR",
        {
          day: "2-digit",
          month: "short",
        }
      )
      .replace(".", "");

  return `${inicioTexto} - ${fimTexto}`;
}

function mesmaData(
  a: Date,
  b: Date
) {
  return (
    a.getFullYear() ===
      b.getFullYear() &&
    a.getMonth() ===
      b.getMonth() &&
    a.getDate() ===
      b.getDate()
  );
}

function estaEntre(
  data: Date,
  inicio: Date,
  fim: Date
) {
  const valor =
    new Date(
      data.getFullYear(),
      data.getMonth(),
      data.getDate()
    ).getTime();

  const inicioValor =
    new Date(
      inicio.getFullYear(),
      inicio.getMonth(),
      inicio.getDate()
    ).getTime();

  const fimValor =
    new Date(
      fim.getFullYear(),
      fim.getMonth(),
      fim.getDate()
    ).getTime();

  return (
    valor >= inicioValor &&
    valor <= fimValor
  );
}

export default function DateRangePicker({
  dataInicio,
  dataFim,
  onChange,
}: Props) {
  const [aberto, setAberto] =
    useState(false);

  const [inicioTemp, setInicioTemp] =
    useState(dataInicio);

  const [fimTemp, setFimTemp] =
    useState(dataFim);

  const [selecionandoFim, setSelecionandoFim] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const dataFimAtual =
    criarDataLocal(
      fimTemp || dataFim
    );

  const [mesVisivel, setMesVisivel] =
    useState(
      new Date(
        dataFimAtual.getFullYear(),
        dataFimAtual.getMonth(),
        1
      )
    );

  useEffect(() => {
    setInicioTemp(dataInicio);
    setFimTemp(dataFim);
  }, [
    dataInicio,
    dataFim,
  ]);

  useEffect(() => {
    function fecharAoClicarFora(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setAberto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      fecharAoClicarFora
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharAoClicarFora
      );
    };
  }, []);

  const diasCalendario =
    useMemo(() => {
      const ano =
        mesVisivel.getFullYear();

      const mes =
        mesVisivel.getMonth();

      const primeiroDia =
        new Date(
          ano,
          mes,
          1
        );

      const ultimoDia =
        new Date(
          ano,
          mes + 1,
          0
        );

      const inicioGrade =
        new Date(
          primeiroDia
        );

      inicioGrade.setDate(
        primeiroDia.getDate() -
          primeiroDia.getDay()
      );

      const fimGrade =
        new Date(
          ultimoDia
        );

      fimGrade.setDate(
        ultimoDia.getDate() +
          (6 -
            ultimoDia.getDay())
      );

      const dias: Date[] =
        [];

      const atual =
        new Date(
          inicioGrade
        );

      while (
        atual <= fimGrade
      ) {
        dias.push(
          new Date(atual)
        );

        atual.setDate(
          atual.getDate() + 1
        );
      }

      return dias;
    }, [mesVisivel]);

  function aplicarAtalho(
    atalho: Atalho
  ) {
    const hoje =
      new Date();

    let inicio =
      new Date();

    let fim =
      new Date();

    if (
      atalho.tipo ===
      "hoje"
    ) {
      inicio =
        new Date(hoje);

      fim =
        new Date(hoje);
    } else if (
      atalho.tipo ===
      "mes"
    ) {
      inicio =
        new Date(
          hoje.getFullYear(),
          hoje.getMonth(),
          1
        );

      fim =
        new Date(hoje);
    } else if (
      atalho.dias
    ) {
      fim =
        new Date(hoje);

      inicio =
        new Date(hoje);

      inicio.setDate(
        inicio.getDate() -
          (atalho.dias - 1)
      );
    }

    const inicioFormatado =
      formatarDataInput(
        inicio
      );

    const fimFormatado =
      formatarDataInput(
        fim
      );

    setInicioTemp(
      inicioFormatado
    );

    setFimTemp(
      fimFormatado
    );

    setSelecionandoFim(
      false
    );

    setMesVisivel(
      new Date(
        fim.getFullYear(),
        fim.getMonth(),
        1
      )
    );
  }

  function selecionarData(
    data: Date
  ) {
    const valor =
      formatarDataInput(
        data
      );

    if (
      !selecionandoFim
    ) {
      setInicioTemp(
        valor
      );

      setFimTemp(
        valor
      );

      setSelecionandoFim(
        true
      );

      return;
    }

    const inicio =
      criarDataLocal(
        inicioTemp
      );

    if (
      data < inicio
    ) {
      setInicioTemp(
        valor
      );

      setFimTemp(
        formatarDataInput(
          inicio
        )
      );
    } else {
      setFimTemp(
        valor
      );
    }

    setSelecionandoFim(
      false
    );
  }

  function aplicarPeriodo() {
    if (
      !inicioTemp ||
      !fimTemp
    ) {
      return;
    }

    onChange(
      inicioTemp,
      fimTemp
    );

    setAberto(false);
  }

  function cancelar() {
    setInicioTemp(
      dataInicio
    );

    setFimTemp(
      dataFim
    );

    setSelecionandoFim(
      false
    );

    setAberto(false);
  }

  function mesAnterior() {
    setMesVisivel(
      (atual) =>
        new Date(
          atual.getFullYear(),
          atual.getMonth() - 1,
          1
        )
    );
  }

  function proximoMes() {
    setMesVisivel(
      (atual) =>
        new Date(
          atual.getFullYear(),
          atual.getMonth() + 1,
          1
        )
    );
  }

  const inicioSelecionado =
    criarDataLocal(
      inicioTemp
    );

  const fimSelecionado =
    criarDataLocal(
      fimTemp
    );

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      {/* Botão principal */}
      <button
        type="button"
        onClick={() =>
          setAberto(
            (valor) =>
              !valor
          )
        }
        className="
          flex
          h-9
          items-center
          gap-2
          rounded-lg
          border
          border-[#28405e]
          bg-[#0d1b2f]
          px-3
          text-[9px]
          font-medium
          text-slate-300
          shadow-[0_6px_20px_rgba(0,0,0,0.12)]
          transition
          hover:border-[#385878]
          hover:bg-[#11243d]
        "
      >
        <CalendarDays
          size={13}
          className="text-blue-400"
        />

        <span>
          {formatarPeriodoCurto(
            dataInicio,
            dataFim
          )}
        </span>

        <ChevronDown
          size={12}
          className={`text-slate-500 transition ${
            aberto
              ? "rotate-180"
              : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {aberto && (
        <div
          className="
            absolute
            right-0
            top-[calc(100%+8px)]
            z-[100]
            w-[390px]
            overflow-hidden
            rounded-xl
            border
            border-[#2a415e]
            bg-[#0b1728]
            shadow-[0_24px_60px_rgba(0,0,0,0.45)]
          "
        >
          {/* Atalhos */}
          <div className="border-b border-[#243750] p-3">
            <p className="mb-2 text-[9px] font-semibold text-slate-300">
              Período
            </p>

            <div className="flex flex-wrap gap-1.5">
              {atalhos.map(
                (atalho) => (
                  <button
                    key={
                      atalho.label
                    }
                    type="button"
                    onClick={() =>
                      aplicarAtalho(
                        atalho
                      )
                    }
                    className="
                      rounded-md
                      border
                      border-[#28405e]
                      bg-[#102039]
                      px-2.5
                      py-1.5
                      text-[8px]
                      font-medium
                      text-slate-400
                      transition
                      hover:border-blue-500/40
                      hover:bg-blue-500/10
                      hover:text-blue-300
                    "
                  >
                    {
                      atalho.label
                    }
                  </button>
                )
              )}
            </div>
          </div>

          {/* Calendário */}
          <div className="p-3">
            <div className="mb-3 flex items-center justify-between">

              <button
                type="button"
                onClick={
                  mesAnterior
                }
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-[#14263d] hover:text-white"
              >
                <ChevronLeft
                  size={14}
                />
              </button>

              <p className="text-[10px] font-semibold text-white">
                {
                  MESES[
                    mesVisivel.getMonth()
                  ]
                }{" "}
                {mesVisivel.getFullYear()}
              </p>

              <button
                type="button"
                onClick={
                  proximoMes
                }
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-[#14263d] hover:text-white"
              >
                <ChevronRight
                  size={14}
                />
              </button>

            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1">
              {DIAS_SEMANA.map(
                (
                  dia,
                  index
                ) => (
                  <div
                    key={`${dia}-${index}`}
                    className="flex h-6 items-center justify-center text-[7px] font-medium text-slate-600"
                  >
                    {dia}
                  </div>
                )
              )}
            </div>

            {/* Dias */}
            <div className="mt-1 grid grid-cols-7 gap-1">
              {diasCalendario.map(
                (data) => {
                  const pertenceMes =
                    data.getMonth() ===
                    mesVisivel.getMonth();

                  const inicioAtivo =
                    mesmaData(
                      data,
                      inicioSelecionado
                    );

                  const fimAtivo =
                    mesmaData(
                      data,
                      fimSelecionado
                    );

                  const dentroIntervalo =
                    estaEntre(
                      data,
                      inicioSelecionado,
                      fimSelecionado
                    );

                  const selecionado =
                    inicioAtivo ||
                    fimAtivo;

                  const hoje =
                    mesmaData(
                      data,
                      new Date()
                    );

                  return (
                    <button
                      key={
                        formatarDataInput(
                          data
                        )
                      }
                      type="button"
                      onClick={() =>
                        selecionarData(
                          data
                        )
                      }
                      className={`
                        relative
                        flex
                        h-8
                        items-center
                        justify-center
                        rounded-md
                        text-[8px]
                        font-medium
                        transition
                        ${
                          selecionado
                            ? "bg-blue-600 text-white"
                            : dentroIntervalo
                            ? "bg-blue-500/15 text-blue-300"
                            : pertenceMes
                            ? "text-slate-300 hover:bg-[#14263d]"
                            : "text-slate-700 hover:bg-[#111f33]"
                        }
                      `}
                    >
                      {data.getDate()}

                      {hoje &&
                        !selecionado && (
                          <span className="absolute bottom-[2px] h-[2px] w-[2px] rounded-full bg-blue-400" />
                        )}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Resumo */}
          <div className="border-t border-[#243750] bg-[#091422] px-3 py-2.5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-[7px] text-slate-600">
                  Período selecionado
                </p>

                <p className="mt-0.5 text-[9px] font-medium text-slate-300">
                  {criarDataLocal(
                    inicioTemp
                  ).toLocaleDateString(
                    "pt-BR"
                  )}
                  {" → "}
                  {criarDataLocal(
                    fimTemp
                  ).toLocaleDateString(
                    "pt-BR"
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={
                    cancelar
                  }
                  className="
                    h-8
                    rounded-md
                    px-3
                    text-[8px]
                    font-medium
                    text-slate-500
                    transition
                    hover:bg-[#14263d]
                    hover:text-slate-300
                  "
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    aplicarPeriodo
                  }
                  className="
                    flex
                    h-8
                    items-center
                    gap-1.5
                    rounded-md
                    bg-blue-600
                    px-3
                    text-[8px]
                    font-semibold
                    text-white
                    transition
                    hover:bg-blue-500
                  "
                >
                  <Check
                    size={11}
                  />

                  Aplicar
                </button>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}