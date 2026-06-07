import "server-only";

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
    // eslint-disable-next-line no-console
    console.info(`\n[RTD ${channel}] → ${msg.to}\n${msg.body}\n`);
  },
};
const consoleEmail: EmailProvider = {
  async send(msg) {
    // eslint-disable-next-line no-console
    console.info(`\n[RTD EMAIL] → ${msg.to}\nSubject: ${msg.subject}\n${msg.body}\n`);
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
