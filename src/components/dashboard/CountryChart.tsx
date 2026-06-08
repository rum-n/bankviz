import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Country { name: string; total: number; }

export default function CountryChart({ data }: { data: Country[] }) {
  const top = data.slice(0, 10);
  const max = top[0]?.total ?? 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Spending by Country</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No spending data.</p>
        ) : (
          top.map((c, i) => (
            <div key={c.name} className="flex items-center gap-3">
              <span className="num w-5 text-xs text-muted-foreground text-right shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate">{c.name}</span>
                  <span className="num text-sm font-medium shrink-0">€{c.total.toFixed(2)}</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all duration-500"
                    style={{ width: `${(c.total / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
