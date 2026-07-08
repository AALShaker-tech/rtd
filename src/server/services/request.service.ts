import "server-only";
import { prisma } from "@/lib/prisma";
import { buildReferenceNumber, combineDateTime } from "@/lib/utils";
import { getStep, serviceHasCar } from "@/lib/domain";
import { toStepDef } from "@/lib/steps";
import { computeStepPrice } from "@/lib/pricing";
import { parsePhone } from "@/lib/phone";
import { logAudit } from "./audit.service";
import { getPricingConfig } from "./pricing.service";
import { getStepMap } from "./step.service";
import { isTargetVerified } from "./verification.service";
import { sendOpsAlert } from "./notify.service";
import { buildNewRequestAlert } from "@/lib/ops-alert";
import { logger } from "@/lib/logger";
import type { CreateRequestInput } from "@/lib/validation/schemas";
import type {
  Language,
  Prisma,
  RequestStatus,
} from "@prisma/client";

/** Generate the next sequential reference number for the current year. */
async function nextReference(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.request.count({
    where: { referenceNumber: { startsWith: `RTD-${year}-` } },
  });
  return buildReferenceNumber(count + 1);
}

/** Build a FlightSnapshot row for a leg, or null when no flight info exists. */
function buildSnapshot(
  leg: "DEPARTURE" | "RETURN",
  requestId: string,
  resolved: any,
  code: string | undefined,
  manualTime: string | undefined,
  date: string | undefined,
  status: string | undefined,
  destination: string | null,
) {
  if (resolved && resolved.flightCode) {
    return {
      requestId,
      leg,
      flightCode: resolved.flightCode,
      airline: resolved.airline ?? null,
      originAirport: resolved.originAirport ?? null,
      destinationAirport: resolved.destinationAirport ?? null,
      departureDate: combineDateTime(resolved.departureDate, resolved.departureTimeLocal),
      departureTimeLocal: resolved.departureTimeLocal ?? null,
      estimatedArrivalDate: combineDateTime(resolved.estimatedArrivalDate, resolved.estimatedArrivalTimeLocal),
      estimatedArrivalTimeLocal: resolved.estimatedArrivalTimeLocal ?? null,
      lookupSource: "static_schedule",
      lookupStatus: "static_matched",
    };
  }
  if (code || manualTime) {
    return {
      requestId,
      leg,
      flightCode: code ?? null,
      airline: null,
      originAirport: leg === "DEPARTURE" ? "RUH" : destination,
      destinationAirport: leg === "DEPARTURE" ? destination : "RUH",
      departureDate: combineDateTime(date, manualTime),
      departureTimeLocal: manualTime ?? null,
      estimatedArrivalDate: null,
      estimatedArrivalTimeLocal: null,
      lookupSource: "manual",
      lookupStatus: status ?? (code ? "not_found" : "manual"),
    };
  }
  return null;
}

const STEP_DRIVER_TASK = new Set([
  "HOME_TO_RIYADH_AIRPORT",
  "AIRPORT_TO_HOTEL",
  "HOTEL_TO_AIRPORT",
  "RIYADH_AIRPORT_TO_HOME",
  "CHAUFFEUR_DURING_STAY",
]);

