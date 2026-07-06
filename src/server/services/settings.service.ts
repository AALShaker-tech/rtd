import "server-only";
import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "@/lib/secret-box";

/**
 * Superadmin-editable app configuration, stored in the Setting key/value table.
 * Resolution order for every key: DB value (decrypted if secret) → env var
 * fallback. Secrets are never returned to the client in plaintext.
 */

export type SettingKey =
  | "whatsapp.number"
  | "whatsapp.display"
  | "ops.alertEmail"
  | "email.from"
  | "email.provider"
  | "email.brevoApiKey"
  | "smtp.host"
  | "smtp.port"
  | "smtp.user"
  | "smtp.password";

const DEFS: Record<SettingKey, { env?: string; secret?: boolean }> = {
  "whatsapp.number": { env: "NEXT_PUBLIC_WHATSAPP_NUMBER" },
  "whatsapp.display": { env: "NEXT_PUBLIC_WHATSAPP_DISPLAY" },
  "ops.alertEmail": { env: "OPS_ALERT_EMAIL" },
  "email.from": { env: "EMAIL_FROM" },
  "email.provider": { env: "EMAIL_PROVIDER" },
  "email.brevoApiKey": { env: "BREVO_API_KEY", secret: true },
  "smtp.host": { env: "SMTP_HOST" },
  "smtp.port": { env: "SMTP_PORT" },
  "smtp.user": { env: "SMTP_USER" },
  "smtp.password": { env: "SMTP_PASSWORD", secret: true },
};

const KEYS = Object.keys(DEFS) as SettingKey[];

function safeDecrypt(v: string): string {
  try {
    return decryptSecret(v);
  } catch {
    return "";
  }
}

/** Resolve every setting: a stored DB row wins (decrypted if secret); otherwise the env fallback. */
export async function resolveSettings(): Promise<Record<SettingKey, string | undefined>> {
  const rows = await prisma.setting.findMany({ where: { key: { in: KEYS } } });
  const db = new Map<string, string>(
    rows.map((r: { key: string; value: string }) => [r.key, r.value]),
  );
  const out = {} as Record<SettingKey, string | undefined>;
  for (const k of KEYS) {
    if (db.has(k)) {
      const raw = db.get(k)!;
      out[k] = DEFS[k].secret ? safeDecrypt(raw) : raw;
    } else {
      out[k] = DEFS[k].env ? process.env[DEFS[k].env] : undefined;
    }
  }
  return out;
}

/** Non-secret config the customer-facing pages need. */
export async function getPublicConfig(): Promise<{
  whatsappNumber: string;
  whatsappDisplay: string;
}> {
  // Runs in the global site layout — never let a DB hiccup 500 the whole site;
  // fall back to env/defaults instead.
  try {
    const s = await resolveSettings();
    return {
      whatsappNumber: s["whatsapp.number"] || "966550832444",
      whatsappDisplay: s["whatsapp.display"] || "+966 55 083 2444",
    };
  } catch {
    return {
      whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "966550832444",
      whatsappDisplay: process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY || "+966 55 083 2444",
    };
  }
}

export interface EmailConfig {
  provider: string;
  from: string;
  brevoApiKey: string;
  smtp: { host: string; port: number; user: string; pass: string };
}

export async function resolveEmailConfig(): Promise<EmailConfig> {
  const s = await resolveSettings();
  return {
    provider: s["email.provider"] || "console",
    from: s["email.from"] || "",
    brevoApiKey: s["email.brevoApiKey"] || "",
    smtp: {
      host: s["smtp.host"] || "",
      port: Number(s["smtp.port"] || 587),
      user: s["smtp.user"] || "",
      pass: s["smtp.password"] || "",
    },
  };
}

/**
 * Emails of every active ADMIN account (`isActive`). These are the people who
 * should be alerted about new requests. Superadmins are intentionally excluded.
 * Deduped and lowercased by the caller alongside any manually configured ops
 * address.
 */
export async function getActiveAdminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { isActive: true, role: "ADMIN" },
    select: { email: true },
  });
  return admins.map((u: { email: string }) => u.email).filter(Boolean);
}

/**
 * Who to alert about new requests. Every active admin gets the alert; the
 * superadmin-configured `ops.alertEmail` (if set) adds extra recipients — e.g.
 * shared ops mailboxes that are not staff logins. That field may hold several
 * addresses separated by commas, semicolons, or whitespace. Addresses are deduped
 * case-insensitively. The phone target stays env-only for now.
 */
export async function getOpsTargets(): Promise<{ emails: string[]; phone: string }> {
  const s = await resolveSettings();
  const configured = splitEmails(s["ops.alertEmail"] || "");
  const adminEmails = await getActiveAdminEmails();

  const seen = new Set<string>();
  const emails: string[] = [];
  for (const raw of [...configured, ...adminEmails]) {
    const email = raw.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    emails.push(email);
  }
  return { emails, phone: process.env.OPS_ALERT_PHONE || "" };
}

/** Split a free-text field into individual email addresses (comma/semicolon/whitespace-separated). */
export function splitEmails(value: string): string[] {
  return value
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

/** Values for the admin form. Secrets are surfaced only as a boolean "isSet". */
export async function getAdminSettings() {
  const s = await resolveSettings();
  return {
    whatsappNumber: s["whatsapp.number"] || "",
    whatsappDisplay: s["whatsapp.display"] || "",
    opsAlertEmail: s["ops.alertEmail"] || "",
    emailFrom: s["email.from"] || "",
    emailProvider: s["email.provider"] || "console",
    smtpHost: s["smtp.host"] || "",
    smtpPort: s["smtp.port"] || "587",
    smtpUser: s["smtp.user"] || "",
    brevoApiKeySet: !!s["email.brevoApiKey"],
    smtpPasswordSet: !!s["smtp.password"],
  };
}
export type AdminSettings = Awaited<ReturnType<typeof getAdminSettings>>;

export interface SettingsInput {
  whatsappNumber?: string;
  whatsappDisplay?: string;
  opsAlertEmail?: string;
  emailFrom?: string;
  emailProvider?: string;
  brevoApiKey?: string; // secret — blank means "leave unchanged"
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPassword?: string; // secret — blank means "leave unchanged"
}

export async function saveSettings(input: SettingsInput): Promise<void> {
  const map: Partial<Record<SettingKey, string | undefined>> = {
    "whatsapp.number": input.whatsappNumber,
    "whatsapp.display": input.whatsappDisplay,
    "ops.alertEmail": input.opsAlertEmail,
    "email.from": input.emailFrom,
    "email.provider": input.emailProvider,
    "smtp.host": input.smtpHost,
    "smtp.port": input.smtpPort,
    "smtp.user": input.smtpUser,
    "email.brevoApiKey": input.brevoApiKey,
    "smtp.password": input.smtpPassword,
  };
  for (const k of KEYS) {
    const val = map[k];
    if (val === undefined) continue; // field not submitted
    if (DEFS[k].secret) {
      if (val.trim() === "") continue; // blank secret = keep existing
      const enc = encryptSecret(val);
      await prisma.setting.upsert({
        where: { key: k },
        update: { value: enc },
        create: { key: k, value: enc },
      });
    } else {
      // Non-secret: store as given (empty is an explicit "clear/override").
      await prisma.setting.upsert({
        where: { key: k },
        update: { value: val },
        create: { key: k, value: val },
      });
    }
  }
}
