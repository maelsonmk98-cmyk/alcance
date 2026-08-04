import {
  Package,
  TrendingUp,
  DollarSign,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

const cards = [
  {
    title: "Total de Produtos",
    value: "248",
    description: "+12 este mês",
    icon: Package,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Margem Média",
    value: "32,75%",
    description: "+2,4% este mês",
    icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Lucro Líquido",
    value: "R$ 18.345,60",
    description: "+8,2% este mês",
    icon: DollarSign,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    title: "Faturamento",
    value: "R$ 56.478,90",
    description: "+14,6% este mês",
    icon: Wallet,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon
                  size={21}
                  strokeWidth={2}
                  className={card.iconColor}
                />
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition group-hover:bg-slate-50 group-hover:text-slate-700">
                <ArrowUpRight size={17} />
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-500">
                {card.title}
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {card.value}
              </h2>

              <p className="mt-2 text-xs font-medium text-emerald-600">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}