import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail, sendSms } from "./notify.service";
import type { VerificationChannel, VerificationPurpose } from "@prisma/client";

const TTL_MIN = Number(process.env.VERIFICATION_CODE_TTL_MINUTES ?? 10);
const MAX_ATTEMPTS = 5;

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

  // Invalidate prior unconsumed codes for this target/purpose.
  await prisma.verificationCode.updateMany({
    where: { target, purpose, consumed: false },
    data: { consumed: true },
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
