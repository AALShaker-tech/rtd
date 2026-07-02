"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { generateSetupToken, SETUP_TOKEN_TTL_MS } from "@/lib/setup-token";
import { loginSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-context";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/server/services/notify.service";
import { findUserBySetupToken } from "@/server/services/setup.service";

/** Where each role lands after authenticating. */
function homeFor(role: Parameters<typeof isAdmin>[0]): string {
  if (isAdmin(role)) return "/admin";
  return role === "EMPLOYEE" ? "/employee" : "/driver";
}

// Throttle sign-in attempts to blunt online brute force: at most 5 attempts per
// IP+email every 15 minutes.
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60_000;

export async function login(_prev: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "INVALID" as const };

  const email = parsed.data.email.toLowerCase();
  const ip = await clientIp();
  const limit = rateLimit(`login:${ip}:${email}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.allowed) return { error: "RATE_LIMITED" as const };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return { error: "INVALID" as const };

  // First-login accounts (e.g. the bootstrapped superadmin) have no usable
  // password yet — send them to request an emailed setup link instead of
  // failing the sign-in. The email prefills the request form only.
  if (user.mustSetPassword) {
    redirect(`/admin/set-password?email=${encodeURIComponent(email)}`);
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { error: "INVALID" as const };

  await createSession({
    userId: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
  });

  redirect(homeFor(user.role));
}

/**
 * Email a one-time password-setup link to an eligible account. Always returns a
 * generic success so it can't be used to enumerate accounts; the link only
 * reaches the account's own registered email address.
 */
export async function requestSetupLink(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!z.string().email().safeParse(email).success) return { error: "INVALID_EMAIL" as const };

  const ip = await clientIp();
  const limit = rateLimit(`setuplink:${ip}:${email}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.allowed) return { error: "RATE_LIMITED" as const };

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.isActive && user.mustSetPassword) {
    const { raw, hash } = generateSetupToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        setupTokenHash: hash,
        setupTokenExpiresAt: new Date(Date.now() + SETUP_TOKEN_TTL_MS),
      },
    });

    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const link = `${base}/admin/set-password?token=${raw}`;
    const minutes = Math.round(SETUP_TOKEN_TTL_MS / 60000);
    try {
      await sendEmail({
        to: user.email,
        subject: "Set up your RTD account | تفعيل حسابك في RTD",
        body:
          `Use this one-time link to set your password (valid for ${minutes} minutes):\n${link}\n\n` +
          `If you didn't request this, you can ignore this email.\n\n` +
          `استخدم هذا الرابط لمرة واحدة لتعيين كلمة المرور (صالح لمدة ${minutes} دقيقة):\n${link}`,
      });
    } catch (e) {
      // Never surface delivery errors to the caller (would leak eligibility).
      logger.error("setup link email failed", { err: e });
    }
  }

  return { sent: true as const };
}

const setPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(10),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "MISMATCH", path: ["confirm"] });

/**
 * Complete first-login setup with a valid one-time token: sets the password,
 * clears the token + `mustSetPassword`, and signs the user in.
 */
export async function setInitialPassword(_prev: unknown, formData: FormData) {
  const parsed = setPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.message === "MISMATCH"))
      return { error: "MISMATCH" as const };
    if (parsed.error.issues.some((i) => i.path[0] === "token"))
      return { error: "INVALID" as const };
    return { error: "WEAK" as const };
  }

  const ip = await clientIp();
  const limit = rateLimit(`setpw:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.allowed) return { error: "RATE_LIMITED" as const };

  const user = await findUserBySetupToken(parsed.data.token);
  if (!user) return { error: "INVALID" as const };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      mustSetPassword: false,
      setupTokenHash: null,
      setupTokenExpiresAt: null,
    },
  });

  await createSession({
    userId: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
  });

  redirect(homeFor(user.role));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
