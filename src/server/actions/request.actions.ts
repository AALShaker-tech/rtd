"use server";

import { prisma } from "@/lib/prisma";
import { createRequestSchema } from "@/lib/validation/schemas";
import { validateJourney } from "@/lib/validation/journey";
import { createRequest } from "@/server/services/request.service";
import { logger } from "@/lib/logger";
import type { JourneyDraft } from "@/lib/types";

export async function submitJourney(raw: unknown) {
  const parsed = createRequestSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn("submitJourney: schema parse failed", { issues: parsed.error.issues?.slice(0, 5) });
    return { ok: false as const, error: "Please review your journey — some details are invalid." };
  }

  // Server-side authoritative re-validation (never trust the client).
  const draft = parsed.data as unknown as JourneyDraft;
  const validation = validateJourney(draft);
  logger.info("submitJourney: validated", {
    hasErrors: validation.hasErrors,
    errorCount:
      validation.steps.reduce((n, s) => n + s.errors.length, 0) +
      validation.timeline.filter((i) => i.severity === "error").length,
  });
  if (validation.hasErrors) {
    // Request is NOT created when validation truly fails.
    return {
      ok: false as const,
      error: "Your journey has unresolved issues.",
      issues: validation,
    };
  }

  try {
    const request = await createRequest(parsed.data);
    logger.info("submitJourney: request created", { reference: request.referenceNumber });
    return { ok: true as const, referenceNumber: request.referenceNumber };
  } catch (e) {
    logger.error("submitJourney: createRequest failed", { err: e });
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Something went wrong. Please try again.",
    };
  }
}

/** Public status lookup by reference number. */
export async function lookupRequest(referenceNumber: string) {
  const ref = referenceNumber.trim().toUpperCase();
  const request = await prisma.request.findUnique({
    where: { referenceNumber: ref },
    select: {
      referenceNumber: true,
      status: true,
      createdAt: true,
      selectedPackage: true,
      customer: { select: { fullName: true } },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        select: { toStatus: true, createdAt: true },
      },
    },
  });
  if (!request) return { ok: false as const };
  return { ok: true as const, request };
}
