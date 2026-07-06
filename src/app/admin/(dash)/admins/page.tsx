import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { AdminsTitle } from "./AdminsTitle";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const session = await getSession();
  if (!session || !isSuperAdmin(session.role)) redirect("/admin");

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
        mustSetPassword: a.mustSetPassword,
        lastSeenAt: a.lastSeenAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
        count: a._count.auditLogs,
      }))}
    />
  );
}
