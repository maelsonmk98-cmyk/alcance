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
    description: "Produtos cadastrados",
    icon: Package,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Margem Média",
    value: "32,75%",
    description: "Média dos produtos",
    icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Lucro Líquido",
    value: "R$ 18.345,60",
    description: "Lucro acumulado",
    icon: DollarSign,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    title: "Faturamento",
    value: "R$ 56.478,90",
    description: "Faturamento total",
    icon: Wallet,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(15,23,42,0.07)]"
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

              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-slate-100">
                <ArrowUpRight size={15} />
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-500">
                {card.title}
              </p>

              <h2 className="mt-1.5 text-[25px] font-bold tracking-tight text-slate-900">
                {card.value}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
