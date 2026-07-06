/**
 * Presence window: a user counts as "online" if their lastSeenAt is within this
 * span. The dashboard refreshes lastSeenAt every 30s (the notification poll), so
 * a 2-minute window tolerates a few missed/throttled polls without flapping.
 */
export const ONLINE_WINDOW_MS = 2 * 60_000;

export function isOnline(lastSeenAt: Date | string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  const t = typeof lastSeenAt === "string" ? Date.parse(lastSeenAt) : lastSeenAt.getTime();
  return Number.isFinite(t) && Date.now() - t < ONLINE_WINDOW_MS;
}
