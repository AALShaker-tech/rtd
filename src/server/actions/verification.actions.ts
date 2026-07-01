"use server";

import { parsePhone, isValidEmail } from "@/lib/phone";
import { issueVerificationCode, verifyCode } from "@/server/services/verification.service";
import { sendCodeSchema, verifyCodeSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-context";

// Issuing a code sends a real SMS/email in production, so it costs money and can
// be weaponised (SMS bombing). Cap it: 10 per IP and 3 per contact, per 10 min.
const CODE_WINDOW_MS = 10 * 60_000;
const CODE_LIMIT_PER_IP = 10;
const CODE_LIMIT_PER_TARGET = 3;
const TOO_MANY = "Too many requests. Please wait a few minutes and try again.";

export async function sendVerificationCode(raw: unknown) {
  const parsed = sendCodeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Invalid request" };

  const ip = await clientIp();
  if (!rateLimit(`vc:ip:${ip}`, CODE_LIMIT_PER_IP, CODE_WINDOW_MS).allowed) {
    return { ok: false as const, error: TOO_MANY };
  }

  const { purpose, channel, phoneCountry } = parsed.data;
  let target = parsed.data.target;

  if (purpose === "PHONE") {
    const phone = parsePhone(target, phoneCountry ?? "SA");
    if (!phone.valid || !phone.e164) return { ok: false as const, error: "Invalid phone number" };
    target = phone.e164;
  } else {
    if (!isValidEmail(target)) return { ok: false as const, error: "Invalid email" };
  }

  // Per-contact cap (checked after normalising the target to E.164 / email).
  if (!rateLimit(`vc:target:${target}`, CODE_LIMIT_PER_TARGET, CODE_WINDOW_MS).allowed) {
    return { ok: false as const, error: TOO_MANY };
  }

  const res = await issueVerificationCode({ target, purpose, channel });
  if (!res.ok) return { ok: false as const, error: res.error };
  return { ok: true as const, target, devCode: res.devCode };
}

export async function confirmVerificationCode(raw: unknown) {
  const parsed = verifyCodeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Invalid request" };
  const res = await verifyCode(parsed.data);
  return res.ok ? { ok: true as const } : { ok: false as const, error: res.error };
}
