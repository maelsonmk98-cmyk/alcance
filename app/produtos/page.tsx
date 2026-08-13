import MainLayout from "@/components/layout/MainLayout";
import ProductsTable from "@/components/produtos/ProductsTable";

export default function ProdutosPage() {
  return (
    <MainLayout>
      <div className="-m-6 min-h-[calc(100vh-64px)] bg-[#07182B] p-6 lg:-m-8 lg:p-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          {/* Cabeçalho */}
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[11px] font-medium">
              <span className="text-slate-500">
                Alcance
              </span>

              <span className="text-slate-700">
                /
              </span>

              <span className="text-slate-300">
                Produtos
              </span>
            </div>

            {/* Título */}
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white">
              Produtos
            </h1>

            {/* Descrição */}
            <p className="mt-1.5 text-sm text-slate-400">
              Gerencie seus produtos, custos, preços e margens de forma
              inteligente.
            </p>
          </div>

          {/* Conteúdo */}
          <ProductsTable />
        </div>
      </div>
    </MainLayout>
  );
}