import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, ArrowRightLeft } from "lucide-react";

interface Props {
  totalCredit: number;
  totalDebit: number;
  net: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

const cards = (credit: number, debit: number, net: number) => [
  {
    label: "Total Income",
    value: `€ ${fmt(credit)}`,
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
  },
  {
    label: "Total Expenses",
    value: `€ ${fmt(debit)}`,
    icon: TrendingDown,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
  },
  {
    label: "Net Cash Flow",
    value: `${net >= 0 ? "+" : ""}€ ${fmt(Math.abs(net))}`,
    icon: ArrowRightLeft,
    color: net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
    bg: net >= 0 ? "bg-emerald-500/10 dark:bg-emerald-500/15" : "bg-rose-500/10 dark:bg-rose-500/15",
  },
];

export default function SummaryCards({ totalCredit, totalDebit, net }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards(totalCredit, totalDebit, net).map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
                <p className={`num text-2xl font-bold ${color} leading-none`}>{value}</p>
              </div>
              <div className={`shrink-0 p-2.5 rounded-lg ${bg}`}>
                <Icon size={18} className={color} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
