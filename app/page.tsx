import MainLayout from "@/components/layout/MainLayout";
import DashboardCards from "@/components/dashboard/DashboardCards";
import SearchBar from "@/components/dashboard/SearchBar";
import ProductTable from "@/components/dashboard/ProductTable";
import MarginChart from "@/components/dashboard/MarginChart";
import Calculator from "@/components/calculadora/Calculator";

export default function Home() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Olá, Alcance Digital! 👋
          </h1>

          <p className="text-gray-500">
            Confira o desempenho dos seus produtos e margens.
          </p>
        </div>

        <Calculator />

        <DashboardCards />

        <SearchBar />

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <ProductTable />
          </div>

          <MarginChart />
        </div>
      </div>
    </MainLayout>
  );
}