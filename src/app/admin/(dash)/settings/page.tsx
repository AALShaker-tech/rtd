import { getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { getAdminSettings } from "@/server/services/settings.service";
import { SettingsView } from "./SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  const settings = await getAdminSettings();
  return (
    <SettingsView
      settings={settings}
      smsProvider={process.env.SMS_PROVIDER ?? "console"}
      adminEmail={session?.email ?? ""}
      canEdit={session ? isSuperAdmin(session.role) : false}
    />
  );
}
