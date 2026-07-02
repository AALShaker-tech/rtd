"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { loginSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-context";

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
  // password yet — send them to choose one instead of failing the sign-in.
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

const setPasswordSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(10),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "MISMATCH", path: ["confirm"] });

/**
 * First-login password setup. Only succeeds for an active account still flagged
 * `mustSetPassword`; once set, the flag is cleared and the user is signed in.
 */
export async function setInitialPassword(_prev: unknown, formData: FormData) {
  const parsed = setPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some((i) => i.message === "MISMATCH");
    return { error: (mismatch ? "MISMATCH" : "WEAK") as "MISMATCH" | "WEAK" };
  }

  const email = parsed.data.email.toLowerCase();
  const ip = await clientIp();
  const limit = rateLimit(`setpw:${ip}:${email}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.allowed) return { error: "RATE_LIMITED" as const };

  const user = await prisma.user.findUnique({ where: { email } });
  // Never reveal whether the account exists / is eligible.
  if (!user || !user.isActive || !user.mustSetPassword) return { error: "INVALID" as const };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.password), mustSetPassword: false },
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
