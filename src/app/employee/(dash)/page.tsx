import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AssignedListHeader } from "./AssignedListHeader";

export const dynamic = "force-dynamic";

export default async function EmployeeHome() {
  const session = await getSession();
  if (!session) return null;

  // Employees see ONLY their assigned requests. Admins viewing this area see all.
  const where = session.role === "ADMIN" ? {} : { assignedEmployeeId: session.userId };

  const requests = await prisma.request.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { fullName: true, phone: true } } },
  });

  return (
    <div className="space-y-5">
      <AssignedListHeader count={requests.length} />
      <div className="grid gap-3">
        {requests.map((r) => (
          <Link
            key={r.id}
            href={`/employee/requests/${r.referenceNumber}`}
            className="luxe-card luxe-card-hover flex items-center justify-between p-4"
          >
            <div>
              <p className="font-mono text-sm font-semibold text-charcoal">{r.referenceNumber}</p>
              <p className="text-sm text-charcoal/60">{r.customer.fullName} · {r.customer.phone}</p>
            </div>
            <StatusBadge status={r.status} />
          </Link>
        ))}
        {requests.length === 0 && <EmptyState />}
      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="luxe-card p-10 text-center text-sm text-charcoal/40">—</div>;
}
