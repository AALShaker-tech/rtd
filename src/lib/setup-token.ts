import "server-only";
import { randomBytes, createHash } from "node:crypto";

/**
 * One-time account-setup tokens (used to bootstrap the superadmin password).
 * The raw token is emailed to the account owner; only its SHA-256 hash is stored,
 * so a database leak can't be replayed. High entropy (256 bits) makes plain
 * SHA-256 sufficient — no per-token salt needed.
 */

export const SETUP_TOKEN_TTL_MS = Number(process.env.SETUP_TOKEN_TTL_MS ?? 60 * 60 * 1000); // 1h

export function generateSetupToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashSetupToken(raw) };
}

export function hashSetupToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
