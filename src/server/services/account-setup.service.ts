import "server-only";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { generateSetupToken, SETUP_TOKEN_TTL_MS } from "@/lib/setup-token";
import { sendEmail } from "@/server/services/notify.service";

/**
 * Issue a one-time password-setup token for an account and email the link. Used
 * both when a new staff account is created (activation) and when someone
 * requests a fresh link. Stores only the token hash; never throws on email
 * failure (returns { emailed:false } so callers can surface a fallback).
 */
export async function sendAccountSetupLink(user: { id: string; email: string }): Promise<{
  emailed: boolean;
}> {
  const { raw, hash } = generateSetupToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { setupTokenHash: hash, setupTokenExpiresAt: new Date(Date.now() + SETUP_TOKEN_TTL_MS) },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const link = `${base}/admin/set-password?token=${raw}`;
  const minutes = Math.round(SETUP_TOKEN_TTL_MS / 60000);
  try {
    await sendEmail({
      to: user.email,
      subject: "Set up your RTD account | تفعيل حسابك في RTD",
      body:
        `Your RTD account is ready. Use this one-time link to set your password ` +
        `(valid for ${minutes} minutes):\n${link}\n\n` +
        `If you didn't expect this, you can ignore this email.\n\n` +
        `حسابك في RTD جاهز. استخدم هذا الرابط لمرة واحدة لتعيين كلمة المرور ` +
        `(صالح لمدة ${minutes} دقيقة):\n${link}`,
    });
    return { emailed: true };
  } catch (e) {
    logger.error("account setup link email failed", { err: e });
    return { emailed: false };
  }
}
