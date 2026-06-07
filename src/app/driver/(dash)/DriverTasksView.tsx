"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import {
  DRIVER_TASK_STATUSES,
  getCity,
  getStep,
  getVehicle,
} from "@/lib/domain";
import { TextArea } from "@/components/ui/Field";
import { driverUpdateTask } from "@/server/actions/staff.actions";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { DriverTaskStatus } from "@prisma/client";

interface Task {
  id: string;
  status: DriverTaskStatus;
  driverNotes: string | null;
  request: { referenceNumber: string; customer: { fullName: string; phone: string } };
  journeyStep: {
    stepType: string;
    city: string | null;
    scheduledAt: string | null;
    pickupLocation: string | null;
    dropoffLocation: string | null;
    hotelName: string | null;
    homeAddress: string | null;
    flightNumber: string | null;
    carCategory: string | null;
    passengers: number | null;
    bags: number | null;
    notes: string | null;
  };
}

const NEXT: Record<DriverTaskStatus, DriverTaskStatus | null> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "ON_THE_WAY",
  ON_THE_WAY: "ARRIVED",
  ARRIVED: "COMPLETED",
  COMPLETED: null,
};

export function DriverTasksView({ tasks }: { tasks: Task[] }) {
  const { t, pick } = useI18n();
  return (
    <div className="space-y-5">
      <h1 className="font-serif text-2xl font-semibold text-charcoal">{pick(t.admin.myTasks)}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && <div className="luxe-card p-10 text-center text-sm text-charcoal/40">—</div>}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(task.driverNotes ?? "");
  const step = task.journeyStep;
  const def = getStep(step.stepType as any);
  const next = NEXT[task.status];

  async function update(status: DriverTaskStatus, withNotes = false) {
    setBusy(true);
    await driverUpdateTask(task.id, status, withNotes ? notes : undefined);
    setBusy(false);
    router.refresh();
  }

  const statusLabel = DRIVER_TASK_STATUSES.find((s) => s.value === task.status)?.name[locale];
  const nextLabel = next ? DRIVER_TASK_STATUSES.find((s) => s.value === next)?.name[locale] : null;

  return (
    <div className="luxe-card overflow-hidden">
      <div className="flex items-center justify-between bg-charcoal-gradient px-5 py-3 text-ivory">
        <span className="font-mono text-sm">{task.request.referenceNumber}</span>
        <span className={cn("badge", task.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-200" : "bg-gold/20 text-gold-light")}>
          {statusLabel}
        </span>
      </div>
      <div className="space-y-3 p-5">
        <p className="font-medium text-charcoal">{pick(def.name)}</p>
        <dl className="grid gap-y-1 text-sm">
          {step.city && <Row k={pick(t.fields.city)} v={getCity(step.city)?.name[locale] ?? step.city} />}
          {step.scheduledAt && <Row k={pick(t.fields.date)} v={formatDateTime(step.scheduledAt, locale)} />}
          {(step.pickupLocation || step.homeAddress) && <Row k={pick(t.fields.pickup)} v={step.pickupLocation || step.homeAddress!} />}
          {(step.dropoffLocation || step.hotelName) && <Row k={pick(t.fields.dropoff)} v={step.dropoffLocation || step.hotelName!} />}
          {step.flightNumber && <Row k={pick(t.fields.flightNumber)} v={step.flightNumber} />}
          {step.carCategory && <Row k={pick(t.fields.carCategory)} v={getVehicle(step.carCategory as any).name[locale]} />}
          {step.passengers != null && <Row k={pick(t.fields.passengers)} v={String(step.passengers)} />}
          {step.notes && <Row k={pick(t.fields.notes)} v={step.notes} />}
        </dl>

        <div className="rounded-lg bg-ivory-warm p-3">
          <p className="text-sm font-medium text-charcoal">{task.request.customer.fullName}</p>
          <a href={`tel:${task.request.customer.phone}`} className="text-sm text-gold-dark">{task.request.customer.phone}</a>
        </div>

        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={pick(t.admin.driverNotes)} className="text-sm" />

        <div className="flex gap-2">
          <button onClick={() => update(task.status, true)} disabled={busy} className="btn-outline flex-1 py-2 text-xs">
            {pick(t.common.save)}
          </button>
          {next && (
            <button onClick={() => update(next)} disabled={busy} className="btn-gold flex-1 py-2 text-xs">
              {nextLabel} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-charcoal/5 py-1">
      <dt className="text-charcoal/45">{k}</dt>
      <dd className="text-end font-medium text-charcoal">{v}</dd>
    </div>
  );
}
