"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { REQUEST_STATUSES, getStep, type RequestStatus } from "@/lib/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RequestJourney, type DisplayStep } from "@/components/dashboard/RequestJourney";
import { Select, TextArea } from "@/components/ui/Field";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import { formatDateTime } from "@/lib/utils";
import { formatPrice } from "@/lib/pricing";
import {
  adminAddNote,
  adminAssignDriver,
  adminAssignEmployee,
  adminCancelRequest,
  adminChangeStatus,
} from "@/server/actions/staff.actions";
import { adminChangeRequestPrice, adminSetPaymentStatus } from "@/server/actions/pricing.actions";
import { TextInput, Select as DSelect } from "@/components/ui/Field";
import type { JourneyStepInput } from "@/lib/types";
import type { PaymentStatus } from "@prisma/client";

interface RequestData {
  id: string;
  referenceNumber: string;
  status: RequestStatus;
  selectedPackage: any;
  carCategory: any;
  passengers: number;
  bags: number;
  children: boolean;
  childSeat: boolean;
  notes: string | null;
  contactMeInstead: boolean;
  createdAt: string;
  currency: string;
  estimatedTotal: number;
  finalPrice: number | null;
  priceStatus: string;
  paymentStatus: PaymentStatus;
  customer: { fullName: string; phone: string; email: string; phoneVerified: boolean; emailVerified: boolean; language: string };
  assignedEmployee: { id: string; fullName: string } | null;
  assignedDriver: { id: string; fullName: string } | null;
  journeySteps: (DisplayStep & { computedPrice: number | null })[];
  priceHistory: { id: string; changeType: string; oldPrice: number | null; newPrice: number; reason: string | null; createdAt: string; changedBy: { fullName: string } | null }[];
  statusHistory: { id: string; fromStatus: RequestStatus | null; toStatus: RequestStatus; reason: string | null; createdAt: string; changedBy: { fullName: string } | null }[];
  internalNotes: { id: string; body: string; createdAt: string; author: { fullName: string } | null }[];
}

