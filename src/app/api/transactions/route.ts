import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const accountId = searchParams.get("accountId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);

  const where: Record<string, unknown> = {};
  if (accountId && accountId !== "all") where.accountId = accountId;
  if (from || to) {
    where.accountingDate = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  if (category && category !== "all") where.category = category;
  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { merchant: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { accountingDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { account: { select: { label: true, iban: true } } },
      }),
    ]);
    return Response.json({ transactions, total, page, pageSize });
  } catch (err) {
    console.error("/api/transactions error:", err);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, category } = await request.json();
  const tx = await prisma.transaction.update({
    where: { id },
    data: { category, categoryOverride: true },
  });
  return Response.json(tx);
}
