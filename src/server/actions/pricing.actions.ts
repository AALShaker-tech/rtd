"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/server/services/audit.service";
import { changeRequestPrice, setPaymentStatus } from "@/server/services/request.service";
import { getPricingConfig } from "@/server/services/pricing.service";
import type { PricingConfig } from "@/lib/pricing";
import type { CarCategory, PaymentStatus, StepType } from "@prisma/client";

/** Public: the current pricing config, so the customer UI can show live estimates. */
export async function fetchPricingConfig(): Promise<PricingConfig> {
  return getPricingConfig();
}

async function requireAdmin() {
  const s = await getSession();
  if (!s || !isAdmin(s.role)) throw new Error("Unauthorized");
  return s;
}

// ── Service base prices ──
export async function updateServicePrice(stepType: StepType, basePrice: number, active: boolean) {
  const s = await requireAdmin();
  if (basePrice < 0) return { ok: false as const, error: "Price cannot be negative" };
  await prisma.servicePricing.upsert({
    where: { stepType },
    update: { basePrice, active },
    create: { stepType, basePrice, active },
  });
  await logAudit({
    action: "SERVICE_PRICE_UPDATED",
    entity: "ServicePricing",
    entityId: stepType,
    actorId: s.userId,
    metadata: { basePrice, active },
  });
  revalidatePath("/admin/pricing");
  return { ok: true as const };
}

// ── Vehicle multipliers ──
export async function updateVehicleMultiplier(category: CarCategory, priceMultiplier: number) {
  const s = await requireAdmin();
  if (priceMultiplier < 0) return { ok: false as const, error: "Multiplier cannot be negative" };
  await prisma.vehicleCategory.update({ where: { category }, data: { priceMultiplier } });
  await logAudit({
    action: "VEHICLE_MULTIPLIER_UPDATED",
    entity: "VehicleCategory",
    entityId: category,
    actorId: s.userId,
    metadata: { priceMultiplier },
  });
  revalidatePath("/admin/pricing");
  return { ok: true as const };
}

// ── Lounge prices ──
export async function updateLoungePrice(loungeType: string, price: number, active: boolean) {
  const s = await requireAdmin();
  if (price < 0) return { ok: false as const, error: "Price cannot be negative" };
  await prisma.loungePricing.upsert({
    where: { loungeType },
    update: { price, active },
    create: { loungeType, price, active },
  });
  await logAudit({
    action: "LOUNGE_PRICE_UPDATED",
    entity: "LoungePricing",
    entityId: loungeType,
    actorId: s.userId,
    metadata: { price, active },
  });
  revalidatePath("/admin/pricing");
  return { ok: true as const };
}

// Destination pricing is controlled by City.multiplier (Cities page). The old
// DestinationPricing table / updateDestinationPricing action were never wired to
// any UI and never read by the pricing engine, so they were removed to avoid a
// second, dead source of truth for the same concept.

// ── Per-request price override / adjustment ──
const priceChangeSchema = z.object({
  requestId: z.string(),
  newPrice: z.number().int().min(0),
  changeType: z.enum(["OVERRIDE", "DISCOUNT", "SURCHARGE"]),
  reason: z.string().min(2),
});

export async function adminChangeRequestPrice(raw: unknown) {
  const s = await requireAdmin();
  const parsed = priceChangeSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false as const, error: "A valid price and reason are required." };
  try {
    await changeRequestPrice({ ...parsed.data, actorId: s.userId });
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
  revalidatePath(`/admin/requests/${parsed.data.requestId}`);
  return { ok: true as const };
}

export async function adminSetPaymentStatus(requestId: string, paymentStatus: PaymentStatus) {
  const s = await requireAdmin();
  await setPaymentStatus(requestId, paymentStatus, s.userId);
  revalidatePath(`/admin/requests/${requestId}`);
  return { ok: true as const };
}
