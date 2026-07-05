"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/server/services/audit.service";
import { getCityCatalog } from "@/server/services/city.service";
import type { Catalog } from "@/lib/catalog";
import type { StepType } from "@prisma/client";

/** Public: the active city catalog used by the customer flow. */
export async function fetchCityCatalog(): Promise<Catalog> {
  return getCityCatalog();
}

async function requireAdmin() {
  const s = await getSession();
  if (!s || !isAdmin(s.role)) throw new Error("Unauthorized");
  return s;
}

const citySchema = z.object({
  code: z
    .string()
    .min(2)
    .max(8)
    .transform((v) => v.toUpperCase()),
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  country: z
    .string()
    .min(2)
    .max(2)
    .transform((v) => v.toUpperCase()),
  active: z.boolean().default(true),
  isOrigin: z.boolean().default(false),
  currency: z.string().optional(),
  approxDurationMinutes: z.number().int().min(0).max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

export async function upsertCity(raw: unknown) {
  const s = await requireAdmin();
  const p = citySchema.safeParse(raw);
  if (!p.success) return { ok: false as const, error: "Invalid city data" };
  const d = p.data;
  await prisma.city.upsert({
    where: { code: d.code },
    update: {
      nameEn: d.nameEn,
      nameAr: d.nameAr,
      country: d.country,
      active: d.active,
      isOrigin: d.isOrigin,
      currency: d.currency ?? null,
      approxDurationMinutes: d.approxDurationMinutes ?? null,
      notes: d.notes ?? null,
    },
    create: {
      code: d.code,
      nameEn: d.nameEn,
      nameAr: d.nameAr,
      country: d.country,
      active: d.active,
      isOrigin: d.isOrigin,
      currency: d.currency ?? null,
      approxDurationMinutes: d.approxDurationMinutes ?? null,
      notes: d.notes ?? null,
    },
  });
  await logAudit({
    action: "CITY_SAVED",
    entity: "City",
    entityId: d.code,
    actorId: s.userId,
    metadata: { active: d.active },
  });
  revalidatePath("/admin/cities");
  return { ok: true as const };
}

export async function setCityActive(code: string, active: boolean) {
  const s = await requireAdmin();
  await prisma.city.update({ where: { code }, data: { active } });
  await logAudit({
    action: "CITY_ACTIVE_TOGGLED",
    entity: "City",
    entityId: code,
    actorId: s.userId,
    metadata: { active },
  });
  revalidatePath("/admin/cities");
  return { ok: true as const };
}

const airportSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(4)
    .transform((v) => v.toUpperCase()),
  cityCode: z.string().transform((v) => v.toUpperCase()),
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  terminals: z.array(z.string()).default([]),
  timezone: z.string().optional(),
  utcOffsetMinutes: z.number().int().min(-720).max(840).default(0),
});

export async function upsertAirport(raw: unknown) {
  const s = await requireAdmin();
  const p = airportSchema.safeParse(raw);
  if (!p.success) return { ok: false as const, error: "Invalid airport data" };
  const d = p.data;
  const city = await prisma.city.findUnique({ where: { code: d.cityCode } });
  if (!city) return { ok: false as const, error: "City not found" };
  await prisma.airport.upsert({
    where: { code: d.code },
    update: {
      nameEn: d.nameEn,
      nameAr: d.nameAr,
      cityId: city.id,
      terminals: d.terminals,
      timezone: d.timezone ?? null,
      utcOffsetMinutes: d.utcOffsetMinutes,
      country: city.country,
    },
    create: {
      code: d.code,
      nameEn: d.nameEn,
      nameAr: d.nameAr,
      cityId: city.id,
      terminals: d.terminals,
      timezone: d.timezone ?? null,
      utcOffsetMinutes: d.utcOffsetMinutes,
      country: city.country,
    },
  });
  await logAudit({
    action: "AIRPORT_SAVED",
    entity: "Airport",
    entityId: d.code,
    actorId: s.userId,
  });
  revalidatePath("/admin/cities");
  return { ok: true as const };
}

export async function setCityServicePrice(
  cityCode: string,
  stepType: string,
  price: number | null,
  enabled: boolean,
) {
  const s = await requireAdmin();
  if (price != null && price < 0) return { ok: false as const, error: "Price cannot be negative" };
  await prisma.cityServicePricing.upsert({
    where: { cityCode_stepType: { cityCode, stepType: stepType as StepType } },
    update: { price, enabled },
    create: { cityCode, stepType: stepType as StepType, price, enabled },
  });
  await logAudit({
    action: "CITY_SERVICE_PRICE_SET",
    entity: "CityServicePricing",
    entityId: `${cityCode}:${stepType}`,
    actorId: s.userId,
    metadata: { price, enabled },
  });
  revalidatePath("/admin/cities");
  return { ok: true as const };
}

export async function setCityServiceClassPrice(
  cityCode: string,
  stepType: string,
  category: string,
  price: number | null,
) {
  const s = await requireAdmin();
  if (price != null && price < 0) return { ok: false as const, error: "Price cannot be negative" };
  if (price == null) {
    // Blank clears the per-city override → falls back to the global price.
    await prisma.cityServiceClassPrice.deleteMany({
      where: { cityCode, stepType: stepType as StepType, category },
    });
  } else {
    await prisma.cityServiceClassPrice.upsert({
      where: { cityCode_stepType_category: { cityCode, stepType: stepType as StepType, category } },
      update: { price },
      create: { cityCode, stepType: stepType as StepType, category, price },
    });
  }
  await logAudit({
    action: "CITY_SERVICE_CLASS_PRICE_SET",
    entity: "CityServiceClassPrice",
    entityId: `${cityCode}:${stepType}:${category}`,
    actorId: s.userId,
    metadata: { price },
  });
  revalidatePath("/admin/cities");
  return { ok: true as const };
}

/** Per-city vehicle availability (enable/disable a class in a city). */
export async function setCityVehicleEnabled(cityCode: string, category: string, enabled: boolean) {
  const s = await requireAdmin();
  await prisma.cityVehiclePricing.upsert({
    where: { cityCode_category: { cityCode, category } },
    update: { enabled },
    create: { cityCode, category, enabled },
  });
  await logAudit({
    action: "CITY_VEHICLE_ENABLED_SET",
    entity: "CityVehiclePricing",
    entityId: `${cityCode}:${category}`,
    actorId: s.userId,
    metadata: { enabled },
  });
  revalidatePath("/admin/cities");
  return { ok: true as const };
}

export async function setCityLoungePrice(
  cityCode: string,
  loungeType: string,
  price: number | null,
  enabled: boolean,
) {
  const s = await requireAdmin();
  if (price != null && price < 0) return { ok: false as const, error: "Price cannot be negative" };
  await prisma.cityLoungePricing.upsert({
    where: { cityCode_loungeType: { cityCode, loungeType } },
    update: { price, enabled },
    create: { cityCode, loungeType, price, enabled },
  });
  await logAudit({
    action: "CITY_LOUNGE_PRICE_SET",
    entity: "CityLoungePricing",
    entityId: `${cityCode}:${loungeType}`,
    actorId: s.userId,
    metadata: { price, enabled },
  });
  revalidatePath("/admin/cities");
  return { ok: true as const };
}
