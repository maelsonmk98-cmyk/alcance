import MainLayout from "@/components/layout/MainLayout";
import VendasCards from "@/components/dashboard/VendasCards";

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-[1600px] space-y-7">

        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard de Vendas
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Acompanhe suas vendas, faturamento, lucro, margem e ROI.
          </p>
        </div>

        {/* Indicadores de vendas */}
        <VendasCards />

        {/* Área futura dos gráficos */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
            <h2 className="text-[17px] font-bold text-slate-900">
              Vendas
            </h2>

            <p className="mt-1 text-[12px] text-slate-500">
              Aqui vamos colocar o gráfico de vendas.
            </p>

            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-slate-400">
                Gráfico de vendas em breve
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.035)]">
            <h2 className="text-[17px] font-bold text-slate-900">
              Desempenho
            </h2>

            <p className="mt-1 text-[12px] text-slate-500">
              Margem e ROI das vendas realizadas.
            </p>

            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-slate-400">
                Gráficos em breve
              </p>
            </div>
          </div>

        </div>

      </div>
    </MainLayout>
  );
}