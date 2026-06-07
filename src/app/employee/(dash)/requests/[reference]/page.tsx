import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmployeeRequestView } from "./EmployeeRequestView";

export const dynamic = "force-dynamic";

export default async function EmployeeRequestPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/employee/login");

  const { reference } = await params;
  const request = await prisma.request.findUnique({
    where: { referenceNumber: decodeURIComponent(reference).toUpperCase() },
    include: {
      customer: true,
      journeySteps: { orderBy: { stepOrder: "asc" } },
      internalNotes: { orderBy: { createdAt: "desc" }, include: { author: { select: { fullName: true } } } },
    },
  });
  if (!request) notFound();

  // Enforce ownership: an employee may only view their own assignments.
  if (session.role === "EMPLOYEE" && request.assignedEmployeeId !== session.userId) {
    redirect("/employee");
  }

  return <EmployeeRequestView request={JSON.parse(JSON.stringify(request))} />;
}
