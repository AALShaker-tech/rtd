"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { useI18n } from "@/i18n/I18nProvider";

export default function AdminLoginPage() {
  const { t, pick } = useI18n();
  return <LoginForm title={pick(t.auth.adminTitle)} />;
}
