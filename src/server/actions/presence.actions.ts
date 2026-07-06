"use server";

import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { ONLINE_WINDOW_MS } from "@/lib/presence";

export interface OnlineUser {
  id: string;
  fullName: string;
  role: string;
  lastSeenAt: string;
}

/** Active staff seen within the presence window. Admin/superadmin only; read-only, safe to poll. */
export async function getOnlineUsers(): Promise<OnlineUser[]> {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) return [];

  const users = await prisma.user.findMany({
    where: { isActive: true, lastSeenAt: { gt: new Date(Date.now() - ONLINE_WINDOW_MS) } },
    orderBy: { lastSeenAt: "desc" },
    select: { id: true, fullName: true, role: true, lastSeenAt: true },
  });
  return users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    role: u.role,
    lastSeenAt: u.lastSeenAt!.toISOString(),
  }));
}
