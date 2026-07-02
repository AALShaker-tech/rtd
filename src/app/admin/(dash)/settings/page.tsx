import { getSession } from "@/lib/auth";
import { SettingsView } from "./SettingsView";

export default async function SettingsPage() {
  const session = await getSession();
  return (
    <SettingsView
      whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "966550832444"}
      whatsappDisplay={process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ?? "+966 55 083 2444"}
      smsProvider={process.env.SMS_PROVIDER ?? "console"}
      emailProvider={process.env.EMAIL_PROVIDER ?? "console"}
      adminEmail={session?.email ?? ""}
    />
  );
}
