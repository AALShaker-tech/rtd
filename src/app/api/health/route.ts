import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Liveness/readiness probe: confirms the process is up and the database is
// reachable. Always dynamic so it reflects live state, never a cached response.
export const dynamic = "force-dynamic";

/** Commit of the running build, so a deploy can be verified from outside.
 * Railway injects RAILWAY_GIT_COMMIT_SHA automatically. */
const commit =
  process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || "unknown";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up", commit });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down", commit }, { status: 503 });
  }
}
