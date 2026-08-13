import MainLayout from "@/components/layout/MainLayout";
import Calculator from "@/components/calculadora/Calculator";

export default function CalculadoraPage() {
  return (
    <MainLayout>
      <div className="-m-6 min-h-[calc(100vh-64px)] bg-[#07182B] p-6 lg:-m-8 lg:p-8">
        <div className="mx-auto max-w-[1400px] space-y-6">
          {/* Cabeçalho */}
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <span className="text-slate-500">
                Alcance
              </span>

              <span className="text-slate-700">
                /
              </span>

              <span className="text-slate-300">
                Calculadora
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white">
              Calculadora
            </h1>

            <p className="mt-1.5 text-sm text-slate-400">
              Calcule custos, lucro, margem e ROI dos seus produtos.
            </p>
          </div>

          <Calculator />
        </div>
      </div>
    </MainLayout>
  );
}