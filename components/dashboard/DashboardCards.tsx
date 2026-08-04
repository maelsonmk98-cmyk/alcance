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
    iconBg: "bg-[#071E49]/[0.06]",
    iconColor: "text-[#071E49]",
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
    iconBg: "bg-[#F47B20]/10",
    iconColor: "text-[#F47B20]",
  },
  {
    title: "Faturamento",
    value: "R$ 56.478,90",
    description: "Faturamento total",
    icon: Wallet,
    iconBg: "bg-[#071E49]/[0.06]",
    iconColor: "text-[#071E49]",
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
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_30px_rgba(15,23,42,0.07)]"
          >
            <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-slate-50 opacity-60 transition-transform duration-300 group-hover:scale-150" />

            <div className="relative flex items-start justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon
                  size={20}
                  strokeWidth={2}
                  className={card.iconColor}
                />
              </div>

              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-300 transition group-hover:bg-slate-100 group-hover:text-slate-500">
                <ArrowUpRight size={14} />
              </div>
            </div>

            <div className="relative mt-5">
              <p className="text-[12px] font-medium text-slate-500">
                {card.title}
              </p>

              <h2 className="mt-1.5 text-[24px] font-bold tracking-[-0.025em] text-slate-900">
                {card.value}
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
