/**
 * Edge-safe session token primitives — signing and verifying the JWT, plus the
 * cookie name and payload shape. This module has NO `server-only` marker and no
 * `next/headers` dependency on purpose, so it can be shared by both the
 * Node-runtime auth helpers (`@/lib/auth`) and the Edge middleware. It relies
 * only on `jose` (Web Crypto) and `process.env`, which are available in both.
 */

import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE = "rtd_session";

export interface SessionPayload {
  userId: string;
  role: UserRole;
  email: string;
  fullName: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/** Sign a session JWT that expires after `maxAgeSeconds`. */
export async function signSession(payload: SessionPayload, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getSecret());
}

/** Verify a session token; returns the payload or null if invalid/missing secret. */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: String(payload.userId),
      role: payload.role as UserRole,
      email: String(payload.email),
      fullName: String(payload.fullName),
    };
  } catch {
    return null;
  }
}
