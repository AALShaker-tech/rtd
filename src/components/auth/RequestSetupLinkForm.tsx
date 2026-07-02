"use client";

import { useActionState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { requestSetupLink } from "@/server/actions/auth.actions";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { FieldWrap, TextInput } from "@/components/ui/Field";

export function RequestSetupLinkForm({
  defaultEmail,
  expired,
}: {
  defaultEmail?: string;
  expired?: boolean;
}) {
  const { t, pick } = useI18n();
  const [state, formAction, pending] = useActionState(requestSetupLink, null);

  const errorText =
    state?.error === "RATE_LIMITED"
      ? pick(t.auth.tooManyAttempts)
      : state?.error === "INVALID_EMAIL"
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
            {pick(t.auth.setupLinkTitle)}
          </h1>
          {expired && !state?.sent && (
            <p className="mt-1 text-sm text-amber-700">{pick(t.auth.setupLinkExpired)}</p>
          )}

          {state?.sent ? (
            <p className="mt-4 text-sm text-charcoal/70">{pick(t.auth.setupLinkSent)}</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-charcoal/50">{pick(t.auth.setupLinkHint)}</p>
              <form action={formAction} className="mt-6 space-y-4">
                <FieldWrap label={pick(t.auth.email)}>
                  <TextInput
                    name="email"
                    type="email"
                    required
                    defaultValue={defaultEmail}
                    autoComplete="email"
                    placeholder="name@rtd.sa"
                  />
                </FieldWrap>

                {errorText && <p className="text-sm text-red-600">{errorText}</p>}

                <button type="submit" disabled={pending} className="btn-gold w-full">
                  {pending ? pick(t.common.loading) : pick(t.auth.setupLinkCta)}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
