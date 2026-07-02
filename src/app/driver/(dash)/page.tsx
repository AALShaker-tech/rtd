import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { isoOrNull } from "@/lib/utils";
import { DriverTasksView, type Task } from "./DriverTasksView";

export const dynamic = "force-dynamic";

export default async function DriverHome() {
  const session = await getSession();
  if (!session) return null;

  const where = isAdmin(session.role) ? {} : { driverId: session.userId };

  // Fetch ONLY the fields the driver view needs — a driver must not receive the
  // full request (pricing, internal fields, etc.). The explicit DTO mapping
  // below is type-checked against `Task`, so any missing field fails the build.
  const rows = await prisma.driverTask.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      status: true,
      driverNotes: true,
      request: {
        select: {
          referenceNumber: true,
          customer: { select: { fullName: true, phone: true } },
        },
      },
      journeyStep: {
        select: {
          stepType: true,
          city: true,
          scheduledAt: true,
          pickupLocation: true,
          dropoffLocation: true,
          hotelName: true,
          homeAddress: true,
          flightNumber: true,
          carCategory: true,
          passengers: true,
          bags: true,
          notes: true,
        },
      },
    },
  });

  const tasks: Task[] = rows.map((r) => ({
    id: r.id,
    status: r.status,
    driverNotes: r.driverNotes,
    request: {
      referenceNumber: r.request.referenceNumber,
      customer: { fullName: r.request.customer.fullName, phone: r.request.customer.phone },
    },
    journeyStep: {
      stepType: r.journeyStep.stepType,
      city: r.journeyStep.city,
      scheduledAt: isoOrNull(r.journeyStep.scheduledAt),
      pickupLocation: r.journeyStep.pickupLocation,
      dropoffLocation: r.journeyStep.dropoffLocation,
      hotelName: r.journeyStep.hotelName,
      homeAddress: r.journeyStep.homeAddress,
      flightNumber: r.journeyStep.flightNumber,
      carCategory: r.journeyStep.carCategory,
      passengers: r.journeyStep.passengers,
      bags: r.journeyStep.bags,
      notes: r.journeyStep.notes,
    },
  }));

  return <DriverTasksView tasks={tasks} />;
}
