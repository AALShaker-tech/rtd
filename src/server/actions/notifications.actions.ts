"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NotificationItem } from "@/lib/notifications";

/**
 * Role-scoped "needs attention" items for the notification bell:
 *  - ADMIN    → new/under-review requests (the intake queue)
 *  - EMPLOYEE → their assignments awaiting first contact
 *  - DRIVER   → their pending/accepted tasks
 * Read-only; safe to poll.
 */
export async function getOpsNotifications(): Promise<{ items: NotificationItem[]; serverTime: string }> {
  const serverTime = new Date().toISOString();
  const session = await getSession();
  if (!session) return { items: [], serverTime };

  if (session.role === "ADMIN") {
    const reqs = await prisma.request.findMany({
      where: { status: { in: ["REQUEST_RECEIVED", "UNDER_REVIEW"] } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        referenceNumber: true,
        createdAt: true,
        status: true,
        customer: { select: { fullName: true } },
      },
    });
    return {
      serverTime,
      items: reqs.map((r) => ({
        id: r.id,
        referenceNumber: r.referenceNumber,
        title: r.customer.fullName,
        createdAt: r.createdAt.toISOString(),
        href: `/admin/requests/${r.referenceNumber}`,
        status: r.status,
      })),
    };
  }

  if (session.role === "EMPLOYEE") {
    const reqs = await prisma.request.findMany({
      where: { assignedEmployeeId: session.userId, status: "EMPLOYEE_ASSIGNED" },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        referenceNumber: true,
        createdAt: true,
        status: true,
        customer: { select: { fullName: true } },
      },
    });
    return {
      serverTime,
      items: reqs.map((r) => ({
        id: r.id,
        referenceNumber: r.referenceNumber,
        title: r.customer.fullName,
        createdAt: r.createdAt.toISOString(),
        href: `/employee/requests/${r.referenceNumber}`,
        status: r.status,
      })),
    };
  }

  // DRIVER
  const tasks = await prisma.driverTask.findMany({
    where: { driverId: session.userId, status: { in: ["PENDING", "ACCEPTED"] } },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      id: true,
      status: true,
      createdAt: true,
      request: { select: { referenceNumber: true } },
    },
  });
  return {
    serverTime,
    items: tasks.map((t) => ({
      id: t.id,
      referenceNumber: t.request.referenceNumber,
      title: t.request.referenceNumber,
      createdAt: t.createdAt.toISOString(),
      href: "/driver",
      status: t.status,
    })),
  };
}
