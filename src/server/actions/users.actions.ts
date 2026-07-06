"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/roles";
import { logAudit } from "@/server/services/audit.service";
import { sendAccountSetupLink } from "@/server/services/account-setup.service";
import type { UserRole } from "@prisma/client";

const createUserSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["EMPLOYEE", "DRIVER", "ADMIN"]),
});

export async function createStaffUser(raw: unknown) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) return { ok: false as const, error: "Unauthorized" };

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Only a superadmin may create admin-level accounts.
  if (parsed.data.role === "ADMIN" && !isSuperAdmin(session.role)) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (exists) return { ok: false as const, error: "Email already in use" };

  // No password is set here: the account is created "pending activation" and the
  // new user sets their own password via an emailed one-time link.
  const user = await prisma.user.create({
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone || null,
      passwordHash: "",
      mustSetPassword: true,
      role: parsed.data.role as UserRole,
    },
  });

  await logAudit({
    action: "USER_CREATED",
    entity: "User",
    entityId: user.id,
    actorId: session.userId,
  });

  const { emailed } = await sendAccountSetupLink({ id: user.id, email: user.email });

  revalidatePath("/admin/employees");
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/admins");
  return { ok: true as const, emailed };
}

export async function toggleStaffActive(userId: string, isActive: boolean) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) return { ok: false as const, error: "Unauthorized" };
  if (userId === session.userId && !isActive) {
    return { ok: false as const, error: "You cannot deactivate your own account" };
  }
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return { ok: false as const, error: "User not found" };
  // Only a superadmin may (de)activate admin-level accounts.
  if (isAdmin(target.role) && !isSuperAdmin(session.role)) {
    return { ok: false as const, error: "Unauthorized" };
  }
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/employees");
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/admins");
  return { ok: true as const };
}
