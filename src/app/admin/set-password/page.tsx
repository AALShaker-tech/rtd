import { findUserBySetupToken } from "@/server/services/setup.service";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { RequestSetupLinkForm } from "@/components/auth/RequestSetupLinkForm";

export const dynamic = "force-dynamic";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { token, email } = await searchParams;

  // A valid token → let them choose a password. Anything else (no token, or an
  // expired/used one) → show the "email me a setup link" form.
  if (token) {
    const user = await findUserBySetupToken(token);
    if (user) return <SetPasswordForm token={token} email={user.email} />;
    return <RequestSetupLinkForm defaultEmail={email} expired />;
  }

  return <RequestSetupLinkForm defaultEmail={email} />;
}
