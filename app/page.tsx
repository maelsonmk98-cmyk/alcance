import MainLayout from "@/components/layout/MainLayout";
import DashboardCards from "@/components/dashboard/DashboardCards";
import SearchBar from "@/components/dashboard/SearchBar";
import ProductTable from "@/components/dashboard/ProductTable";
import MarginChart from "@/components/dashboard/MarginChart";

export default function Home() {
  return (
    <MainLayout fullWidth dark>
      <div className="min-h-full bg-[radial-gradient(circle_at_top,#0d203c_0%,#07111f_42%,#050b14_100%)] text-white">
        <div className="mx-auto w-full max-w-[1920px] px-5 py-3 lg:px-6 xl:px-7">

          {/* CABEÇALHO */}
          <div className="mb-2.5">
            <div className="flex items-center gap-2">
              <h1 className="text-[23px] font-bold leading-tight tracking-[-0.035em] text-white">
                Estoque
              </h1>

              <span className="text-[14px] text-blue-400">
                ◇
              </span>
            </div>

            <p className="mt-0.5 text-[9px] text-slate-500">
              Acompanhe seus produtos, investimento, margem e ROI.
            </p>
          </div>

          {/* CARDS */}
          <div className="mb-2.5">
            <DashboardCards />
          </div>

          {/* BUSCA */}
          <div className="mb-2.5">
            <SearchBar />
          </div>

          {/* CONTEÚDO PRINCIPAL */}
          <div
            className="
              grid
              grid-cols-1
              gap-3
              xl:grid-cols-[1.9fr_0.95fr]
              xl:items-stretch
            "
          >
            {/* PRODUTOS RECENTES */}
            <div className="min-w-0 xl:h-[430px]">
              <ProductTable />
            </div>

            {/* GRÁFICOS */}
            <div className="min-w-0 xl:h-[430px]">
              <MarginChart />
            </div>
          </div>

          <div className="h-2" />
        </div>
      </div>
    </MainLayout>
  );
}