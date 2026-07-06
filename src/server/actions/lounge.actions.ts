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

const loungeSchema = z.object({
  id: z.string().optional(), // absent → create
  nameEn: z.string().min(1).max(120),
  nameAr: z.string().min(1).max(120),
  descriptionEn: z.string().max(2000),
  descriptionAr: z.string().max(2000),
  sortOrder: z.number().int().min(0).max(999),
  active: z.boolean(),
});

/** Create or update a lounge (catalog entry). */
export async function upsertLounge(raw: unknown) {
  const s = await requireAdmin();
  const p = loungeSchema.safeParse(raw);
  if (!p.success) return { ok: false as const, error: "Invalid lounge data" };
  const { id, ...data } = p.data;
  const row = id
    ? await prisma.lounge.update({ where: { id }, data })
    : await prisma.lounge.create({ data });
  await logAudit({
    action: id ? "LOUNGE_UPDATED" : "LOUNGE_CREATED",
    entity: "Lounge",
    entityId: row.id,
    actorId: s.userId,
    metadata: { active: data.active },
  });
  revalidatePath("/admin/lounges");
  revalidatePath("/admin/cities");
  return { ok: true as const };
}

export async function deleteLounge(id: string) {
  const s = await requireAdmin();
  // AirportLounge rows cascade-delete via the FK.
  await prisma.lounge.delete({ where: { id } });
  await logAudit({ action: "LOUNGE_DELETED", entity: "Lounge", entityId: id, actorId: s.userId });
  revalidatePath("/admin/lounges");
  revalidatePath("/admin/cities");
  return { ok: true as const };
}

const airportLoungeSchema = z.object({
  airportCode: z.string().min(2).max(8),
  loungeId: z.string().min(1),
  enabled: z.boolean(),
  price: z.number().int().min(0),
});

/** Enable/disable a lounge at an airport and set its per-airport price. */
export async function setAirportLounge(raw: unknown) {
  const s = await requireAdmin();
  const p = airportLoungeSchema.safeParse(raw);
  if (!p.success) return { ok: false as const, error: "Invalid data" };
  const { airportCode, loungeId, enabled, price } = p.data;
  await prisma.airportLounge.upsert({
    where: { airportCode_loungeId: { airportCode, loungeId } },
    update: { enabled, price },
    create: { airportCode, loungeId, enabled, price },
  });
  await logAudit({
    action: "AIRPORT_LOUNGE_SET",
    entity: "AirportLounge",
    entityId: `${airportCode}:${loungeId}`,
    actorId: s.userId,
    metadata: { enabled, price },
  });
  revalidatePath("/admin/cities");
  return { ok: true as const };
}