export async function createRequest(input: CreateRequestInput) {
  const phone = parsePhone(input.customer.phone, input.customer.phoneCountry);
  const e164 = phone.e164 ?? input.customer.phone;
  const language = (input.customer.language.toUpperCase() as Language) ?? "EN";

  // Resolve each step's behavior from the admin-managed catalog (authoritative);
  // never trust the client-attached def.
  const stepMap = await getStepMap();
  // Authoritative server-side pricing — never trust the client estimate.
  const pricingConfig = await getPricingConfig();
  const steps = input.steps
    .map((s) => ({
      ...s,
      def: stepMap[s.stepType] ? toStepDef(stepMap[s.stepType]) : getStep(s.stepType),
    }))
    // Price-driven availability: a non-skipped service with no effective price
    // (0 / unset) is not actually offered — treat it as skipped so it can never
    // be booked, priced, or spawn a driver task, even from a stale client.
    .map((s) =>
      s.skipped || s.serviceType === "SKIP" || computeStepPrice({ ...s, skipped: false }, pricingConfig).computedPrice > 0
        ? s
        : { ...s, skipped: true, serviceType: "SKIP" as const },
    );

  // Trip-level passenger/bag counts come from the Trip Information step.
  // Vehicle category is derived from the first transfer that has a car.
  const carStep = steps.find((s) => !s.skipped && serviceHasCar(s.serviceType) && s.carCategory);
  const carCategory = carStep?.carCategory ?? "VIP";
  const passengers = input.tripInfo.passengers ?? carStep?.passengers ?? 1;
  const bags = input.tripInfo.bags ?? carStep?.bags ?? 0;
  const departureDate = combineDateTime(input.tripInfo.departureDate, null);
  const returnDate = combineDateTime(input.tripInfo.returnDate, null);

  // Authoritative server-side verification — never trust the client's
  // `phoneVerified` / `emailVerified` flags. A contact is only "verified" if a
  // matching code was actually consumed recently.
  const phoneVerified = await isTargetVerified(e164, "PHONE");
  const emailVerified = input.customer.email
    ? await isTargetVerified(input.customer.email, "EMAIL")
    : false;

  const stepBreakdowns = new Map(
    steps.map((s) => [s.stepType, computeStepPrice(s, pricingConfig)]),
  );
  const estimatedTotal = steps.reduce(
    (sum, s) => sum + (stepBreakdowns.get(s.stepType)?.computedPrice ?? 0),
    0,
  );

  const result = await prisma.$transaction(async (tx) => {
    const referenceNumber = await nextReference(tx);

    const customer = await tx.customer.create({
      data: {
        fullName: input.customer.fullName,
        phone: e164,
        email: input.customer.email ?? "",
        language,
        phoneVerified,
        emailVerified,
      },
    });

    const request = await tx.request.create({
      data: {
        referenceNumber,
        customerId: customer.id,
        status: "REQUEST_RECEIVED",
        selectedPackage: input.selectedPackage ?? null,
        preferredLanguage: language,
        carCategory,
        passengers,
        bags,
        children: input.customer.children,
        childSeat: input.customer.childSeat,
        departureDate,
        returnDate,
        specialAssistance: input.tripInfo.specialAssistance,
        assistanceNotes: input.tripInfo.assistanceNotes ?? null,
        contactMeInstead: input.customer.contactMeInstead,
        notes: input.customer.notes ?? null,
        validationStatus: "VALID",
        estimatedTotal,
        priceStatus: "ESTIMATED",
        paymentStatus: "UNPAID",
      },
    });

    // Persist journey steps (in canonical order).
    const ordered = [...steps].sort((a, b) => (a.def?.order ?? 0) - (b.def?.order ?? 0));

    for (let i = 0; i < ordered.length; i++) {
      const s = ordered[i];
      const scheduledAt = combineDateTime(s.date, s.time);
      // Chauffeur end date is auto-calculated as start + days; otherwise unused.
      let endAt: Date | null = null;
      if (s.def?.features?.chauffeur && scheduledAt && s.days) {
        // Business rule: end date = start date + number of days.
        endAt = new Date(scheduledAt);
        endAt.setDate(endAt.getDate() + Math.max(1, s.days));
      }
      const breakdown = stepBreakdowns.get(s.stepType);

      const step = await tx.journeyStep.create({
        data: {
          requestId: request.id,
          stepOrder: i + 1,
          stepType: s.stepType,
          city: s.city ?? null,
          airport: s.airport ?? null,
          terminal: s.terminal ?? null,
          loungeType: s.loungeType ?? null,
          flightNumber: s.flightNumber ?? null,
          scheduledAt,
          endAt,
          pickupLocation: s.pickupLocation ?? null,
          dropoffLocation: s.dropoffLocation ?? null,
          hotelName: s.hotelName ?? null,
          hotelAddress: s.hotelAddress ?? null,
          homeAddress: s.homeAddress ?? null,
          serviceType: s.serviceType,
          carCategory: s.carCategory ?? null,
          passengers: s.passengers ?? null,
          bags: s.bags ?? null,
          days: s.days ?? null,
          dailyHours: s.dailyHours ?? null,
          dailyUsage: s.dailyUsage ?? null,
          skipped: s.skipped,
          basePrice: breakdown?.basePrice ?? null,
          computedPrice: breakdown?.computedPrice ?? null,
          flightLookupStatus: s.flightLookupStatus ?? "MANUAL",
          flightData: s.flightData ? (s.flightData as object) : undefined,
          notes: s.notes ?? null,
        },
      });

      // Spawn driver tasks for transport-type steps that aren't skipped.
      const createsDriverTask = stepMap[s.stepType]?.createsDriverTask ?? STEP_DRIVER_TASK.has(s.stepType);
      if (!s.skipped && createsDriverTask && serviceHasCar(s.serviceType)) {
        await tx.driverTask.create({
          data: { requestId: request.id, journeyStepId: step.id, status: "PENDING" },
        });
      }
    }

    await tx.statusHistory.create({
      data: { requestId: request.id, toStatus: "REQUEST_RECEIVED" },
    });

    await tx.requestPriceHistory.create({
      data: { requestId: request.id, changeType: "RECALCULATED", newPrice: estimatedTotal, reason: "Initial estimate" },
    });

    // Preserve the flight details as resolved at request time.
    const ti = input.tripInfo;
    const snapshots = [
      buildSnapshot("DEPARTURE", request.id, ti.departureFlight, ti.departureFlightCode, ti.departureTime, ti.departureDate, ti.departureLookupStatus, input.destination ?? null),
      buildSnapshot("RETURN", request.id, ti.returnFlight, ti.returnFlightCode, ti.returnTime, ti.returnDate, ti.returnLookupStatus, input.destination ?? null),
    ].filter((s): s is NonNullable<typeof s> => s !== null);
    if (snapshots.length) await tx.flightSnapshot.createMany({ data: snapshots });

    return request;
  });

  await logAudit({
    action: "REQUEST_CREATED",
    entity: "Request",
    entityId: result.id,
    requestId: result.id,
    metadata: { referenceNumber: result.referenceNumber },
  });

  // Alert operations about the new request. Fire-and-forget: a notification
  // failure must never break a successful submission.
  try {
    await sendOpsAlert(
      buildNewRequestAlert({
        referenceNumber: result.referenceNumber,
        customerName: input.customer.fullName,
        phone: e164,
        destination: input.destination ?? null,
        estimatedTotal,
        currency: "SAR",
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
        contactMeInstead: input.customer.contactMeInstead,
      }),
    );
  } catch (e) {
    logger.error("ops alert failed", { err: e, reference: result.referenceNumber });
  }

  return result;
}

