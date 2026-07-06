import { prisma } from "@/lib/prisma";
import { ONLINE_WINDOW_MS } from "@/lib/presence";
import { OverviewView } from "./OverviewView";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [
    total,
    received,
    confirmed,
    completed,
    cancelled,
    unassigned,
    pendingVerification,
    upcomingToday,
    byCityRaw,
    byCategoryRaw,
    recent,
    onlineUsers,
  ] = await Promise.all([
    prisma.request.count(),
    prisma.request.count({ where: { status: "REQUEST_RECEIVED" } }),
    prisma.request.count({ where: { status: "CONFIRMED" } }),
    prisma.request.count({ where: { status: "COMPLETED" } }),
    prisma.request.count({ where: { status: "CANCELLED" } }),
    prisma.request.count({
      where: { assignedEmployeeId: null, status: { notIn: ["CANCELLED", "COMPLETED"] } },
    }),
    prisma.customer.count({ where: { OR: [{ phoneVerified: false }, { emailVerified: false }] } }),
    prisma.journeyStep.count({
      where: { scheduledAt: { gte: startOfToday, lt: endOfToday }, skipped: false },
    }),
    prisma.journeyStep.groupBy({
      by: ["city"],
      _count: true,
      where: { city: { not: null }, skipped: false },
    }),
    prisma.request.groupBy({ by: ["carCategory"], _count: true }),
    prisma.request.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { fullName: true } } },
    }),
    prisma.user.findMany({
      where: { isActive: true, lastSeenAt: { gt: new Date(Date.now() - ONLINE_WINDOW_MS) } },
      orderBy: { lastSeenAt: "desc" },
      select: { id: true, fullName: true, role: true, lastSeenAt: true },
    }),
  ]);

  return (
    <OverviewView
      metrics={{
        total,
        received,
        confirmed,
        completed,
        cancelled,
        unassigned,
        pendingVerification,
        upcomingToday,
      }}
      byCity={byCityRaw.map((r) => ({ city: r.city as string, count: r._count }))}
      byCategory={byCategoryRaw.map((r) => ({ category: r.carCategory, count: r._count }))}
      recent={recent.map((r) => ({
        referenceNumber: r.referenceNumber,
        name: r.customer.fullName,
        status: r.status,
        createdAt: r.createdAt,
      }))}
      online={onlineUsers.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        role: u.role,
        lastSeenAt: u.lastSeenAt!.toISOString(),
      }))}
    />
  );
}
