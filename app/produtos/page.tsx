import MainLayout from "@/components/layout/MainLayout";
import ProductsTable from "@/components/produtos/ProductsTable";

export default function ProdutosPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-[1600px] space-y-7">
        {/* Cabeçalho */}
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <span>Alcance</span>
            <span>/</span>
            <span className="text-slate-600">Produtos</span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-900">
            Produtos
          </h1>

          <p className="mt-1.5 text-sm text-slate-500">
            Gerencie seus produtos, custos, preços e margens.
          </p>
        </div>

        <ProductsTable />
      </div>
    </MainLayout>
  );
}
