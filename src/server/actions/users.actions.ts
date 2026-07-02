"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { logAudit } from "@/server/services/audit.service";
import type { UserRole } from "@prisma/client";

const createUserSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(10, "Password must be at least 10 characters"),
  role: z.enum(["EMPLOYEE", "DRIVER", "ADMIN"]),
});

export async function createStaffUser(raw: unknown) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { ok: false as const, error: "Unauthorized" };

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (exists) return { ok: false as const, error: "Email already in use" };

  const user = await prisma.user.create({
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
      role: parsed.data.role as UserRole,
    },
  });

  await logAudit({
    action: "USER_CREATED",
    entity: "User",
    entityId: user.id,
    actorId: session.userId,
  });
  revalidatePath("/admin/employees");
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/admins");
  return { ok: true as const };
}

export async function toggleStaffActive(userId: string, isActive: boolean) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { ok: false as const, error: "Unauthorized" };
  if (userId === session.userId && !isActive) {
    return { ok: false as const, error: "You cannot deactivate your own account" };
  }
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/employees");
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/admins");
  return { ok: true as const };
}
