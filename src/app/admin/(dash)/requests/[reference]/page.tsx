import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { RequestDetailView } from "./RequestDetailView";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const request = await prisma.request.findUnique({
    where: { referenceNumber: decodeURIComponent(reference).toUpperCase() },
    include: {
      customer: true,
      journeySteps: { orderBy: { stepOrder: "asc" } },
      assignedEmployee: { select: { id: true, fullName: true } },
      assignedDriver: { select: { id: true, fullName: true } },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { fullName: true } } },
      },
      internalNotes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { fullName: true } } },
      },
      priceHistory: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { fullName: true } } },
      },
      flightSnapshots: true,
    },
  });
  if (!request) notFound();

  const [employees, drivers] = await Promise.all([
    prisma.user.findMany({ where: { role: "EMPLOYEE", isActive: true }, select: { id: true, fullName: true } }),
    prisma.user.findMany({ where: { role: "DRIVER", isActive: true }, select: { id: true, fullName: true } }),
  ]);

  return <RequestDetailView request={serialize(request)} employees={employees} drivers={drivers} />;
}