/**
 * Create a request from a package booking — a standalone product (flat price,
 * name snapshot, no journey steps). No OTP; the customer just supplies contact
 * details and optional notes.
 */
export async function createPackageRequest(input: {
  packageId: string;
  fullName: string;
  phone: string;
  phoneCountry: string;
  email?: string;
  language: "en" | "ar";
  notes?: string;
}) {
  const pkg = await prisma.servicePackage.findUnique({ where: { id: input.packageId } });
  if (!pkg || !pkg.active) return null;

  const phone = parsePhone(input.phone, input.phoneCountry);
  const e164 = phone.e164 ?? input.phone;
  const language = (input.language.toUpperCase() as Language) ?? "EN";
  const price = pkg.price;

  const result = await prisma.$transaction(async (tx) => {
    const referenceNumber = await nextReference(tx);
    const customer = await tx.customer.create({
      data: {
        fullName: input.fullName,
        phone: e164,
        email: input.email ?? "",
        language,
        phoneVerified: false,
        emailVerified: false,
      },
    });
    const request = await tx.request.create({
      data: {
        referenceNumber,
        customerId: customer.id,
        status: "REQUEST_RECEIVED",
        selectedPackage: pkg.nameEn, // name snapshot (survives package deletion)
        preferredLanguage: language,
        carCategory: "VIP",
        passengers: 1,
        bags: 0,
        notes: input.notes ?? null,
        validationStatus: "VALID",
        estimatedTotal: price,
        finalPrice: price,
        priceStatus: "FINALIZED",
        paymentStatus: "UNPAID",
      },
    });
    await tx.statusHistory.create({ data: { requestId: request.id, toStatus: "REQUEST_RECEIVED" } });
    await tx.requestPriceHistory.create({
      data: { requestId: request.id, changeType: "RECALCULATED", newPrice: price, reason: "Package price" },
    });
    return request;
  });

  await logAudit({
    action: "REQUEST_CREATED",
    entity: "Request",
    entityId: result.id,
    requestId: result.id,
    metadata: { referenceNumber: result.referenceNumber, package: pkg.nameEn },
  });

  try {
    await sendOpsAlert(
      buildNewRequestAlert({
        referenceNumber: result.referenceNumber,
        customerName: input.fullName,
        phone: e164,
        destination: pkg.nameEn,
        estimatedTotal: price,
        currency: "SAR",
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
        contactMeInstead: false,
      }),
    );
  } catch (e) {
    logger.error("ops alert failed", { err: e, reference: result.referenceNumber });
  }

  return result;
}

export async function changeStatus(params: {
  requestId: string;
  toStatus: RequestStatus;
  actorId?: string;
  reason?: string;
}) {
  const current = await prisma.request.findUnique({ where: { id: params.requestId } });
  if (!current) throw new Error("Request not found");

  await prisma.$transaction([
    prisma.request.update({
      where: { id: params.requestId },
      data: { status: params.toStatus },
    }),
    prisma.statusHistory.create({
      data: {
        requestId: params.requestId,
        fromStatus: current.status,
        toStatus: params.toStatus,
        changedById: params.actorId ?? null,
        reason: params.reason ?? null,
      },
    }),
  ]);

  await logAudit({
    action: params.toStatus === "CANCELLED" ? "REQUEST_CANCELLED" : "STATUS_CHANGED",
    entity: "Request",
    entityId: params.requestId,
    actorId: params.actorId,
    requestId: params.requestId,
    metadata: { from: current.status, to: params.toStatus, reason: params.reason },
  });
}

