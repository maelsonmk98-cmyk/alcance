import MainLayout from "@/components/layout/MainLayout";
import DashboardCards from "@/components/dashboard/DashboardCards";
import SearchBar from "@/components/dashboard/SearchBar";
import ProductTable from "@/components/dashboard/ProductTable";
import MarginChart from "@/components/dashboard/MarginChart";

export default function Home() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900">
            Estoque
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Acompanhe seus produtos, investimento, margem e ROI.
          </p>
        </div>

        <DashboardCards />

        <SearchBar />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ProductTable />
          </div>

          <MarginChart />
        </div>
      </div>
    </MainLayout>
  );
}