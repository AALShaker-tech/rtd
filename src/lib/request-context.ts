import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort client IP for rate limiting. Reads the standard forwarding
 * headers set by the platform's proxy/load balancer. Falls back to "unknown"
 * so a missing header degrades to a shared bucket rather than throwing.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}
