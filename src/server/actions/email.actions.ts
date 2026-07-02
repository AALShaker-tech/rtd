"use server";

import { z } from "zod";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { sendEmail } from "@/server/services/notify.service";

/**
 * Admin-only: send a test email to verify the configured email provider.
 * Defaults to the signed-in admin's address. Surfaces the provider's actual
 * error so misconfigured SMTP is easy to diagnose.
 */
export async function sendTestEmail(rawTo?: string) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) return { ok: false as const, error: "Unauthorized" };

  const candidate = (rawTo ?? "").trim() || session.email;
  const to = z.string().email().safeParse(candidate);
  if (!to.success) return { ok: false as const, error: "Enter a valid email address." };

  try {
    await sendEmail({
      to: to.data,
      subject: "RTD test email",
      body:
        "This is a test email from the RTD admin console.\n" +
        "If you received it, your email provider is configured correctly.",
    });
    return { ok: true as const, to: to.data };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Send failed." };
  }
}
