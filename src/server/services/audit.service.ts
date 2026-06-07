import "server-only";
import { prisma } from "@/lib/prisma";

export async function logAudit(params: {
  action: string;
  entity: string;
  entityId: string;
  actorId?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      actorId: params.actorId ?? null,
      requestId: params.requestId ?? null,
      metadata: params.metadata ? (params.metadata as object) : undefined,
    },
  });
}
