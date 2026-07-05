"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/server/services/audit.service";
import { createPackageRequest } from "@/server/services/request.service";

async function requireAdmin() {
  const s = await getSession();
  if (!s || !isAdmin(s.role)) throw new Error("Unauthorized");
  return s;
}

const packageSchema = z.object({
  id: z.string().optional(), // absent → create
  nameEn: z.string().min(1).max(120),
  nameAr: z.string().min(1).max(120),
  descriptionEn: z.string().max(1000),
  descriptionAr: z.string().max(1000),
  price: z.number().int().min(0),
  featured: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
  active: z.boolean(),
});

/** Create or update a package. */
export async function upsertPackage(raw: unknown) {
  const s = await requireAdmin();
  const p = packageSchema.safeParse(raw);
  if (!p.success) return { ok: false as const, error: "Invalid package data" };
  const { id, ...data } = p.data;
  const row = id
    ? await prisma.servicePackage.update({ where: { id }, data })
    : await prisma.servicePackage.create({ data });
  await logAudit({
    action: id ? "PACKAGE_UPDATED" : "PACKAGE_CREATED",
    entity: "ServicePackage",
    entityId: row.id,
    actorId: s.userId,
    metadata: { price: data.price, active: data.active },
  });
  revalidatePath("/admin/packages");
  return { ok: true as const };
}

export async function deletePackage(id: string) {
  const s = await requireAdmin();
  await prisma.servicePackage.delete({ where: { id } });
  await logAudit({ action: "PACKAGE_DELETED", entity: "ServicePackage", entityId: id, actorId: s.userId });
  revalidatePath("/admin/packages");
  return { ok: true as const };
}

// ── Customer package booking (public) ──
const bookingSchema = z.object({
  packageId: z.string().min(1),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(5).max(25),
  phoneCountry: z.string().min(2).max(2).default("SA"),
  email: z.string().email().optional().or(z.literal("")),
  language: z.enum(["en", "ar"]).default("en"),
  notes: z.string().max(2000).optional(),
});

export async function submitPackageBooking(raw: unknown) {
  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "Please check your details and try again." };
  }
  try {
    const res = await createPackageRequest(parsed.data);
    if (!res) return { ok: false as const, error: "That package is no longer available." };
    return { ok: true as const, referenceNumber: res.referenceNumber };
  } catch {
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}
