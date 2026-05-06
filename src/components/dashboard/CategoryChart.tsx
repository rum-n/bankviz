"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["#818cf8","#34d399","#fb923c","#fb7185","#38bdf8","#a78bfa","#facc15","#4ade80","#f472b6","#22d3ee"];

interface CategoryData { name: string; value: number; }

function formatMonth(m: string) {
  const [year, month] = m.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("en-GB", { month: "short", year: "numeric" });
}

interface Props {
  data: CategoryData[];
  byMonth: Record<string, CategoryData[]>;
}

export default function CategoryChart({ data, byMonth }: Props) {
  const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));
  const [selectedMonth, setSelectedMonth] = useState("all");

  const active = selectedMonth === "all" ? data : (byMonth[selectedMonth] ?? []);
  const total = active.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Spending by Category</CardTitle>
          <Select value={selectedMonth} onValueChange={(v) => setSelectedMonth(v ?? "all")}>
            <SelectTrigger className="h-7 text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {active.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No spending data for this month.</p>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={active} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {active.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  formatter={(v) => [`€${Number(v).toFixed(2)}`]}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-2 min-w-0">
              {active.slice(0, 8).map((d, i) => (
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
        )}
      </CardContent>
    </Card>
  );
}
