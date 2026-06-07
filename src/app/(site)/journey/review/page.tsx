"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import {
  SERVICE_TYPES,
  getCity,
  getPackage,
  getStep,
  getVehicle,
} from "@/lib/domain";
import { useJourneyStore } from "@/store/journeyStore";
import { validateCustomer, validateJourney, validateStep } from "@/lib/validation/journey";
import { submitJourney } from "@/server/actions/request.actions";
import { JourneyProgress } from "@/components/journey/JourneyProgress";
import { ValidationList } from "@/components/journey/ValidationList";
import { formatDateTime } from "@/lib/utils";
import type { JourneyStepInput } from "@/lib/types";

export default function ReviewPage() {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const store = useJourneyStore();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>();

  const draft = {
    selectedPackage: store.selectedPackage,
    steps: store.steps,
    customer: store.customer,
    phoneVerified: store.phoneVerified,
    emailVerified: store.emailVerified,
  };

  const validation = useMemo(() => validateJourney(draft), [JSON.stringify(draft)]);
  const customerIssues = useMemo(() => validateCustomer(store.customer), [JSON.stringify(store.customer)]);
  const customerErrors = customerIssues.filter((i) => i.severity === "error");

  const ordered = [...store.steps].sort((a, b) => getStep(a.stepType).order - getStep(b.stepType).order);
  const blocked = validation.hasErrors || customerErrors.length > 0;

  async function confirm() {
    setSubmitting(true);
    setServerError(undefined);
    const res = await submitJourney({
      selectedPackage: store.selectedPackage,
      steps: store.steps,
      customer: store.customer,
      phoneVerified: store.phoneVerified,
      emailVerified: store.emailVerified,
    });
    setSubmitting(false);
    if (!res.ok) return setServerError(res.error);
    const ref = res.referenceNumber!;
    store.reset();
    router.push(`/success/${ref}`);
  }

  return (
    <div className="luxe-container py-10 md:py-14">
      <JourneyProgress current="review" />
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-charcoal md:text-4xl">{pick(t.review.title)}</h1>
        <p className="mx-auto mt-3 max-w-xl text-charcoal/60">{pick(t.review.subtitle)}</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-5">
        {store.selectedPackage && (
          <div className="luxe-card flex items-center justify-between p-4">
            <span className="text-sm text-charcoal/60">{pick(t.packages.title)}</span>
            <span className="badge bg-gold-50 text-gold-dark">{pick(getPackage(store.selectedPackage)!.name)}</span>
          </div>
        )}

        {/* Customer card */}
        <div className="luxe-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-charcoal">{pick(t.details.title)}</h3>
            <button onClick={() => router.push("/journey/details")} className="btn-ghost px-3 py-1 text-xs">
              {pick(t.common.edit)}
            </button>
          </div>
          <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            <Row k={pick(t.fields.fullName)} v={store.customer.fullName} />
            <Row k={pick(t.fields.phone)} v={store.customer.phone} badge={store.phoneVerified ? pick(t.verify.verified) : pick(t.verify.pending)} ok={store.phoneVerified} />
            <Row k={pick(t.fields.email)} v={store.customer.email} badge={store.emailVerified ? pick(t.verify.verified) : pick(t.verify.pending)} ok={store.emailVerified} />
            <Row k={pick(t.fields.children)} v={store.customer.children ? pick(t.common.yes) : pick(t.common.no)} />
            <Row k={pick(t.fields.childSeat)} v={store.customer.childSeat ? pick(t.common.yes) : pick(t.common.no)} />
          </dl>
          {customerErrors.length > 0 && <ValidationList issues={customerErrors} className="mt-3" />}
        </div>

        {/* Steps */}
        {ordered.map((step, idx) => (
          <StepReviewCard key={step.stepType} step={step} index={idx + 1} onEdit={() => router.push("/journey")} />
        ))}

        {/* Timeline issues */}
        {validation.timeline.length > 0 && (
          <div className="luxe-card p-5">
            <h3 className="mb-3 font-serif text-lg font-semibold text-charcoal">
              {pick(locale === "ar" ? { en: "", ar: "تنبيهات الجدول الزمني" } : { en: "Timeline checks", ar: "" })}
            </h3>
            <ValidationList issues={validation.timeline} />
          </div>
        )}

        {/* Confirm */}
        <div className="luxe-card p-6 text-center">
          {blocked ? (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {pick(t.review.blockingError)}
            </p>
          ) : validation.hasWarnings ? (
            <p className="mb-4 text-sm text-amber-700">
              {locale === "ar" ? "يوجد تنبيهات بسيطة، يمكنك المتابعة." : "There are minor warnings — you may still continue."}
            </p>
          ) : (
            <p className="mb-4 text-sm font-medium text-emerald-700">{pick(t.review.valid)}</p>
          )}
          {serverError && <p className="mb-4 text-sm text-red-600">{serverError}</p>}
          <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => router.push("/journey/verify")} className="btn-ghost">
              ← {pick(t.common.back)}
            </button>
            <button onClick={confirm} disabled={blocked || submitting} className="btn-gold px-10">
              {submitting ? pick(t.common.loading) : pick(t.review.confirmRequest)}
            </button>
          </div>
          <p className="mt-4 text-xs text-charcoal/40">{pick(t.home.quoteNote)}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, badge, ok }: { k: string; v: string; badge?: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-charcoal/5 py-1.5">
      <dt className="text-charcoal/50">{k}</dt>
      <dd className="flex items-center gap-2 font-medium text-charcoal">
        {v}
        {badge && (
          <span className={`badge text-[0.65rem] ${ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {badge}
          </span>
        )}
      </dd>
    </div>
  );
}

function StepReviewCard({
  step,
  index,
  onEdit,
}: {
  step: JourneyStepInput;
  index: number;
  onEdit: () => void;
}) {
  const { t, pick, locale } = useI18n();
  const def = getStep(step.stepType);
  const skipped = step.skipped || step.serviceType === "SKIP";
  const result = validateStep(step);
  const allIssues = [...result.errors, ...result.warnings];

  const serviceName = SERVICE_TYPES.find((s) => s.type === step.serviceType)?.name[locale];

  return (
    <div className={`luxe-card p-5 ${result.errors.length ? "ring-1 ring-red-200" : ""}`}>
      <div className="flex items-start gap-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${skipped ? "bg-charcoal/5 text-charcoal/40" : "bg-gold-gradient text-charcoal"}`}>
          {index}
        </span>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-medium text-charcoal">{pick(def.name)}</h3>
              {skipped ? (
                <span className="badge mt-1 bg-charcoal/5 text-charcoal/50">{pick(t.review.skipped)}</span>
              ) : (
                <span className="badge mt-1 bg-emerald-50 text-emerald-700">{pick(t.review.completed)}</span>
              )}
            </div>
            <button onClick={onEdit} className="btn-ghost px-3 py-1 text-xs">
              {pick(t.common.edit)}
            </button>
          </div>

          {!skipped && (
            <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {step.city && <RowMini k={pick(t.fields.city)} v={getCity(step.city)?.name[locale] ?? step.city} />}
              {step.airport && <RowMini k={pick(t.fields.airport)} v={step.airport} />}
              {step.terminal && <RowMini k={pick(t.fields.terminal)} v={step.terminal} />}
              {step.date && (
                <RowMini
                  k={pick(t.fields.date)}
                  v={formatDateTime(`${step.date}T${step.time ?? "00:00"}`, locale, { dateStyle: "medium", timeStyle: step.time ? "short" : undefined })}
                />
              )}
              {step.flightNumber && <RowMini k={pick(t.fields.flightNumber)} v={step.flightNumber} />}
              {(step.pickupLocation || step.homeAddress) && <RowMini k={pick(t.fields.pickup)} v={step.pickupLocation || step.homeAddress!} />}
              {(step.dropoffLocation || step.hotelName) && <RowMini k={pick(t.fields.dropoff)} v={step.dropoffLocation || step.hotelName!} />}
              {step.carCategory && <RowMini k={pick(t.fields.carCategory)} v={getVehicle(step.carCategory).name[locale]} />}
              {step.passengers != null && <RowMini k={pick(t.fields.passengers)} v={String(step.passengers)} />}
              {step.bags != null && <RowMini k={pick(t.fields.bags)} v={String(step.bags)} />}
              {step.days != null && <RowMini k={pick(t.fields.days)} v={String(step.days)} />}
              {serviceName && <RowMini k={pick(t.builder.serviceType)} v={serviceName} />}
              {step.notes && <RowMini k={pick(t.fields.notes)} v={step.notes} />}
            </dl>
          )}

          {!skipped && allIssues.length > 0 && <ValidationList issues={allIssues} className="mt-3" />}
        </div>
      </div>
    </div>
  );
}

function RowMini({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-charcoal/5 py-1">
      <dt className="text-charcoal/45">{k}</dt>
      <dd className="text-end font-medium text-charcoal">{v}</dd>
    </div>
  );
}
