import "server-only";
import { logger } from "@/lib/logger";

/**
 * Provider abstraction for SMS / WhatsApp / Email.
 *
 * In development the "console" provider logs the message to the server console,
 * so verification codes can be tested without external credentials.
 * In production, set SMS_PROVIDER / EMAIL_PROVIDER to a real provider and supply
 * credentials via environment variables. No secrets are hardcoded.
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
  send(msg: EmailMessage): Promise<void>;
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
    const from = channel === "WHATSAPP" ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_FROM_NUMBER;
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

// ── SMTP (production stub) ──
const smtpEmail: EmailProvider = {
  async send() {
    // Intentionally a thin stub: wire up nodemailer (or a transactional API)
    // using SMTP_* env vars in production. Kept dependency-free here.
    throw new Error("SMTP provider not configured in this build. Set EMAIL_PROVIDER=console for dev.");
  },
};

function smsProvider(): SmsProvider {
  return process.env.SMS_PROVIDER === "twilio" ? twilioSms : consoleSms;
}
function emailProvider(): EmailProvider {
  return process.env.EMAIL_PROVIDER === "smtp" ? smtpEmail : consoleEmail;
}

export async function sendSms(msg: SmsMessage, channel: "SMS" | "WHATSAPP" = "SMS") {
  await smsProvider().send(msg, channel);
}
export async function sendEmail(msg: EmailMessage) {
  await emailProvider().send(msg);
}

/**
 * Alert the operations team. Routes to whichever ops channels are configured
 * (`OPS_ALERT_EMAIL` and/or `OPS_ALERT_PHONE`); if none are set, the alert is
 * logged so it's still visible in the server logs. Uses the same provider
 * abstraction, so it's console in dev and Twilio/SMTP in production.
 */
export async function sendOpsAlert(msg: { subject: string; body: string }): Promise<void> {
  const email = process.env.OPS_ALERT_EMAIL;
  const phone = process.env.OPS_ALERT_PHONE;
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
