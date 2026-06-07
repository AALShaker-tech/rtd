import "server-only";
import { prisma } from "@/lib/prisma";
import { buildReferenceNumber, combineDateTime } from "@/lib/utils";
import { getStep, serviceHasCar } from "@/lib/domain";
import { parsePhone } from "@/lib/phone";
import { logAudit } from "./audit.service";
import type { CreateRequestInput } from "@/lib/validation/schemas";
import type {
  CarCategory,
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

  // Derive trip-level defaults from the first transfer step that has a car.
  const carStep = input.steps.find((s) => !s.skipped && serviceHasCar(s.serviceType) && s.carCategory);
  const carCategory = (carStep?.carCategory ?? "VIP") as CarCategory;
  const passengers = carStep?.passengers ?? 1;
  const bags = carStep?.bags ?? 0;

  const result = await prisma.$transaction(async (tx) => {
    const referenceNumber = await nextReference(tx);

    const customer = await tx.customer.create({
      data: {
        fullName: input.customer.fullName,
        phone: e164,
        email: input.customer.email,
        language,
        phoneVerified: input.phoneVerified,
        emailVerified: input.emailVerified,
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
        contactMeInstead: input.customer.contactMeInstead,
        notes: input.customer.notes ?? null,
        validationStatus: "VALID",
      },
    });

    // Persist journey steps (in canonical order).
    const ordered = [...input.steps].sort(
      (a, b) => getStep(a.stepType).order - getStep(b.stepType).order,
    );

    for (let i = 0; i < ordered.length; i++) {
      const s = ordered[i];
      const scheduledAt = combineDateTime(s.date, s.time);
      const endAt = combineDateTime(s.endDate, s.endTime);

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
          carCategory: (s.carCategory ?? null) as CarCategory | null,
          passengers: s.passengers ?? null,
          bags: s.bags ?? null,
          days: s.days ?? null,
          dailyHours: s.dailyHours ?? null,
          skipped: s.skipped,
          notes: s.notes ?? null,
        },
      });

      // Spawn driver tasks for transport-type steps that aren't skipped.
      if (!s.skipped && STEP_DRIVER_TASK.has(s.stepType) && serviceHasCar(s.serviceType)) {
        await tx.driverTask.create({
          data: { requestId: request.id, journeyStepId: step.id, status: "PENDING" },
        });
      }
    }

    await tx.statusHistory.create({
      data: { requestId: request.id, toStatus: "REQUEST_RECEIVED" },
    });

    return request;
  });

  await logAudit({
    action: "REQUEST_CREATED",
    entity: "Request",
    entityId: result.id,
    requestId: result.id,
    metadata: { referenceNumber: result.referenceNumber },
  });

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
