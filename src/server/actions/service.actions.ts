"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/server/services/audit.service";

async function requireAdmin() {
  const s = await getSession();
  if (!s || !isAdmin(s.role)) throw new Error("Unauthorized");
  return s;
}

const codeRe = /^[A-Z][A-Z0-9_]*$/;

const serviceSchema = z.object({
  id: z.string().optional(), // absent → create
  code: z.string().min(2).max(40).regex(codeRe, "Use UPPER_SNAKE_CASE"),
  nameEn: z.string().min(1).max(120),
  nameAr: z.string().min(1).max(120),
  shortNameEn: z.string().min(1).max(60),
  shortNameAr: z.string().min(1).max(60),
  descriptionEn: z.string().max(1000),
  descriptionAr: z.string().max(1000),
  sortOrder: z.number().int().min(0).max(999),
  cityScope: z.enum(["RIYADH", "DESTINATION", "ANY"]),
  featTransfer: z.boolean(),
  featAssistance: z.boolean(),
  featFlight: z.boolean(),
  featHotel: z.boolean(),
  featHome: z.boolean(),
  featChauffeur: z.boolean(),
  createsDriverTask: z.boolean(),
  active: z.boolean(),
});

/** Create or update a service (journey step). */
export async function upsertServiceStep(raw: unknown) {
  const s = await requireAdmin();
  const p = serviceSchema.safeParse(raw);
  if (!p.success) return { ok: false as const, error: p.error.issues[0]?.message ?? "Invalid service data" };
  const { id, code, ...rest } = p.data;

  // Code must stay unique. On create, or on rename, reject a collision.
  const clash = await prisma.serviceStep.findUnique({ where: { code } });
  if (clash && clash.id !== id) return { ok: false as const, error: `Code "${code}" is already in use.` };

  const data = { code, ...rest };
  const row = id
    ? await prisma.serviceStep.update({ where: { id }, data })
    : await prisma.serviceStep.create({ data });
  await logAudit({
    action: id ? "SERVICE_UPDATED" : "SERVICE_CREATED",
    entity: "ServiceStep",
    entityId: row.id,
    actorId: s.userId,
    metadata: { code, active: rest.active },
  });
  revalidatePath("/admin/services");
  revalidatePath("/admin/pricing");
  return { ok: true as const };
}

export async function deleteServiceStep(id: string) {
  const s = await requireAdmin();
  const row = await prisma.serviceStep.findUnique({ where: { id } });
  if (!row) return { ok: false as const, error: "Service not found." };
  await prisma.serviceStep.delete({ where: { id } });
  await logAudit({ action: "SERVICE_DELETED", entity: "ServiceStep", entityId: id, actorId: s.userId, metadata: { code: row.code } });
  revalidatePath("/admin/services");
  revalidatePath("/admin/pricing");
  return { ok: true as const };
}
