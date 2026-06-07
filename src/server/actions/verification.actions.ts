"use server";

import { parsePhone, isValidEmail } from "@/lib/phone";
import { issueVerificationCode, verifyCode } from "@/server/services/verification.service";
import { sendCodeSchema, verifyCodeSchema } from "@/lib/validation/schemas";

export async function sendVerificationCode(raw: unknown) {
  const parsed = sendCodeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Invalid request" };

  const { purpose, channel, phoneCountry } = parsed.data;
  let target = parsed.data.target;

  if (purpose === "PHONE") {
    const phone = parsePhone(target, phoneCountry ?? "SA");
    if (!phone.valid || !phone.e164) return { ok: false as const, error: "Invalid phone number" };
    target = phone.e164;
  } else {
    if (!isValidEmail(target)) return { ok: false as const, error: "Invalid email" };
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