export function RequestDetailView({
  request,
  employees,
  drivers,
}: {
  request: RequestData;
  employees: { id: string; fullName: string }[];
  drivers: { id: string; fullName: string }[];
}) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [copied, setCopied] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    await fn();
    setBusy(false);
    router.refresh();
  }

  const waSteps: JourneyStepInput[] = request.journeySteps.map((s) => ({
    stepType: s.stepType as any,
    serviceType: s.serviceType as any,
    skipped: s.skipped,
    city: s.city ?? undefined,
    airport: s.airport ?? undefined,
    flightNumber: s.flightNumber ?? undefined,
    date: s.scheduledAt ? s.scheduledAt.slice(0, 10) : undefined,
    time: s.scheduledAt ? s.scheduledAt.slice(11, 16) : undefined,
    pickupLocation: s.pickupLocation ?? undefined,
    dropoffLocation: s.dropoffLocation ?? undefined,
    hotelName: s.hotelName ?? undefined,
    homeAddress: s.homeAddress ?? undefined,
    carCategory: (s.carCategory as any) ?? undefined,
    passengers: s.passengers ?? undefined,
    bags: s.bags ?? undefined,
  }));

  async function copyWhatsapp() {
    const msg = buildWhatsAppMessage({
      referenceNumber: request.referenceNumber,
      customerName: request.customer.fullName,
      phone: request.customer.phone,
      selectedPackage: request.selectedPackage,
      steps: waSteps,
      carCategory: request.carCategory,
      passengers: request.passengers,
      bags: request.bags,
      estimatedTotal: request.finalPrice ?? request.estimatedTotal,
      notes: request.notes,
      locale,
    });
    await navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:block">
        <div>
          <button onClick={() => router.back()} className="btn-ghost mb-1 px-2 py-1 text-xs print:hidden">← {pick(t.common.back)}</button>
          <h1 className="font-mono text-2xl font-bold text-charcoal">{request.referenceNumber}</h1>
          <p className="text-sm text-charcoal/50">{formatDateTime(request.createdAt, locale)}</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <StatusBadge status={request.status} />
          <button onClick={copyWhatsapp} className="btn-outline px-3 py-2 text-xs">
            {copied ? pick(t.common.copied) : pick(t.admin.copyWhatsapp)}
          </button>
          <button onClick={() => window.print()} className="btn-outline px-3 py-2 text-xs">{pick(t.admin.exportPdf)}</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: customer + journey */}
        <div className="space-y-6">
          <div className="luxe-card p-5">
            <h3 className="mb-3 font-serif text-lg font-semibold text-charcoal">{pick(t.admin.customer)}</h3>
            <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              <Row k={pick(t.fields.fullName)} v={request.customer.fullName} />
              <Row k={pick(t.fields.phone)} v={request.customer.phone} ok={request.customer.phoneVerified} />
              <Row k={pick(t.fields.email)} v={request.customer.email} ok={request.customer.emailVerified} />
              <Row k={pick(t.fields.language)} v={request.customer.language} />
              <Row k={pick(t.fields.children)} v={request.children ? pick(t.common.yes) : pick(t.common.no)} />
              <Row k={pick(t.fields.childSeat)} v={request.childSeat ? pick(t.common.yes) : pick(t.common.no)} />
            </dl>
            {request.contactMeInstead && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{pick(t.details.contactMe)}</p>
            )}
            {request.notes && <p className="mt-3 text-sm text-charcoal/70">“{request.notes}”</p>}
          </div>

          <div>
            <h3 className="mb-3 font-serif text-lg font-semibold text-charcoal">{pick(t.admin.journey)}</h3>
            <RequestJourney steps={request.journeySteps} />
          </div>
        </div>

        {/* Right: actions */}
        <div className="space-y-5 print:hidden">
          {/* Pricing */}
          <Panel title={pick(t.pricing.estimatedTotal)}>
            <PricingPanel request={request} />
          </Panel>

          {/* Status */}
          <Panel title={pick(t.admin.changeStatus)}>
            <Select
              value={request.status}
              disabled={busy}
              onChange={(e) => run(() => adminChangeStatus(request.id, e.target.value as RequestStatus))}
            >
              {REQUEST_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.name[locale]}</option>
              ))}
            </Select>
            <div className="mt-3 flex gap-2">
              <button onClick={() => run(() => adminChangeStatus(request.id, "CONFIRMED"))} className="btn-gold flex-1 px-2 py-2 text-xs">{pick(t.admin.markConfirmed)}</button>
              <button onClick={() => run(() => adminChangeStatus(request.id, "COMPLETED"))} className="btn-dark flex-1 px-2 py-2 text-xs">{pick(t.admin.markCompleted)}</button>
            </div>
          </Panel>

          {/* Assign */}
          <Panel title={pick(t.admin.assignEmployee)}>
            <Select
              value={request.assignedEmployee?.id ?? ""}
              disabled={busy}
              onChange={(e) => run(() => adminAssignEmployee(request.id, e.target.value || null))}
            >
              <option value="">{pick(t.common.none)}</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </Select>
          </Panel>
          <Panel title={pick(t.admin.assignDriver)}>
            <Select
              value={request.assignedDriver?.id ?? ""}
              disabled={busy}
              onChange={(e) => run(() => adminAssignDriver(request.id, e.target.value || null))}
            >
              <option value="">{pick(t.common.none)}</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.fullName}</option>
              ))}
            </Select>
          </Panel>

          {/* Notes */}
          <Panel title={pick(t.admin.internalNotes)}>
            <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder={pick(t.admin.addNote)} />
            <button
              disabled={busy || !note.trim()}
              onClick={() => run(async () => { await adminAddNote(request.id, note); setNote(""); })}
              className="btn-dark mt-2 w-full py-2 text-xs"
            >
              {pick(t.admin.addNote)}
            </button>
            <ul className="mt-3 space-y-2">
              {request.internalNotes.map((n) => (
                <li key={n.id} className="rounded-lg bg-ivory-warm p-3 text-sm">
                  <p className="text-charcoal/80">{n.body}</p>
                  <p className="mt-1 text-xs text-charcoal/40">{n.author?.fullName} · {formatDateTime(n.createdAt, locale, { dateStyle: "short", timeStyle: "short" })}</p>
                </li>
              ))}
            </ul>
          </Panel>

          {/* History */}
          <Panel title={pick(t.admin.statusHistory)}>
            <ol className="space-y-2">
              {request.statusHistory.map((h) => (
                <li key={h.id} className="flex items-center justify-between text-xs">
                  <StatusBadge status={h.toStatus} />
                  <span className="text-charcoal/40">{formatDateTime(h.createdAt, locale, { dateStyle: "short", timeStyle: "short" })}</span>
                </li>
              ))}
            </ol>
          </Panel>

          {/* Cancel */}
          {request.status !== "CANCELLED" && (
            <Panel title={pick(t.admin.cancelRequest)}>
              <TextArea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder={pick(t.admin.cancelReason)} />
              <button
                disabled={busy || !cancelReason.trim()}
                onClick={() => run(() => adminCancelRequest(request.id, cancelReason))}
                className="btn mt-2 w-full bg-red-500 py-2 text-xs text-white hover:bg-red-600"
              >
                {pick(t.admin.cancelRequest)}
              </button>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="luxe-card p-4">
      <h4 className="mb-3 text-sm font-semibold text-charcoal">{title}</h4>
      {children}
    </div>
  );
}

