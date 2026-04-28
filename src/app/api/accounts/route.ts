import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { transactions: true } } },
    });
    return Response.json(accounts);
  } catch (err) {
    console.error("/api/accounts error:", err);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, label } = await request.json();
  const account = await prisma.account.update({ where: { id }, data: { label } });
  return Response.json(account);
}
