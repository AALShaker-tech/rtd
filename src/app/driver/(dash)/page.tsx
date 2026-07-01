import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { DriverTasksView } from "./DriverTasksView";

export const dynamic = "force-dynamic";

export default async function DriverHome() {
  const session = await getSession();
  if (!session) return null;

  const where = session.role === "ADMIN" ? {} : { driverId: session.userId };

  const tasks = await prisma.driverTask.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      request: { include: { customer: { select: { fullName: true, phone: true } } } },
      journeyStep: true,
    },
  });

  return <DriverTasksView tasks={serialize(tasks)} />;
}