function PricingPanel({ request }: { request: RequestData }) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<"OVERRIDE" | "DISCOUNT" | "SURCHARGE">("OVERRIDE");
  const [amount, setAmount] = useState<string>(String(request.finalPrice ?? request.estimatedTotal));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function apply() {
    setError(undefined);
    const value = parseInt(amount, 10);
    if (Number.isNaN(value) || value < 0) return setError(locale === "ar" ? "قيمة غير صحيحة" : "Invalid amount");
    if (reason.trim().length < 2) return setError(locale === "ar" ? "السبب مطلوب" : "Reason required");
    setBusy(true);
    const res = await adminChangeRequestPrice({ requestId: request.id, newPrice: value, changeType: mode, reason });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setReason("");
    router.refresh();
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-charcoal/50">{pick(t.pricing.estimatedTotal)}</span>
        <span className="font-semibold text-charcoal">{formatPrice(request.estimatedTotal, locale)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-charcoal/50">{pick(t.pricing.finalPrice)}</span>
        <span className="font-semibold text-gold-dark">
          {request.finalPrice != null ? formatPrice(request.finalPrice, locale) : "—"}
        </span>
      </div>

      {/* Per-step prices */}
      <details className="rounded-lg bg-ivory-warm p-2">
        <summary className="cursor-pointer text-xs text-charcoal/60">{pick(t.admin.journey)}</summary>
        <ul className="mt-2 space-y-1">
          {request.journeySteps.filter((s) => !s.skipped).map((s) => (
            <li key={s.stepOrder} className="flex justify-between text-xs">
              <span className="text-charcoal/60">{pick(getStep(s.stepType as any).shortName)}</span>
              <span className="text-charcoal">{s.computedPrice != null ? formatPrice(s.computedPrice, locale) : "—"}</span>
            </li>
          ))}
        </ul>
      </details>

      {/* Payment status */}
      <label className="block">
        <span className="field-label">{pick(t.pricing.paymentStatus)}</span>
        <DSelect
          value={request.paymentStatus}
          onChange={async (e) => { await adminSetPaymentStatus(request.id, e.target.value as PaymentStatus); router.refresh(); }}
        >
          {["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </DSelect>
      </label>

      {/* Override / adjust */}
      <div className="rounded-lg border border-charcoal/10 p-3">
        <div className="mb-2 flex gap-1">
          {(["OVERRIDE", "DISCOUNT", "SURCHARGE"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 rounded-md px-2 py-1 text-xs ${mode === m ? "bg-charcoal text-ivory" : "bg-charcoal/5 text-charcoal/60"}`}>
              {m === "OVERRIDE" ? pick(t.pricing.override) : m === "DISCOUNT" ? pick(t.pricing.discount) : pick(t.pricing.surcharge)}
            </button>
          ))}
        </div>
        <TextInput type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="mb-2" />
        <TextInput placeholder={pick(t.pricing.reason)} value={reason} onChange={(e) => setReason(e.target.value)} className="mb-2" />
        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
        <button onClick={apply} disabled={busy} className="btn-gold w-full py-2 text-xs">{pick(t.pricing.save)}</button>
      </div>

      {/* History */}
      {request.priceHistory.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-charcoal/60">{pick(t.pricing.priceHistory)}</p>
          <ul className="space-y-1">
            {request.priceHistory.map((h) => (
              <li key={h.id} className="rounded-md bg-ivory-warm px-2 py-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-charcoal">{h.changeType}</span>
                  <span className="text-charcoal">{formatPrice(h.newPrice, locale)}</span>
                </div>
                {h.reason && <p className="text-charcoal/50">{h.reason}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ k, v, ok }: { k: string; v: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-charcoal/5 py-1.5">
      <dt className="text-charcoal/45">{k}</dt>
      <dd className="flex items-center gap-1.5 text-end font-medium text-charcoal">
        {v}
        {ok !== undefined && (
          <span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-400"}`} title={ok ? "verified" : "pending"} />
        )}
      </dd>
    </div>
  );
}
