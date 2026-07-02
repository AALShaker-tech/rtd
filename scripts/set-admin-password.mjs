/**
 * One-off: rotate a staff account's password in any environment.
 *
 * Runtime-only deps (@prisma/client, bcryptjs) so it runs in the production
 * container without devDependencies — e.g. Railway's Console tab, where
 * DATABASE_URL is already set:
 *
 *   ADMIN_NEW_PASSWORD='a-strong-secret' node scripts/set-admin-password.mjs
 *   ADMIN_EMAIL=ops@rtd.sa ADMIN_NEW_PASSWORD='...' node scripts/set-admin-password.mjs
 *
 * Never hardcodes a password; refuses to run without a sufficiently strong one.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = (process.env.ADMIN_EMAIL ?? "admin@rtd.sa").toLowerCase();
const password = process.env.ADMIN_NEW_PASSWORD;

if (!password || password.length < 10) {
  console.error(
    "✖ Set ADMIN_NEW_PASSWORD to a strong value (at least 10 characters). Aborting — nothing changed.",
  );
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash },
    select: { email: true, role: true },
  });
  console.log(`✔ Password updated for ${user.email} (role ${user.role}).`);
} catch (e) {
  if (e && e.code === "P2025") {
    console.error(`✖ No user found with email "${email}". Check ADMIN_EMAIL.`);
  } else {
    console.error("✖ Failed to update password:", e && e.message ? e.message : e);
  }
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
