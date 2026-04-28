import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const accountId = searchParams.get("accountId");

  const where: Record<string, unknown> = {};
  if (accountId && accountId !== "all") where.accountId = accountId;

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { accountingDate: "asc" },
      select: {
        accountingDate: true,
        debit: true,
        credit: true,
        category: true,
        merchant: true,
      },
    });

    // Internal Transfers are real money movements but not actual spending
    const spendingTx = transactions.filter((t) => t.category !== "Internal Transfer");

    const totalDebit = spendingTx.reduce((s: number, t) => s + (t.debit ?? 0), 0);
    const totalCredit = transactions.reduce((s: number, t) => s + (t.credit ?? 0), 0);

    const monthlyMap: Record<string, { month: string; income: number; expenses: number }> = {};
    for (const t of transactions) {
      const key = t.accountingDate.toISOString().slice(0, 7);
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, income: 0, expenses: 0 };
      if (t.credit) monthlyMap[key].income += t.credit;
      if (t.debit && t.category !== "Internal Transfer") monthlyMap[key].expenses += t.debit;
    }
    const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    const categoryMap: Record<string, number> = {};
    for (const t of spendingTx) {
      if (t.debit) categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.debit;
    }
    const byCategory = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);

    const merchantMap: Record<string, number> = {};
    for (const t of spendingTx) {
      if (t.debit && t.merchant)
        merchantMap[t.merchant] = (merchantMap[t.merchant] ?? 0) + t.debit;
    }
    const topMerchants = Object.entries(merchantMap)
      .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    let running = 0;
    const dailyMap: Record<string, number> = {};
    for (const t of transactions) {
      const day = t.accountingDate.toISOString().slice(0, 10);
      if (!dailyMap[day]) dailyMap[day] = 0;
      if (t.credit) dailyMap[day] += t.credit;
      if (t.debit) dailyMap[day] -= t.debit;
    }
    const runningBalance = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, net]) => {
        running += net;
        return { date, balance: Math.round(running * 100) / 100 };
      });

    return Response.json({
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      net: Math.round((totalCredit - totalDebit) * 100) / 100,
      monthly,
      byCategory,
      topMerchants,
      runningBalance,
    });
  } catch (err) {
    console.error("/api/stats error:", err);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}
