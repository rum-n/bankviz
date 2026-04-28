"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AccountSwitcher from "@/components/AccountSwitcher";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORIES = [
  "All", "Internal Transfer", "Utilities", "Loan", "Cash", "Transfers",
  "Subscriptions", "Fuel", "Transport", "Groceries", "Dining", "Health",
  "Insurance", "Bank Fees", "Accommodation", "Travel", "Other",
];

interface Transaction {
  id: string;
  accountingDate: string;
  description: string;
  merchant: string;
  merchantCountry: string;
  transactionType: string;
  debit: number | null;
  credit: number | null;
  category: string;
  account: { label: string };
}

interface Account {
  id: string;
  label: string;
  iban: string;
}

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const pageSize = 50;

  useEffect(() => {
    fetch("/api/accounts").then((r) => r.ok ? r.json() : []).then((d) => Array.isArray(d) && setAccounts(d));
  }, []);

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (selectedAccount !== "all") params.set("accountId", selectedAccount);
    if (search) params.set("search", search);
    if (category !== "all") params.set("category", category);

    fetch(`/api/transactions?${params}`)
      .then((r) => r.ok ? r.json() : { transactions: [], total: 0 })
      .then((data) => {
        setTransactions(data.transactions ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      });
  }, [page, selectedAccount, search, category]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [selectedAccount, search, category]);

  async function handleCategoryChange(id: string, newCategory: string) {
    await fetch("/api/transactions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, category: newCategory }),
    });
    setEditingId(null);
    fetchTransactions();
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <AccountSwitcher accounts={accounts} value={selectedAccount} onChange={(v) => setSelectedAccount(v ?? "all")} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search description or merchant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={category} onValueChange={(v) => setCategory(v ?? "all")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c === "All" ? "all" : c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading…</TableCell>
              </TableRow>
            )}
            {!loading && transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No transactions found.</TableCell>
              </TableRow>
            )}
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {new Date(tx.accountingDate).toLocaleDateString("en-GB")}
                </TableCell>
                <TableCell className="text-sm max-w-[160px]">
                  <div className="flex items-center gap-1">
                    {tx.merchantCountry && (
                      <span className="text-xs text-muted-foreground shrink-0">{tx.merchantCountry}</span>
                    )}
                    <span className="truncate">{tx.merchant || "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm max-w-[220px]">
                  <span className="line-clamp-2">{tx.description}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {tx.transactionType}
                </TableCell>
                <TableCell>
                  {editingId === tx.id ? (
                    <Select defaultValue={tx.category} onValueChange={(v) => v && handleCategoryChange(tx.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.filter((c) => c !== "All").map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="cursor-pointer text-xs"
                      onClick={() => setEditingId(tx.id)}
                    >
                      {tx.category}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="num text-right text-sm font-medium text-red-600 dark:text-red-400">
                  {tx.debit != null ? `€${tx.debit.toFixed(2)}` : ""}
                </TableCell>
                <TableCell className="num text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {tx.credit != null ? `€${tx.credit.toFixed(2)}` : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {total} transactions · page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
