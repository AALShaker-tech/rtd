import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SuccessView } from "./SuccessView";
import { getPublicConfig } from "@/server/services/settings.service";
import type { JourneyStepInput } from "@/lib/types";

export default async function SuccessPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const request = await prisma.request.findUnique({
    where: { referenceNumber: decodeURIComponent(reference).toUpperCase() },
    include: {
      customer: true,
      journeySteps: { orderBy: { stepOrder: "asc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      flightSnapshots: true,
    },
  });

  if (!request) notFound();

  const snapToLine = (s: (typeof request.flightSnapshots)[number] | undefined) =>
    s
      ? {
          flightCode: s.flightCode,
          airline: s.airline,
          originAirport: s.originAirport,
          destinationAirport: s.destinationAirport,
          departureDate: s.departureDate ? s.departureDate.toISOString().slice(0, 10) : null,
          departureTimeLocal: s.departureTimeLocal,
          estimatedArrivalDate: s.estimatedArrivalDate
            ? s.estimatedArrivalDate.toISOString().slice(0, 10)
            : null,
          estimatedArrivalTimeLocal: s.estimatedArrivalTimeLocal,
        }
      : null;
  const departureFlight = snapToLine(request.flightSnapshots.find((s) => s.leg === "DEPARTURE"));
  const returnFlight = snapToLine(request.flightSnapshots.find((s) => s.leg === "RETURN"));

  // Map DB steps → the shared input shape for the WhatsApp summary builder.
  const steps: JourneyStepInput[] = request.journeySteps.map((s) => ({
    stepType: s.stepType,
    serviceType: s.serviceType,
    skipped: s.skipped,
    city: s.city ?? undefined,
    airport: s.airport ?? undefined,
    terminal: s.terminal ?? undefined,
    loungeType: s.loungeType ?? undefined,
    flightNumber: s.flightNumber ?? undefined,
    date: s.scheduledAt ? s.scheduledAt.toISOString().slice(0, 10) : undefined,
    time: s.scheduledAt ? s.scheduledAt.toISOString().slice(11, 16) : undefined,
    pickupLocation: s.pickupLocation ?? undefined,
    dropoffLocation: s.dropoffLocation ?? undefined,
    hotelName: s.hotelName ?? undefined,
    hotelAddress: s.hotelAddress ?? undefined,
    homeAddress: s.homeAddress ?? undefined,
    carCategory: s.carCategory ?? undefined,
    passengers: s.passengers ?? undefined,
    bags: s.bags ?? undefined,
    additionalVehicles: Array.isArray(s.additionalVehicles)
      ? (s.additionalVehicles as unknown as JourneyStepInput["additionalVehicles"])
      : undefined,
    notes: s.notes ?? undefined,
  }));

  const { whatsappNumber } = await getPublicConfig();

  return (
    <SuccessView
      whatsappNumber={whatsappNumber}
      referenceNumber={request.referenceNumber}
      status={request.status}
      customerName={request.customer.fullName}
      phone={request.customer.phone}
      selectedPackage={request.selectedPackage}
      carCategory={request.carCategory}
      passengers={request.passengers}
      bags={request.bags}
      estimatedTotal={request.estimatedTotal}
      specialAssistance={request.specialAssistance}
      assistanceNotes={request.assistanceNotes}
      departureFlight={departureFlight}
      returnFlight={returnFlight}
      notes={request.notes}
      steps={steps}
    />
  );
}
