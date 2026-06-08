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
        merchantCountry: true,
      },
    });

    // Internal Transfers are real money movements but not actual income or spending
    const spendingTx = transactions.filter((t) => t.category !== "Internal Transfer");

    const totalDebit = spendingTx.reduce((s: number, t) => s + (t.debit ?? 0), 0);
    const totalCredit = spendingTx.reduce((s: number, t) => s + (t.credit ?? 0), 0);

    const monthlyMap: Record<string, { month: string; income: number; expenses: number }> = {};
    for (const t of spendingTx) {
      const key = t.accountingDate.toISOString().slice(0, 7);
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, income: 0, expenses: 0 };
      if (t.credit) monthlyMap[key].income += t.credit;
      if (t.debit) monthlyMap[key].expenses += t.debit;
    }
    const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    const categoryMap: Record<string, number> = {};
    const monthCategoryMap: Record<string, Record<string, number>> = {};
    for (const t of spendingTx) {
      if (!t.debit) continue;
      categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.debit;
      const month = t.accountingDate.toISOString().slice(0, 7);
      if (!monthCategoryMap[month]) monthCategoryMap[month] = {};
      monthCategoryMap[month][t.category] = (monthCategoryMap[month][t.category] ?? 0) + t.debit;
    }
    const byCategory = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
    const byCategoryByMonth: Record<string, { name: string; value: number }[]> = {};
    for (const [month, cats] of Object.entries(monthCategoryMap)) {
      byCategoryByMonth[month] = Object.entries(cats)
        .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
        .sort((a, b) => b.value - a.value);
    }

    const merchantMap: Record<string, number> = {};
    for (const t of spendingTx) {
      if (t.debit && t.merchant)
        merchantMap[t.merchant] = (merchantMap[t.merchant] ?? 0) + t.debit;
    }
    const topMerchants = Object.entries(merchantMap)
      .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const countryMap: Record<string, number> = {};
    for (const t of spendingTx) {
      if (!t.debit) continue;
      const country = t.merchantCountry || "Unknown";
      countryMap[country] = (countryMap[country] ?? 0) + t.debit;
    }
    const byCountry = Object.entries(countryMap)
      .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);

    // Average daily / weekly spend across the span of the data
    let avgDailySpend = 0;
    let avgWeeklySpend = 0;
    const debitDates = spendingTx.filter((t) => t.debit).map((t) => t.accountingDate.getTime());
    if (debitDates.length > 0) {
      const span = Math.max(...debitDates) - Math.min(...debitDates);
      const days = Math.max(1, Math.round(span / 86_400_000) + 1);
      avgDailySpend = Math.round((totalDebit / days) * 100) / 100;
      avgWeeklySpend = Math.round((avgDailySpend * 7) * 100) / 100;
    }

    // Savings rate: net income kept as a share of total income
    const savingsRate =
      totalCredit > 0 ? Math.round(((totalCredit - totalDebit) / totalCredit) * 1000) / 10 : 0;

    // Month-over-month change (latest full month vs the one before it)
    let momExpenseChange: number | null = null;
    let momIncomeChange: number | null = null;
    if (monthly.length >= 2) {
      const cur = monthly[monthly.length - 1];
      const prev = monthly[monthly.length - 2];
      if (prev.expenses > 0) momExpenseChange = Math.round(((cur.expenses - prev.expenses) / prev.expenses) * 1000) / 10;
      if (prev.income > 0) momIncomeChange = Math.round(((cur.income - prev.income) / prev.income) * 1000) / 10;
    }

    // Spending by day of week (Mon..Sun)
    const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekdayTotals = new Array(7).fill(0);
    for (const t of spendingTx) {
      if (!t.debit) continue;
      const jsDay = t.accountingDate.getUTCDay(); // 0=Sun..6=Sat
      const idx = (jsDay + 6) % 7; // shift so Mon=0
      weekdayTotals[idx] += t.debit;
    }
    const byWeekday = weekdayLabels.map((day, i) => ({
      day,
      value: Math.round(weekdayTotals[i] * 100) / 100,
    }));

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
      byCategoryByMonth,
      topMerchants,
      byCountry,
      avgDailySpend,
      avgWeeklySpend,
      savingsRate,
      momExpenseChange,
      momIncomeChange,
      byWeekday,
      runningBalance,
    });
  } catch (err) {
    console.error("/api/stats error:", err);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}
