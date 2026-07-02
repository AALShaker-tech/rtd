import { prisma } from "@/lib/prisma";
import { AdminsTitle } from "./AdminsTitle";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { auditLogs: true } } },
  });

  return (
    <AdminsTitle
      staff={admins.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        email: a.email,
        phone: a.phone,
        isActive: a.isActive,
        createdAt: a.createdAt.toISOString(),
        count: a._count.auditLogs,
      }))}
    />
  );
}
