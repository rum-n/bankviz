import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseCSV } from "@/lib/csv-parser";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();

  let parsed;
  try {
    parsed = parseCSV(text);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Parse error";
    return Response.json({ error: message }, { status: 422 });
  }

  const account = await prisma.account.upsert({
    where: { iban: parsed.iban },
    update: {},
    create: {
      iban: parsed.iban,
      label: parsed.label,
      currency: parsed.currency,
    },
  });

  let imported = 0;
  let skipped = 0;

  for (const tx of parsed.transactions) {
    try {
      await prisma.transaction.create({
        data: {
          accountId: account.id,
          accountingDate: tx.accountingDate,
          valueDate: tx.valueDate,
          description: tx.description,
          merchant: tx.merchant,
          merchantCountry: tx.merchantCountry,
          accountNumber: tx.accountNumber,
          transactionType: tx.transactionType,
          reference: tx.reference,
          debit: tx.debit,
          credit: tx.credit,
          category: tx.category,
          transactionDate: tx.transactionDate,
          transactionTime: tx.transactionTime,
          importHash: tx.importHash,
        },
      });
      imported++;
    } catch {
      // Unique constraint on importHash = duplicate
      skipped++;
    }
  }

  return Response.json({ imported, skipped, accountId: account.id });
}
