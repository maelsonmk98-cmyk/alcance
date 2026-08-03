import MainLayout from "@/components/layout/MainLayout";
import ProductsTable from "@/components/produtos/ProductsTable";

export default function ProdutosPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Produtos
          </h1>

          <p className="text-gray-500">
            Gerencie seus produtos cadastrados.
          </p>
        </div>

        <ProductsTable />
      </div>
    </MainLayout>
  );
}