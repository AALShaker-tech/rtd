import "server-only";
import { logger } from "@/lib/logger";
import {
  resolveEmailConfig,
  getOpsTargets,
  type EmailConfig,
} from "@/server/services/settings.service";

/**
 * Provider abstraction for SMS / WhatsApp / Email.
 *
 * SMS uses SMS_PROVIDER + env credentials. Email config (provider + sender +
 * credentials) is resolved from the Setting store with env fallback, so the
 * superadmin can change it from the dashboard. The "console" provider just logs
 * the message, for development.
 */

export interface SmsMessage {
  to: string; // E.164
  body: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

interface SmsProvider {
  send(msg: SmsMessage, channel: "SMS" | "WHATSAPP"): Promise<void>;
}
interface EmailProvider {
  send(msg: EmailMessage, cfg: EmailConfig): Promise<void>;
}

// ── Console (development) ──
const consoleSms: SmsProvider = {
  async send(msg, channel) {
    logger.info("dev notify: sms", { channel, to: msg.to, body: msg.body });
  },
};
const consoleEmail: EmailProvider = {
  async send(msg) {
    logger.info("dev notify: email", { to: msg.to, subject: msg.subject, body: msg.body });
  },
};

// ── Twilio (production stub — wired through env, no SDK dependency hardcoded) ──
const twilioSms: SmsProvider = {
  async send(msg, channel) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from =
      channel === "WHATSAPP" ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_FROM_NUMBER;
    if (!sid || !token || !from) {
      throw new Error("Twilio is not fully configured (set TWILIO_* env vars).");
    }
    const to = channel === "WHATSAPP" ? `whatsapp:${msg.to}` : msg.to;
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: msg.body }),
    });
    if (!res.ok) throw new Error(`Twilio send failed: ${res.status}`);
  },
};

// ── SMTP (production) ──
// Generic SMTP via nodemailer — works with any provider that speaks SMTP
// (Google Workspace/Gmail, Brevo, Resend, SendGrid, SES…). No provider-specific
// code; driven by the resolved email config.
const smtpEmail: EmailProvider = {
  async send(msg, cfg) {
    const { host, port, user, pass } = cfg.smtp;
    const from = cfg.from || user;
    if (!host) throw new Error("SMTP is not configured (set SMTP host).");
    if (!from) throw new Error("SMTP needs a sender address (Email 'from' or SMTP user).");
    // Loaded lazily so the console provider never needs nodemailer at runtime.
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
      // Auth is optional: an IP-allowlisted Google Workspace SMTP relay
      // (smtp-relay.gmail.com) accepts mail without credentials.
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
    await transporter.sendMail({ from, to: msg.to, subject: msg.subject, text: msg.body });
  },
};

// ── Brevo HTTP API (production) ──
// Sends over HTTPS (port 443), so it works even where outbound SMTP ports are
// blocked (e.g. some Railway projects). Needs a Brevo v3 API key (not the SMTP
// key) and a sender address.
const brevoApiEmail: EmailProvider = {
  async send(msg, cfg) {
    const apiKey = cfg.brevoApiKey;
    if (!apiKey) throw new Error("Brevo API is not configured (set the Brevo API key).");
    const sender = parseSender(cfg.from);
    if (!sender.email) throw new Error("Set the email 'from' address for Brevo.");

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: msg.to }],
        subject: msg.subject,
        textContent: msg.body,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Brevo API send failed: ${res.status} ${detail}`.trim());
    }
  },
};

/** Parse an RFC-style "Name <email@host>" (or a bare address) into parts. */
function parseSender(from: string): { name?: string; email: string } {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || undefined, email: m[2].trim() };
  return { email: from.trim() };
}

function smsProvider(): SmsProvider {
  return process.env.SMS_PROVIDER === "twilio" ? twilioSms : consoleSms;
}
function emailProviderFor(provider: string): EmailProvider {
  if (provider === "brevo") return brevoApiEmail;
  if (provider === "smtp") return smtpEmail;
  return consoleEmail;
}

export async function sendSms(msg: SmsMessage, channel: "SMS" | "WHATSAPP" = "SMS") {
  await smsProvider().send(msg, channel);
}
export async function sendEmail(msg: EmailMessage) {
  const cfg = await resolveEmailConfig();
  await emailProviderFor(cfg.provider).send(msg, cfg);
}

/**
 * Alert the operations team. Routes to whichever ops channels are configured
 * (ops-alert email and/or `OPS_ALERT_PHONE`); if none are set, the alert is
 * logged so it's still visible in the server logs. The email target is
 * superadmin-editable (Setting store); the phone stays env-only for now.
 */
export async function sendOpsAlert(msg: { subject: string; body: string }): Promise<void> {
  const { email, phone } = await getOpsTargets();
  const channel: "SMS" | "WHATSAPP" =
    process.env.OPS_ALERT_SMS_CHANNEL === "WHATSAPP" ? "WHATSAPP" : "SMS";

  let delivered = false;
  if (email) {
    await sendEmail({ to: email, subject: msg.subject, body: msg.body });
    delivered = true;
  }
  if (phone) {
    await sendSms({ to: phone, body: `${msg.subject}\n${msg.body}` }, channel);
    delivered = true;
  }
  if (!delivered) {
    logger.info("ops alert (no OPS_ALERT_* configured — logging only)", {
      subject: msg.subject,
      body: msg.body,
    });
  }
}
