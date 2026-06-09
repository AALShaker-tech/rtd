"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { lookupRequest } from "@/server/actions/request.actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/domain";
import { formatDateTime } from "@/lib/utils";

type Result = Awaited<ReturnType<typeof lookupRequest>>;

function StatusInner() {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const params = useSearchParams();
  const [ref, setRef] = useState(params.get("ref") ?? "");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function search(value?: string) {
    const q = (value ?? ref).trim();
    if (!q) return;
    setBusy(true);
    setResult(await lookupRequest(q));
    setBusy(false);
  }

  useEffect(() => {
    if (params.get("ref")) search(params.get("ref")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ink-wrap rise pb-20 pt-8">
      <h1 className="disp text-center text-[26px] font-semibold text-cream">{pick(t.status.title)}</h1>

      <div className="mt-6 dcard p-5">
        <span className="mb-1.5 block text-[13px] text-dim">{pick(t.success.reference)}</span>
        <div className="flex gap-2">
          <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder={pick(t.status.placeholder)} onKeyDown={(e) => e.key === "Enter" && search()} className="dinput flex-1 font-mono" />
          <button onClick={() => search()} disabled={busy} className="gbtn px-5">{pick(t.status.lookup)}</button>
        </div>

        {result && !result.ok && (
          <p className="mt-4 rounded-lg px-4 py-3 text-[13px]" style={{ background: "rgba(211,112,95,.10)", color: "#e69384" }}>{pick(t.status.notFound)}</p>
        )}

        {result && result.ok && (
          <div className="mt-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="disp text-[18px] font-bold text-cream">{result.request.referenceNumber}</p>
                <p className="text-[13px] text-dim">{result.request.customer.fullName}</p>
              </div>
              <StatusBadge status={result.request.status} />
            </div>
            <Timeline current={result.request.status} history={result.request.statusHistory} />
          </div>
        )}
      </div>
    </div>
  );
}

function Timeline({ current, history }: { current: RequestStatus; history: { toStatus: RequestStatus; createdAt: Date | string }[] }) {
  const { locale } = useI18n();
  if (current === "CANCELLED") {
    return (
      <ol className="ps-7"><li className="relative"><span className="absolute -start-7 top-1 h-3.5 w-3.5 rounded-full bg-red-500 ring-4" style={{ ["--tw-ring-color" as string]: "#0f1d22" }} /><StatusBadge status="CANCELLED" /></li></ol>
    );
  }
  const flow = REQUEST_STATUSES.filter((s) => s.value !== "CANCELLED");
  const currentOrder = flow.find((s) => s.value === current)?.order ?? 0;
  const reached = new Map(history.map((h) => [h.toStatus, h.createdAt]));

  return (
    <ol className="relative space-y-5 ps-7">
      <span className="absolute bottom-3 top-2 w-px" style={{ insetInlineStart: 6, background: "rgba(201,168,106,.3)" }} />
      {flow.map((s) => {
        const done = s.order <= currentOrder;
        const at = reached.get(s.value);
        return (
          <li key={s.value} className="relative">
            <span className={`absolute -start-7 top-1 h-3.5 w-3.5 rounded-full ${done ? "bg-gold-gradient" : ""}`} style={{ background: done ? undefined : "rgba(255,255,255,.15)" }} />
            <p className={`text-[13.5px] font-medium ${done ? "text-cream" : "text-dim"}`}>{s.name[locale]}</p>
            {at && <p className="text-[11.5px] text-dim">{formatDateTime(at, locale)}</p>}
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