export async function assignEmployee(requestId: string, employeeId: string | null, actorId?: string) {
  await prisma.request.update({
    where: { id: requestId },
    data: { assignedEmployeeId: employeeId },
  });
  if (employeeId) {
    await changeStatus({ requestId, toStatus: "EMPLOYEE_ASSIGNED", actorId });
  }
  await logAudit({
    action: "EMPLOYEE_ASSIGNED",
    entity: "Request",
    entityId: requestId,
    actorId,
    requestId,
    metadata: { employeeId },
  });
}

export async function assignDriver(requestId: string, driverId: string | null, actorId?: string) {
  await prisma.$transaction([
    prisma.request.update({ where: { id: requestId }, data: { assignedDriverId: driverId } }),
    prisma.driverTask.updateMany({ where: { requestId }, data: { driverId } }),
  ]);
  if (driverId) {
    await changeStatus({ requestId, toStatus: "DRIVER_ASSIGNED", actorId });
  }
  await logAudit({
    action: "DRIVER_ASSIGNED",
    entity: "Request",
    entityId: requestId,
    actorId,
    requestId,
    metadata: { driverId },
  });
}

/**
 * Admin sets the final price, or applies a discount/surcharge. Every change is
 * recorded with the old/new value, who changed it, and a reason (audit trail).
 */
export async function changeRequestPrice(params: {
  requestId: string;
  newPrice: number;
  changeType: "OVERRIDE" | "DISCOUNT" | "SURCHARGE";
  reason: string;
  actorId?: string;
}) {
  if (params.newPrice < 0) throw new Error("Price cannot be negative");
  if (!params.reason?.trim()) throw new Error("A reason is required for price changes");

  const current = await prisma.request.findUnique({ where: { id: params.requestId } });
  if (!current) throw new Error("Request not found");
  const oldPrice = current.finalPrice ?? current.estimatedTotal;

  await prisma.$transaction([
    prisma.request.update({
      where: { id: params.requestId },
      data: {
        finalPrice: params.newPrice,
        priceStatus: params.changeType === "OVERRIDE" ? "FINALIZED" : "ADJUSTED",
      },
    }),
    prisma.requestPriceHistory.create({
      data: {
        requestId: params.requestId,
        changeType: params.changeType,
        oldPrice,
        newPrice: params.newPrice,
        reason: params.reason.trim(),
        changedById: params.actorId ?? null,
      },
    }),
  ]);

  await logAudit({
    action: "PRICE_CHANGED",
    entity: "Request",
    entityId: params.requestId,
    actorId: params.actorId,
    requestId: params.requestId,
    metadata: { changeType: params.changeType, oldPrice, newPrice: params.newPrice, reason: params.reason },
  });
}

export async function setPaymentStatus(requestId: string, paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED", actorId?: string) {
  await prisma.request.update({ where: { id: requestId }, data: { paymentStatus } });
  await logAudit({
    action: "PAYMENT_STATUS_CHANGED",
    entity: "Request",
    entityId: requestId,
    actorId,
    requestId,
    metadata: { paymentStatus },
  });
}

/**
 * Permanently delete a request and all of its dependent records. This is a
 * destructive, non-recoverable operation reserved for superadmins. Every
 * child row (journey steps, driver tasks, status history, internal notes,
 * price history, flight snapshots) is removed via `onDelete: Cascade`. The
 * orphaned customer is cleaned up when no other request references it.
 * AuditLog rows survive (their `requestId` is set to null) so the deletion
 * itself remains traceable.
 */
export async function deleteRequest(requestId: string, actorId?: string) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { id: true, referenceNumber: true, customerId: true },
  });
  if (!request) throw new Error("Request not found");

  await prisma.$transaction(async (tx) => {
    // Cascades remove journeySteps, driverTasks, statusHistory, internalNotes,
    // priceHistory and flightSnapshots; auditLogs are detached (requestId null).
    await tx.request.delete({ where: { id: requestId } });

    // Remove the customer only if this was their last request.
    const remaining = await tx.request.count({ where: { customerId: request.customerId } });
    if (remaining === 0) {
      await tx.customer.delete({ where: { id: request.customerId } });
    }
  });

  await logAudit({
    action: "REQUEST_DELETED",
    entity: "Request",
    entityId: request.id,
    actorId,
    // Intentionally no requestId — the request no longer exists.
    metadata: { referenceNumber: request.referenceNumber },
  });

  return { referenceNumber: request.referenceNumber };
}

export async function addInternalNote(requestId: string, body: string, authorId?: string) {
  const note = await prisma.internalNote.create({
    data: { requestId, body, authorId: authorId ?? null },
  });
  await logAudit({
    action: "NOTE_ADDED",
    entity: "Request",
    entityId: requestId,
    actorId: authorId,
    requestId,
  });
  return note;
}
