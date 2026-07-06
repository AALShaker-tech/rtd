import { prisma } from "@/lib/prisma";
import { StaffManager } from "@/components/dashboard/StaffManager";
import { DriversTitle } from "./DriversTitle";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { driverTasks: true } } },
  });

  return (
    <DriversTitle
      staff={drivers.map((d) => ({
        id: d.id,
        fullName: d.fullName,
        email: d.email,
        phone: d.phone,
        isActive: d.isActive,
        mustSetPassword: d.mustSetPassword,
        createdAt: d.createdAt.toISOString(),
        count: d._count.driverTasks,
      }))}
    />
  );
}
