export default function MarginChart() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 h-full">
      <h2 className="text-xl font-bold mb-6">
        Margem por Faixa
      </h2>

      <div className="flex items-center justify-center h-72">
        <div className="w-44 h-44 rounded-full border-[24px] border-blue-500 relative">
          <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">
            57%
          </div>
        </div>
      </div>

      <div className="space-y-2 mt-4 text-sm">
        <div className="flex justify-between">
          <span>Acima de 30%</span>
          <strong>142</strong>
        </div>

        <div className="flex justify-between">
          <span>Entre 20% e 30%</span>
          <strong>68</strong>
        </div>

        <div className="flex justify-between">
          <span>Entre 10% e 20%</span>
          <strong>26</strong>
        </div>

        <div className="flex justify-between">
          <span>Abaixo de 10%</span>
          <strong>12</strong>
        </div>
      </div>
    </div>
  );
}