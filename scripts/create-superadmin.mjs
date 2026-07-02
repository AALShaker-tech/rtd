/**
 * One-off: create (or re-arm) the superadmin account in any environment.
 *
 * Ships NO password — the account is flagged `mustSetPassword`, so the person
 * who owns the email sets it on first login at /admin/set-password.
 *
 * Runtime-only deps (@prisma/client) so it runs in the production container
 * without devDependencies — e.g. Railway's Console tab, where DATABASE_URL is
 * already set:
 *
 *   node scripts/create-superadmin.mjs
 *   SUPERADMIN_EMAIL=cto@ratbli.sa SUPERADMIN_NAME='CTO' node scripts/create-superadmin.mjs
 *
 * Idempotent: if the account exists it is promoted to SUPERADMIN and re-armed
 * for password setup only if it has no usable password.
 */
import { PrismaClient } from "@prisma/client";

const email = (process.env.SUPERADMIN_EMAIL ?? "cto@ratbli.sa").toLowerCase();
const fullName = process.env.SUPERADMIN_NAME ?? "CTO";

const prisma = new PrismaClient();
try {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        role: "SUPERADMIN",
        isActive: true,
        // Only re-arm password setup if there's no usable password yet.
        ...(existing.passwordHash ? {} : { mustSetPassword: true }),
      },
    });
    console.log(
      `✔ ${email} is now SUPERADMIN.` +
        (existing.passwordHash
          ? " (existing password kept)"
          : " Set the password on first login at /admin/set-password."),
    );
  } else {
    await prisma.user.create({
      data: { email, fullName, role: "SUPERADMIN", passwordHash: "", mustSetPassword: true },
    });
    console.log(
      `✔ Created SUPERADMIN ${email}. Set the password on first login at /admin/set-password.`,
    );
  }
} catch (e) {
  console.error("✖ Failed to create superadmin:", e && e.message ? e.message : e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
