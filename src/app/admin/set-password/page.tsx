import { redirect } from "next/navigation";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { email } = await searchParams;
  // No email → nothing to set up; send them to sign in.
  if (!email) redirect("/admin/login");
  return <SetPasswordForm email={email} />;
}
