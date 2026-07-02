import "server-only";
import { prisma } from "@/lib/prisma";
import { hashSetupToken } from "@/lib/setup-token";

/**
 * Resolve the account a raw setup token belongs to, if the token is valid:
 * it must match the stored hash, be unexpired, and belong to an active account
 * still awaiting first-time password setup. Returns null otherwise.
 */
export async function findUserBySetupToken(token: string) {
  if (!token) return null;
  return prisma.user.findFirst({
    where: {
      setupTokenHash: hashSetupToken(token),
      setupTokenExpiresAt: { gt: new Date() },
      mustSetPassword: true,
      isActive: true,
    },
  });
}
