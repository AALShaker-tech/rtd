"use client";

import { useActionState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { login } from "@/server/actions/auth.actions";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { FieldWrap, TextInput } from "@/components/ui/Field";

export function LoginForm({ title, hint }: { title: string; hint?: string }) {
  const { t, pick } = useI18n();
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-gradient p-5">
      <div className="absolute inset-0 bg-hero-glow" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Logo variant="light" />
          <LanguageSwitcher variant="light" />
        </div>
        <div className="luxe-card p-8">
          <h1 className="font-serif text-2xl font-semibold text-charcoal">{title}</h1>
          {hint && <p className="mt-1 text-sm text-charcoal/50">{hint}</p>}

          <form action={formAction} className="mt-6 space-y-4">
            <FieldWrap label={pick(t.auth.email)}>
              <TextInput name="email" type="email" required autoComplete="email" placeholder="name@rtd.sa" />
            </FieldWrap>
            <FieldWrap label={pick(t.auth.password)}>
              <TextInput name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
            </FieldWrap>

            {state?.error && <p className="text-sm text-red-600">{pick(t.auth.invalid)}</p>}

            <button type="submit" disabled={pending} className="btn-gold w-full">
              {pending ? pick(t.common.loading) : pick(t.auth.signIn)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
