"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/schemas";

export async function login(_prev: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "INVALID" as const };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
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
