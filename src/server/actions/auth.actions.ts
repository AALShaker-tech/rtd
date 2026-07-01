"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-context";

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

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { error: "INVALID" as const };

  await createSession({
    userId: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
  });

  const dest = user.role === "ADMIN" ? "/admin" : user.role === "EMPLOYEE" ? "/employee" : "/driver";
  redirect(dest);
}

export async function logout() {
  await destroySession();
  redirect("/");
}
