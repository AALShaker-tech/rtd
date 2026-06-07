import { prisma } from "@/lib/prisma";
import type { Prisma, RequestStatus, CarCategory } from "@prisma/client";
import { RequestsView } from "./RequestsView";

export const dynamic = "force-dynamic";

export default async function RequestsListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  const where: Prisma.RequestWhereInput = {};
  if (sp.status) where.status = sp.status as RequestStatus;
  if (sp.category) where.carCategory = sp.category as CarCategory;
  if (sp.employee) where.assignedEmployeeId = sp.employee;
  if (sp.driver) where.assignedDriverId = sp.driver;
  if (sp.q) {
    where.OR = [
      { referenceNumber: { contains: sp.q, mode: "insensitive" } },
      { customer: { fullName: { contains: sp.q, mode: "insensitive" } } },
      { customer: { phone: { contains: sp.q } } },
      { customer: { email: { contains: sp.q, mode: "insensitive" } } },
    ];
  }
  if (sp.city) where.journeySteps = { some: { city: sp.city } };
  if (sp.step) where.journeySteps = { some: { stepType: sp.step as any, skipped: false } };
  if (sp.from || sp.to) {
    where.createdAt = {};
    if (sp.from) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(sp.from);
    if (sp.to) {
      const to = new Date(sp.to);
      to.setDate(to.getDate() + 1);
      (where.createdAt as Prisma.DateTimeFilter).lt = to;
    }
  }

  const [requests, employees, drivers] = await Promise.all([
    prisma.request.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        customer: { select: { fullName: true, phone: true } },
        assignedEmployee: { select: { fullName: true } },
        assignedDriver: { select: { fullName: true } },
        journeySteps: { where: { skipped: false }, select: { city: true } },
      },
    }),
    prisma.user.findMany({ where: { role: "EMPLOYEE", isActive: true }, select: { id: true, fullName: true } }),
    prisma.user.findMany({ where: { role: "DRIVER", isActive: true }, select: { id: true, fullName: true } }),
  ]);

  return (
    <RequestsView
      employees={employees}
      drivers={drivers}
      filters={sp}
      requests={requests.map((r) => ({
        referenceNumber: r.referenceNumber,
        name: r.customer.fullName,
        phone: r.customer.phone,
        status: r.status,
        carCategory: r.carCategory,
        createdAt: r.createdAt,
        employee: r.assignedEmployee?.fullName ?? null,
        driver: r.assignedDriver?.fullName ?? null,
        cities: Array.from(new Set(r.journeySteps.map((s) => s.city).filter(Boolean))) as string[],
      }))}
    />
  );
}
