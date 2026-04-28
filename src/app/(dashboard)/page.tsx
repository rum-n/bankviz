"use client";

import { useEffect, useState } from "react";
import SummaryCards from "@/components/dashboard/SummaryCards";
import MonthlyChart from "@/components/dashboard/MonthlyChart";
import CategoryChart from "@/components/dashboard/CategoryChart";
import BalanceChart from "@/components/dashboard/BalanceChart";
import TopMerchants from "@/components/dashboard/TopMerchants";
import AccountSwitcher from "@/components/AccountSwitcher";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload } from "lucide-react";

interface Stats {
  totalDebit: number;
  totalCredit: number;
  net: number;
  monthly: { month: string; income: number; expenses: number }[];
  byCategory: { name: string; value: number }[];
  topMerchants: { name: string; total: number }[];
  runningBalance: { date: string; balance: number }[];
}

interface Account {
  id: string;
  label: string;
  iban: string;
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => Array.isArray(data) && setAccounts(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = selectedAccount !== "all" ? `?accountId=${selectedAccount}` : "";
    fetch(`/api/stats${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); setLoading(false); });
  }, [selectedAccount]);

  const isEmpty = !loading && stats && stats.totalDebit === 0 && stats.totalCredit === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your financial summary</p>
        </div>
        <AccountSwitcher accounts={accounts} value={selectedAccount} onChange={(v) => setSelectedAccount(v ?? "all")} />
      </div>

      {isEmpty && (
        <div className="text-center py-20 space-y-4">
          <p className="text-muted-foreground">No transactions yet.</p>
          <Link href="/upload">
            <Button className="gap-2">
              <Upload size={16} />
              Upload your first statement
            </Button>
          </Link>
        </div>
      )}

      {!isEmpty && stats && (
        <>
          <SummaryCards totalCredit={stats.totalCredit} totalDebit={stats.totalDebit} net={stats.net} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MonthlyChart data={stats.monthly} />
            <CategoryChart data={stats.byCategory} />
          </div>

          <BalanceChart data={stats.runningBalance} />

          <TopMerchants data={stats.topMerchants} />
        </>
      )}

      {loading && (
        <div className="text-center py-20 text-muted-foreground text-sm">Loading…</div>
      )}
    </div>
  );
}
