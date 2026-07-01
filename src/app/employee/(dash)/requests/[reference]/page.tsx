import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayStepSelect, toDisplayStep } from "@/server/dto/journey-step";
import { EmployeeRequestView, type Data } from "./EmployeeRequestView";

export const dynamic = "force-dynamic";

export default async function EmployeeRequestPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/employee/login");

  const { reference } = await params;
  // Select only what the employee view renders; `assignedEmployeeId` is used for
  // the ownership check below but is not shipped to the client.
  const request = await prisma.request.findUnique({
    where: { referenceNumber: decodeURIComponent(reference).toUpperCase() },
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      selectedPackage: true,
      carCategory: true,
      passengers: true,
      bags: true,
      estimatedTotal: true,
      finalPrice: true,
      notes: true,
      contactMeInstead: true,
      assignedEmployeeId: true,
      customer: {
        select: {
          fullName: true,
          phone: true,
          email: true,
          phoneVerified: true,
          emailVerified: true,
          language: true,
        },
      },
      journeySteps: { orderBy: { stepOrder: "asc" }, select: displayStepSelect },
      internalNotes: {
        orderBy: { createdAt: "desc" },
        select: { id: true, body: true, createdAt: true, author: { select: { fullName: true } } },
      },
    },
  });
  if (!request) notFound();

  // Enforce ownership: an employee may only view their own assignments.
  if (session.role === "EMPLOYEE" && request.assignedEmployeeId !== session.userId) {
    redirect("/employee");
  }

  const dto: Data = {
    id: request.id,
    referenceNumber: request.referenceNumber,
    status: request.status,
    selectedPackage: request.selectedPackage,
    carCategory: request.carCategory,
    passengers: request.passengers,
    bags: request.bags,
    estimatedTotal: request.estimatedTotal,
    finalPrice: request.finalPrice,
    notes: request.notes,
    contactMeInstead: request.contactMeInstead,
    customer: {
      fullName: request.customer.fullName,
      phone: request.customer.phone,
      email: request.customer.email,
      phoneVerified: request.customer.phoneVerified,
      emailVerified: request.customer.emailVerified,
      language: request.customer.language,
    },
    journeySteps: request.journeySteps.map(toDisplayStep),
    internalNotes: request.internalNotes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
      author: n.author ? { fullName: n.author.fullName } : null,
    })),
  };

  return <EmployeeRequestView request={dto} />;
}
