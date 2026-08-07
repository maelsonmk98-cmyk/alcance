import MainLayout from "@/components/layout/MainLayout";
import VendasCards from "@/components/dashboard/VendasCards";
import SalesChart from "@/components/dashboard/SalesChart";
import PerformanceChart from "@/components/dashboard/PerformanceChart";

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard de Vendas
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Acompanhe suas vendas, faturamento, lucro, margem e ROI.
          </p>
        </div>

        <VendasCards />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SalesChart />
          <PerformanceChart />
        </div>
      </div>
    </MainLayout>
  );
}