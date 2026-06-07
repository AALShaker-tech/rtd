"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n } from "@/i18n/I18nProvider";
import { customerDetailsSchema } from "@/lib/validation/schemas";
import { COUNTRY_CODES, parsePhone } from "@/lib/phone";
import { useJourneyStore } from "@/store/journeyStore";
import { JourneyProgress } from "@/components/journey/JourneyProgress";
import { JourneySummary } from "@/components/journey/JourneySummary";
import { FieldWrap, Select, TextArea, TextInput } from "@/components/ui/Field";
import type { z } from "zod";

type FormValues = z.infer<typeof customerDetailsSchema>;

export default function DetailsPage() {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const customer = useJourneyStore((s) => s.customer);
  const setCustomer = useJourneyStore((s) => s.setCustomer);
  const steps = useJourneyStore((s) => s.steps);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(customerDetailsSchema),
    mode: "onBlur",
    defaultValues: { ...customer, language: locale },
  });

  // Keep store in sync so the summary + later steps reflect entries.
  const values = watch();
  useEffect(() => {
    setCustomer(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  // Guard: no journey yet.
  useEffect(() => {
    if (steps.filter((s) => !s.skipped).length === 0) router.replace("/journey");
  }, [steps, router]);

  const phoneCheck = parsePhone(values.phone || "", values.phoneCountry || "SA");
  const phoneError =
    values.phone && !phoneCheck.valid
      ? locale === "ar"
        ? "الرجاء إدخال رقم جوال صحيح."
        : "Please enter a valid mobile number."
      : undefined;

  function onSubmit(data: FormValues) {
    setCustomer(data);
    router.push("/journey/verify");
  }

  const lang = locale === "ar";

  return (
    <div className="luxe-container py-10 md:py-14">
      <JourneyProgress current="details" />
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-charcoal md:text-4xl">{pick(t.details.title)}</h1>
        <p className="mx-auto mt-3 max-w-xl text-charcoal/60">{pick(t.details.subtitle)}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit(onSubmit)} className="luxe-card space-y-5 p-6 md:p-8">
          <FieldWrap label={pick(t.fields.fullName)} error={errors.fullName && (lang ? "مطلوب" : "Required")}>
            <TextInput {...register("fullName")} invalid={!!errors.fullName} placeholder={lang ? "الاسم الكامل" : "Your full name"} />
          </FieldWrap>

          <FieldWrap label={pick(t.fields.phone)} error={phoneError}>
            <div className="flex gap-2">
              <Select {...register("phoneCountry")} className="w-32 shrink-0">
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.dial} {c.code}
                  </option>
                ))}
              </Select>
              <TextInput
                {...register("phone")}
                invalid={!!phoneError}
                inputMode="tel"
                placeholder="5XXXXXXXX"
                className="flex-1"
              />
            </div>
            {values.phone && phoneCheck.valid && (
              <p className="mt-1 text-xs font-medium text-emerald-600">
                {lang ? "رقم صحيح" : "Valid"}: {phoneCheck.e164}
              </p>
            )}
          </FieldWrap>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label={pick(t.fields.email)} error={errors.email && (lang ? "بريد غير صحيح" : "Invalid email")}>
              <TextInput {...register("email")} invalid={!!errors.email} inputMode="email" placeholder="name@example.com" />
            </FieldWrap>
            <FieldWrap label={pick(t.fields.language)}>
              <Select {...register("language")}>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </Select>
            </FieldWrap>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label={pick(t.fields.children)}>
              <div className="flex gap-2">
                <Toggle on={values.children} onClick={() => setValue("children", true)} label={pick(t.common.yes)} />
                <Toggle on={!values.children} onClick={() => setValue("children", false)} label={pick(t.common.no)} />
              </div>
            </FieldWrap>
            <FieldWrap label={pick(t.fields.childSeat)}>
              <div className="flex gap-2">
                <Toggle on={values.childSeat} onClick={() => setValue("childSeat", true)} label={pick(t.common.yes)} />
                <Toggle on={!values.childSeat} onClick={() => setValue("childSeat", false)} label={pick(t.common.no)} />
              </div>
            </FieldWrap>
          </div>
          {values.childSeat && !values.children && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {lang
                ? "لقد اخترت مقعد أطفال مع الإشارة إلى عدم وجود أطفال."
                : "You selected a child seat but indicated no children are travelling."}
            </p>
          )}

          <FieldWrap label={pick(t.fields.notes)} optional={pick(t.common.optional)}>
            <TextArea {...register("notes")} />
          </FieldWrap>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-ivory-warm p-4">
            <input type="checkbox" {...register("contactMeInstead")} className="mt-1 h-4 w-4 accent-gold" />
            <span className="text-sm text-charcoal/70">{pick(t.details.contactMe)}</span>
          </label>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
            <button type="button" onClick={() => router.push("/journey")} className="btn-ghost">
              ← {pick(t.common.back)}
            </button>
            <button type="submit" className="btn-gold">
              {pick(t.common.next)} →
            </button>
          </div>
        </form>

        <div className="hidden lg:block">
          <JourneySummary />
        </div>
      </div>
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`badge flex-1 justify-center border py-2 transition ${
        on ? "border-gold bg-gold-50 text-gold-dark" : "border-charcoal/15 text-charcoal/50"
      }`}
    >
      {label}
    </button>
  );
}
