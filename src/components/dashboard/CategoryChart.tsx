"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#818cf8","#34d399","#fb923c","#fb7185","#38bdf8","#a78bfa","#facc15","#4ade80","#f472b6","#22d3ee"];

interface CategoryData { name: string; value: number; }

export default function CategoryChart({ data }: { data: CategoryData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2} dataKey="value" strokeWidth={0}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                formatter={(v) => [`€${Number(v).toFixed(2)}`]}
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="flex-1 space-y-2 min-w-0">
            {data.slice(0, 8).map((d, i) => (
              <li key={d.name} className="flex items-center gap-2 text-xs">
                <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="truncate text-muted-foreground flex-1">{d.name}</span>
                <span className="num shrink-0 font-medium tabular-nums">
                  {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
