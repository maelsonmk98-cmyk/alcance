import MainLayout from "@/components/layout/MainLayout";
import VendasCards from "@/components/dashboard/VendasCards";
import SalesChart from "@/components/dashboard/SalesChart";
import PerformanceChart from "@/components/dashboard/PerformanceChart";

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-[#07111f] text-white">
        <div className="space-y-6 p-6 lg:p-8">

          {/* Cabeçalho */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  Dashboard de Vendas
                </h1>

                <span className="text-2xl">⚡</span>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                Acompanhe suas vendas, faturamento, lucro, margem e ROI em tempo
                real.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="
                  rounded-xl
                  border border-slate-700
                  bg-[#0d1a2d]
                  px-4 py-2.5
                  text-sm font-medium
                  text-slate-200
                  shadow-sm
                  transition
                  hover:border-slate-600
                  hover:bg-[#13233b]
                "
              >
                Últimos 7 dias
              </button>
            </div>
          </div>

          {/* Cards */}
          <VendasCards />

          {/* Gráficos */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SalesChart />
            <PerformanceChart />
          </div>

        </div>
      </div>
    </MainLayout>
  );
}