import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Merchant { name: string; total: number; }

export default function TopMerchants({ data }: { data: Merchant[] }) {
  const max = data[0]?.total ?? 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Merchants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((m, i) => (
          <div key={m.name} className="flex items-center gap-3">
            <span className="num w-5 text-xs text-muted-foreground text-right shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm truncate">{m.name}</span>
                <span className="num text-sm font-medium shrink-0">€{m.total.toFixed(2)}</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-500"
                  style={{ width: `${(m.total / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
