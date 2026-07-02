"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addInternalNote,
  assignDriver,
  assignEmployee,
  changeStatus,
} from "@/server/services/request.service";
import { logAudit } from "@/server/services/audit.service";
import type { DriverTaskStatus, RequestStatus, UserRole } from "@prisma/client";

async function requireRole(roles: UserRole[]) {
  const session = await getSession();
  // SUPERADMIN is a superset of ADMIN, so it satisfies any ADMIN-gated action.
  const allowed = roles.includes("ADMIN") ? [...roles, "SUPERADMIN" as UserRole] : roles;
  if (!session || !allowed.includes(session.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ── Admin ──
export async function adminChangeStatus(requestId: string, status: RequestStatus, reason?: string) {
  const s = await requireRole(["ADMIN"]);
  await changeStatus({ requestId, toStatus: status, actorId: s.userId, reason });
  revalidatePath(`/admin/requests/${requestId}`);
  return { ok: true as const };
}

export async function adminAssignEmployee(requestId: string, employeeId: string | null) {
  const s = await requireRole(["ADMIN"]);
  await assignEmployee(requestId, employeeId, s.userId);
  revalidatePath(`/admin/requests/${requestId}`);
  return { ok: true as const };
}

export async function adminAssignDriver(requestId: string, driverId: string | null) {
  const s = await requireRole(["ADMIN"]);
  await assignDriver(requestId, driverId, s.userId);
  revalidatePath(`/admin/requests/${requestId}`);
  return { ok: true as const };
}

export async function adminAddNote(requestId: string, body: string) {
  const s = await requireRole(["ADMIN", "EMPLOYEE"]);
  if (!body.trim()) return { ok: false as const, error: "Empty note" };
  await addInternalNote(requestId, body.trim(), s.userId);
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath(`/employee/requests/${requestId}`);
  return { ok: true as const };
}

export async function adminCancelRequest(requestId: string, reason: string) {
  const s = await requireRole(["ADMIN"]);
  await changeStatus({ requestId, toStatus: "CANCELLED", actorId: s.userId, reason });
  revalidatePath(`/admin/requests/${requestId}`);
  return { ok: true as const };
}

// ── Employee ──
export async function employeeMarkContacted(requestId: string) {
  const s = await requireRole(["EMPLOYEE", "ADMIN"]);
  // Employees may only act on their own requests.
  const req = await prisma.request.findUnique({ where: { id: requestId } });
  if (!req) return { ok: false as const, error: "Not found" };
  if (s.role === "EMPLOYEE" && req.assignedEmployeeId !== s.userId) {
    return { ok: false as const, error: "Unauthorized" };
  }
  await changeStatus({ requestId, toStatus: "CLIENT_CONTACTED", actorId: s.userId });
  revalidatePath(`/employee/requests/${requestId}`);
  return { ok: true as const };
}

export async function employeeEscalate(requestId: string, note: string) {
  const s = await requireRole(["EMPLOYEE", "ADMIN"]);
  await addInternalNote(requestId, `[ESCALATION] ${note}`, s.userId);
  await logAudit({
    action: "ESCALATED",
    entity: "Request",
    entityId: requestId,
    actorId: s.userId,
    requestId,
  });
  revalidatePath(`/employee/requests/${requestId}`);
  return { ok: true as const };
}

// ── Driver ──
export async function driverUpdateTask(taskId: string, status: DriverTaskStatus, notes?: string) {
  const s = await requireRole(["DRIVER", "ADMIN"]);
  const task = await prisma.driverTask.findUnique({ where: { id: taskId } });
  if (!task) return { ok: false as const, error: "Not found" };
  if (s.role === "DRIVER" && task.driverId !== s.userId) {
    return { ok: false as const, error: "Unauthorized" };
  }
  await prisma.driverTask.update({
    where: { id: taskId },
    data: { status, ...(notes !== undefined ? { driverNotes: notes } : {}) },
  });

  // When a driver starts moving, reflect progress at the request level.
  if (status === "ON_THE_WAY" || status === "ARRIVED") {
    const req = await prisma.request.findUnique({ where: { id: task.requestId } });
    if (req && !["IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(req.status)) {
      await changeStatus({ requestId: task.requestId, toStatus: "IN_PROGRESS", actorId: s.userId });
    }
  }
  await logAudit({
    action: "DRIVER_TASK_UPDATED",
    entity: "DriverTask",
    entityId: taskId,
    actorId: s.userId,
    requestId: task.requestId,
    metadata: { status },
  });
  revalidatePath("/driver");
  return { ok: true as const };
}
