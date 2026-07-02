"use client";

import { useActionState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { setInitialPassword } from "@/server/actions/auth.actions";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { FieldWrap, TextInput } from "@/components/ui/Field";

export function SetPasswordForm({ email }: { email: string }) {
  const { t, pick } = useI18n();
  const [state, formAction, pending] = useActionState(setInitialPassword, null);

  const errorText =
    state?.error === "RATE_LIMITED"
      ? pick(t.auth.tooManyAttempts)
      : state?.error === "MISMATCH"
        ? pick(t.auth.passwordMismatch)
        : state?.error === "WEAK"
          ? pick(t.auth.passwordTooShort)
          : state?.error === "INVALID"
            ? pick(t.auth.invalid)
            : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-gradient p-5">
      <div className="absolute inset-0 bg-hero-glow" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Logo variant="light" />
          <LanguageSwitcher variant="light" />
        </div>
        <div className="luxe-card p-8">
          <h1 className="font-serif text-2xl font-semibold text-charcoal">
            {pick(t.auth.setPasswordTitle)}
          </h1>
          <p className="mt-1 text-sm text-charcoal/50">{pick(t.auth.setPasswordHint)}</p>

          <form action={formAction} className="mt-6 space-y-4">
            <input type="hidden" name="email" value={email} />
            <FieldWrap label={pick(t.auth.email)}>
              <TextInput type="email" value={email} disabled readOnly autoComplete="email" />
            </FieldWrap>
            <FieldWrap label={pick(t.auth.newPassword)}>
              <TextInput
                name="password"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                placeholder="••••••••••"
              />
            </FieldWrap>
            <FieldWrap label={pick(t.auth.confirmPassword)}>
              <TextInput
                name="confirm"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                placeholder="••••••••••"
              />
            </FieldWrap>

            {errorText && <p className="text-sm text-red-600">{errorText}</p>}

            <button type="submit" disabled={pending} className="btn-gold w-full">
              {pending ? pick(t.common.loading) : pick(t.auth.setPasswordCta)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
