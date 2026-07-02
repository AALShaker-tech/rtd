/**
 * One-off: create (or re-arm) the superadmin account and mint a one-time
 * password-setup link.
 *
 * Ships NO password — the account is flagged `mustSetPassword` and a setup
 * token (stored hashed) is generated. The script prints a ready setup link so
 * you can bootstrap even before the email provider is configured; in the app
 * the owner can also request the link by email from /admin/set-password.
 *
 * Runtime-only deps (@prisma/client + node:crypto) so it runs in the production
 * container without devDependencies — e.g. Railway's Console tab, where
 * DATABASE_URL is already set:
 *
 *   node scripts/create-superadmin.mjs
 *   SUPERADMIN_EMAIL=cto@ratbli.sa SUPERADMIN_NAME='CTO' node scripts/create-superadmin.mjs
 *
 * Idempotent: promotes an existing account to SUPERADMIN; only re-arms setup
 * (and prints a link) while it has no usable password.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "node:crypto";

const email = (process.env.SUPERADMIN_EMAIL ?? "cto@ratbli.sa").toLowerCase();
const fullName = process.env.SUPERADMIN_NAME ?? "CTO";
const TTL_MS = Number(process.env.SETUP_TOKEN_TTL_MS ?? 60 * 60 * 1000);

function mintToken() {
  const raw = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash, expiresAt: new Date(Date.now() + TTL_MS) };
}

function printLink(raw) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const minutes = Math.round(TTL_MS / 60000);
  console.log(
    `   One-time setup link (valid ${minutes} min):\n   ${base}/admin/set-password?token=${raw}`,
  );
}

const prisma = new PrismaClient();
try {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && existing.passwordHash) {
    await prisma.user.update({ where: { email }, data: { role: "SUPERADMIN", isActive: true } });
    console.log(`✔ ${email} is now SUPERADMIN. (existing password kept)`);
  } else {
    const { raw, hash, expiresAt } = mintToken();
    if (existing) {
      await prisma.user.update({
        where: { email },
        data: {
          role: "SUPERADMIN",
          isActive: true,
          mustSetPassword: true,
          setupTokenHash: hash,
          setupTokenExpiresAt: expiresAt,
        },
      });
      console.log(`✔ ${email} is now SUPERADMIN, awaiting password setup.`);
    } else {
      await prisma.user.create({
        data: {
          email,
          fullName,
          role: "SUPERADMIN",
          passwordHash: "",
          mustSetPassword: true,
          setupTokenHash: hash,
          setupTokenExpiresAt: expiresAt,
        },
      });
      console.log(`✔ Created SUPERADMIN ${email}, awaiting password setup.`);
    }
    printLink(raw);
  }
} catch (e) {
  console.error("✖ Failed to create superadmin:", e && e.message ? e.message : e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
