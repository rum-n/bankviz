import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, CalendarRange, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";

interface Props {
  avgDailySpend: number;
  avgWeeklySpend: number;
  savingsRate: number;
  momExpenseChange: number | null;
}

function fmt(n: number) {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function KeyMetrics({ avgDailySpend, avgWeeklySpend, savingsRate, momExpenseChange }: Props) {
  const savingsPositive = savingsRate >= 0;
  // For expenses, a decrease (negative change) is the good outcome
  const expenseUp = momExpenseChange !== null && momExpenseChange > 0;

  const cards = [
    {
      label: "Avg Daily Spend",
      value: `€ ${fmt(avgDailySpend)}`,
      icon: CalendarDays,
      color: "text-foreground",
      bg: "bg-muted",
    },
    {
      label: "Avg Weekly Spend",
      value: `€ ${fmt(avgWeeklySpend)}`,
      icon: CalendarRange,
      color: "text-foreground",
      bg: "bg-muted",
    },
    {
      label: "Savings Rate",
      value: `${savingsPositive ? "" : "−"}${Math.abs(savingsRate).toFixed(1)}%`,
      icon: PiggyBank,
      color: savingsPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      bg: savingsPositive ? "bg-emerald-500/10 dark:bg-emerald-500/15" : "bg-rose-500/10 dark:bg-rose-500/15",
    },
    {
      label: "Expenses vs Last Month",
      value: momExpenseChange === null ? "—" : `${expenseUp ? "+" : ""}${momExpenseChange.toFixed(1)}%`,
      icon: expenseUp ? TrendingUp : TrendingDown,
      // rising expenses = bad (rose), falling expenses = good (emerald)
      color: momExpenseChange === null
        ? "text-muted-foreground"
        : expenseUp ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400",
      bg: momExpenseChange === null
        ? "bg-muted"
        : expenseUp ? "bg-rose-500/10 dark:bg-rose-500/15" : "bg-emerald-500/10 dark:bg-emerald-500/15",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
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
