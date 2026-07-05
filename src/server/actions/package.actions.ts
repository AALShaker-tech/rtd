"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/server/services/audit.service";
import type { PackageType, StepType } from "@prisma/client";

async function requireAdmin() {
  const s = await getSession();
  if (!s || !isAdmin(s.role)) throw new Error("Unauthorized");
  return s;
}

const packageSchema = z.object({
  type: z.string(),
  nameEn: z.string().min(1).max(120),
  nameAr: z.string().min(1).max(120),
  descriptionEn: z.string().max(1000),
  descriptionAr: z.string().max(1000),
  includedSteps: z.array(z.string()).min(1),
  featured: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
  active: z.boolean(),
});

export async function updatePackage(raw: unknown) {
  const s = await requireAdmin();
  const p = packageSchema.safeParse(raw);
  if (!p.success) return { ok: false as const, error: "Invalid package data" };
  const d = p.data;
  const data = {
    nameEn: d.nameEn,
    nameAr: d.nameAr,
    descriptionEn: d.descriptionEn,
    descriptionAr: d.descriptionAr,
    includedSteps: d.includedSteps as StepType[],
    featured: d.featured,
    sortOrder: d.sortOrder,
    active: d.active,
  };
  await prisma.servicePackage.update({ where: { type: d.type as PackageType }, data });
  await logAudit({
    action: "PACKAGE_UPDATED",
    entity: "ServicePackage",
    entityId: d.type,
    actorId: s.userId,
    metadata: { featured: d.featured, active: d.active, sortOrder: d.sortOrder },
  });
  revalidatePath("/admin/packages");
  return { ok: true as const };
}
