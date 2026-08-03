import {
  Package,
  TrendingUp,
  DollarSign,
  Wallet,
} from "lucide-react";

const cards = [
  {
    title: "Total de Produtos",
    value: "248",
    icon: Package,
    color: "bg-blue-500",
  },
  {
    title: "Margem Média",
    value: "32,75%",
    icon: TrendingUp,
    color: "bg-green-500",
  },
  {
    title: "Lucro Líquido",
    value: "R$ 18.345,60",
    icon: DollarSign,
    color: "bg-orange-500",
  },
  {
    title: "Faturamento",
    value: "R$ 56.478,90",
    icon: Wallet,
    color: "bg-purple-500",
  },
];

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between"
          >
            <div>
              <p className="text-gray-500 text-sm">{card.title}</p>

              <h2 className="text-3xl font-bold mt-2">
                {card.value}
              </h2>
            </div>

            <div
              className={`${card.color} w-14 h-14 rounded-xl flex items-center justify-center`}
            >
              <Icon color="white" size={28} />
            </div>
          </div>
        );
      })}
    </div>
  );
}