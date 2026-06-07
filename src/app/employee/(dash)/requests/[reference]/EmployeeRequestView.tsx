"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RequestJourney, type DisplayStep } from "@/components/dashboard/RequestJourney";
import { TextArea } from "@/components/ui/Field";
import { buildWhatsAppMessage, whatsappContactLink } from "@/lib/whatsapp";
import { adminAddNote, employeeEscalate, employeeMarkContacted } from "@/server/actions/staff.actions";
import type { RequestStatus } from "@/lib/domain";
import type { JourneyStepInput } from "@/lib/types";

interface Data {
  id: string;
  referenceNumber: string;
  status: RequestStatus;
  selectedPackage: any;
  carCategory: any;
  passengers: number;
  bags: number;
  notes: string | null;
  contactMeInstead: boolean;
  customer: { fullName: string; phone: string; email: string; phoneVerified: boolean; emailVerified: boolean; language: string };
  journeySteps: DisplayStep[];
  internalNotes: { id: string; body: string; createdAt: string; author: { fullName: string } | null }[];
}

export function EmployeeRequestView({ request }: { request: Data }) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
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

  async function copyWa() {
    const msg = buildWhatsAppMessage({
      referenceNumber: request.referenceNumber,
      customerName: request.customer.fullName,
      phone: request.customer.phone,
      selectedPackage: request.selectedPackage,
      steps: waSteps,
      carCategory: request.carCategory,
      passengers: request.passengers,
      bags: request.bags,
      notes: request.notes,
      locale,
    });
    await navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button onClick={() => router.push("/employee")} className="btn-ghost mb-1 px-2 py-1 text-xs">← {pick(t.common.back)}</button>
          <h1 className="font-mono text-2xl font-bold text-charcoal">{request.referenceNumber}</h1>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="luxe-card p-5">
            <h3 className="mb-3 font-serif text-lg font-semibold text-charcoal">{pick(t.admin.customer)}</h3>
            <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              <Row k={pick(t.fields.fullName)} v={request.customer.fullName} />
              <Row k={pick(t.fields.phone)} v={request.customer.phone} />
              <Row k={pick(t.fields.email)} v={request.customer.email} />
            </dl>
            {request.contactMeInstead && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{pick(t.details.contactMe)}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:${request.customer.phone}`} className="btn-outline px-3 py-2 text-xs">{pick(t.admin.contactClient)}</a>
              <a href={whatsappContactLink()} target="_blank" rel="noreferrer" className="btn-outline px-3 py-2 text-xs">WhatsApp</a>
              <button onClick={copyWa} className="btn-outline px-3 py-2 text-xs">{copied ? pick(t.common.copied) : pick(t.admin.copyWhatsapp)}</button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-serif text-lg font-semibold text-charcoal">{pick(t.admin.journey)}</h3>
            <RequestJourney steps={request.journeySteps} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="luxe-card p-4">
            <h4 className="mb-3 text-sm font-semibold text-charcoal">{pick(t.admin.updateStatus)}</h4>
            <button
              onClick={() => run(() => employeeMarkContacted(request.id))}
              disabled={busy}
              className="btn-gold w-full py-2 text-xs"
            >
              {pick(t.admin.markContacted)}
            </button>
          </div>

          <div className="luxe-card p-4">
            <h4 className="mb-3 text-sm font-semibold text-charcoal">{pick(t.admin.internalNotes)}</h4>
            <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder={pick(t.admin.addNote)} />
            <div className="mt-2 flex gap-2">
              <button
                disabled={busy || !note.trim()}
                onClick={() => run(async () => { await adminAddNote(request.id, note); setNote(""); })}
                className="btn-dark flex-1 py-2 text-xs"
              >
                {pick(t.admin.addNote)}
              </button>
              <button
                disabled={busy || !note.trim()}
                onClick={() => run(async () => { await employeeEscalate(request.id, note); setNote(""); })}
                className="btn-outline flex-1 py-2 text-xs"
              >
                {pick(t.admin.escalate)}
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {request.internalNotes.map((n) => (
                <li key={n.id} className="rounded-lg bg-ivory-warm p-3 text-sm text-charcoal/80">{n.body}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-charcoal/5 py-1.5">
      <dt className="text-charcoal/45">{k}</dt>
      <dd className="text-end font-medium text-charcoal">{v}</dd>
    </div>
  );
}
