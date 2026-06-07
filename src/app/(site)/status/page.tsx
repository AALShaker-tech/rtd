"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { lookupRequest } from "@/server/actions/request.actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FieldWrap, TextInput } from "@/components/ui/Field";
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/domain";
import { formatDateTime } from "@/lib/utils";

type Result = Awaited<ReturnType<typeof lookupRequest>>;

function StatusInner() {
  const { t, pick, locale } = useI18n();
  const params = useSearchParams();
  const [ref, setRef] = useState(params.get("ref") ?? "");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function search(value?: string) {
    const q = (value ?? ref).trim();
    if (!q) return;
    setBusy(true);
    const res = await lookupRequest(q);
    setResult(res);
    setBusy(false);
  }

  useEffect(() => {
    if (params.get("ref")) search(params.get("ref")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="luxe-container py-14 md:py-20">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <div className="gold-rule mx-auto mb-5" />
          <h1 className="text-3xl font-semibold text-charcoal md:text-4xl">{pick(t.status.title)}</h1>
        </div>

        <div className="luxe-card p-6">
          <FieldWrap label={pick(t.success.reference)}>
            <div className="flex gap-2">
              <TextInput
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder={pick(t.status.placeholder)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                className="flex-1 font-mono"
              />
              <button onClick={() => search()} disabled={busy} className="btn-gold shrink-0">
                {pick(t.status.lookup)}
              </button>
            </div>
          </FieldWrap>

          {result && !result.ok && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{pick(t.status.notFound)}</p>
          )}

          {result && result.ok && (
            <div className="mt-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="font-mono text-lg font-bold text-charcoal">{result.request.referenceNumber}</p>
                  <p className="text-sm text-charcoal/50">{result.request.customer.fullName}</p>
                </div>
                <StatusBadge status={result.request.status} />
              </div>

              <Timeline current={result.request.status} history={result.request.statusHistory} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Timeline({
  current,
  history,
}: {
  current: RequestStatus;
  history: { toStatus: RequestStatus; createdAt: Date | string }[];
}) {
  const { locale } = useI18n();
  if (current === "CANCELLED") {
    return (
      <ol className="relative space-y-5 ps-7">
        <li className="relative">
          <span className="absolute -start-7 top-1 h-3.5 w-3.5 rounded-full bg-red-500 ring-4 ring-white" />
          <StatusBadge status="CANCELLED" />
        </li>
      </ol>
    );
  }

  const flow = REQUEST_STATUSES.filter((s) => s.value !== "CANCELLED");
  const currentOrder = flow.find((s) => s.value === current)?.order ?? 0;
  const reached = new Map(history.map((h) => [h.toStatus, h.createdAt]));

  return (
    <ol className="relative space-y-5 ps-7">
      <span className="timeline-line bottom-3 start-[6px] top-2" aria-hidden />
      {flow.map((s) => {
        const done = s.order <= currentOrder;
        const at = reached.get(s.value);
        return (
          <li key={s.value} className="relative">
            <span
              className={`absolute -start-7 top-1 h-3.5 w-3.5 rounded-full ring-4 ring-white ${
                done ? "bg-gold-gradient" : "bg-charcoal/15"
              }`}
            />
            <p className={`text-sm font-medium ${done ? "text-charcoal" : "text-charcoal/40"}`}>{s.name[locale]}</p>
            {at && <p className="text-xs text-charcoal/40">{formatDateTime(at, locale)}</p>}
          </li>
        );
      })}
    </ol>
  );
}

export default function StatusPage() {
  return (
    <Suspense>
      <StatusInner />
    </Suspense>
  );
}
