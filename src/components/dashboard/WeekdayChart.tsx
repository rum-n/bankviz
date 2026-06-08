"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeekdayData { day: string; value: number; }

export default function WeekdayChart({ data }: { data: WeekdayData[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Spending by Day of Week</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€${v}`}
              width={52}
            />
            <Tooltip
              formatter={(v) => [`€${Number(v).toFixed(2)}`]}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: 12,
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              cursor={{ fill: "currentColor", fillOpacity: 0.05 }}
            />
            <Bar dataKey="value" name="Spending" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
