/**
 * Pure verification policy — decides, from verification records, whether a
 * target (phone/email) counts as "verified" right now. Kept dependency-free so
 * it is unit-testable and can be reused by client and server.
 *
 * A record is trusted only when it was actually consumed by a successful code
 * check AND that happened within the validity window. This is what lets the
 * server ignore the client-supplied `phoneVerified` / `emailVerified` booleans
 * and re-derive the truth authoritatively.
 */

export interface VerifiedRecordView {
  /** True only after a correct code was entered (never for superseded codes). */
  consumed: boolean;
  /** When the underlying code was issued. */
  createdAt: Date;
}

/** Default window a successful verification stays valid for (24 hours). */
export const DEFAULT_VERIFIED_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * @returns true if any record was consumed within `windowMs` of `now`.
 */
export function isVerifiedWithinWindow(
  records: VerifiedRecordView[],
  now: Date,
  windowMs: number = DEFAULT_VERIFIED_WINDOW_MS,
): boolean {
  const cutoff = now.getTime() - windowMs;
  return records.some((r) => r.consumed && r.createdAt.getTime() >= cutoff);
}
