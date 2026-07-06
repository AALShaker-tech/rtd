import { prisma } from "@/lib/prisma";
import { StaffManager } from "@/components/dashboard/StaffManager";
import { EmployeesTitle } from "./EmployeesTitle";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { assignedAsEmployee: true } } },
  });

  return (
    <EmployeesTitle
      staff={employees.map((e) => ({
        id: e.id,
        fullName: e.fullName,
        email: e.email,
        phone: e.phone,
        isActive: e.isActive,
        mustSetPassword: e.mustSetPassword,
        createdAt: e.createdAt.toISOString(),
        count: e._count.assignedAsEmployee,
      }))}
    />
  );
}
