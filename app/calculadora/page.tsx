import MainLayout from "@/components/layout/MainLayout";
import Calculator from "@/components/calculadora/Calculator";

export default function CalculadoraPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-[1400px] space-y-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Calculadora
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Calcule custos, lucro, margem e ROI dos seus produtos.
          </p>
        </div>

        <Calculator />
      </div>
    </MainLayout>
  );
}
