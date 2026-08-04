import MainLayout from "@/components/layout/MainLayout";
import DashboardCards from "@/components/dashboard/DashboardCards";
import SearchBar from "@/components/dashboard/SearchBar";
import ProductTable from "@/components/dashboard/ProductTable";
import MarginChart from "@/components/dashboard/MarginChart";

export default function Home() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-[1600px] space-y-7">
        {/* Cabeçalho do Dashboard */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Olá, Alcance Digital! 👋
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Confira o desempenho dos seus produtos e margens.
          </p>
        </div>

        {/* Indicadores */}
        <DashboardCards />

        {/* Busca */}
        <SearchBar />

        {/* Produtos + Margem */}
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