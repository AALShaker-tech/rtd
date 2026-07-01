import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail, sendSms } from "./notify.service";
import { isVerifiedWithinWindow, DEFAULT_VERIFIED_WINDOW_MS } from "@/lib/verification-policy";
import type { VerificationPurpose, VerificationChannel } from "@prisma/client";

const TTL_MIN = Number(process.env.VERIFICATION_CODE_TTL_MINUTES ?? 10);
const MAX_ATTEMPTS = 5;
// How long a successful verification stays valid for a later request submission.
const VERIFIED_WINDOW_MS =
  Number(process.env.VERIFICATION_VALID_HOURS ?? 24) * 60 * 60 * 1000 || DEFAULT_VERIFIED_WINDOW_MS;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueVerificationCode(params: {
  target: string;
  purpose: VerificationPurpose;
  channel: VerificationChannel;
}): Promise<{ ok: true; devCode?: string } | { ok: false; error: string }> {
  const { target, purpose, channel } = params;
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + TTL_MIN * 60_000);

  // Invalidate prior unconsumed codes by deleting them. We deliberately do NOT
  // mark them `consumed`, because `consumed: true` must mean "successfully
  // verified" and nothing else — that is what isTargetVerified() relies on.
  await prisma.verificationCode.deleteMany({
    where: { target, purpose, consumed: false },
  });

  await prisma.verificationCode.create({
    data: { target, purpose, channel, codeHash, expiresAt },
  });

  const body =
    purpose === "PHONE"
      ? `RTD verification code: ${code}. Valid for ${TTL_MIN} minutes.`
      : `Your RTD verification code is ${code}. It expires in ${TTL_MIN} minutes.`;

  try {
    if (channel === "EMAIL") {
      await sendEmail({ to: target, subject: "RTD verification code", body });
    } else {
      await sendSms({ to: target, body }, channel);
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send code" };
  }

  // Surface the code in development so it can be tested without a provider.
  const devCode = process.env.NODE_ENV !== "production" ? code : undefined;
  return { ok: true, devCode };
}

export async function verifyCode(params: {
  target: string;
  purpose: VerificationPurpose;
  code: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { target, purpose, code } = params;
  const record = await prisma.verificationCode.findFirst({
    where: { target, purpose, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, error: "No active code. Please request a new one." };
  if (record.expiresAt < new Date()) return { ok: false, error: "Code expired. Please request a new one." };
  if (record.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Too many attempts. Please request a new code." };

  const match = await bcrypt.compare(code, record.codeHash);
  if (!match) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Incorrect code." };
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { consumed: true },
  });
  return { ok: true };
}

/**
 * Authoritative, server-side check of whether a target (E.164 phone / email)
 * has been verified recently. Never trust a client-supplied "verified" flag —
 * derive it from a consumed verification code instead.
 */
export async function isTargetVerified(
  target: string,
  purpose: VerificationPurpose,
  now: Date = new Date(),
): Promise<boolean> {
  const records = await prisma.verificationCode.findMany({
    where: { target, purpose, consumed: true },
    select: { consumed: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return isVerifiedWithinWindow(records, now, VERIFIED_WINDOW_MS);
}
