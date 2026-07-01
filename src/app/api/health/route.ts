import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Liveness/readiness probe: confirms the process is up and the database is
// reachable. Always dynamic so it reflects live state, never a cached response.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up" });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
