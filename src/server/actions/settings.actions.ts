"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { saveSettings } from "@/server/services/settings.service";

const schema = z.object({
  whatsappNumber: z.string().optional(),
  whatsappDisplay: z.string().optional(),
  opsAlertEmail: z.string().optional(),
  emailFrom: z.string().optional(),
  emailProvider: z.enum(["console", "smtp", "brevo"]).optional(),
  brevoApiKey: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
});

/** Superadmin-only: persist editable app settings. */
export async function updateAppSettings(raw: unknown) {
  const session = await getSession();
  if (!session || !isSuperAdmin(session.role)) return { ok: false as const, error: "Unauthorized" };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };

  const ops = parsed.data.opsAlertEmail?.trim();
  if (ops && !z.string().email().safeParse(ops).success) {
    return { ok: false as const, error: "Ops alert email is not a valid address." };
  }
  const port = parsed.data.smtpPort?.trim();
  if (port && !/^\d+$/.test(port)) {
    return { ok: false as const, error: "SMTP port must be a number." };
  }

  await saveSettings(parsed.data);
  revalidatePath("/admin/settings");
  // The WhatsApp number is baked into the (cached) site layout.
  revalidatePath("/", "layout");
  return { ok: true as const };
}
