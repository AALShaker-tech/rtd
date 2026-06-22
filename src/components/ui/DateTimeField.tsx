"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { cn, formatDateOnly } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
   Custom, light-luxury date & time pickers for the RTD customer flow.
   Replace the raw browser inputs so the calendar / time popover matches the
   premium design (soft borders, gold accents) and behaves identically in
   Arabic RTL and English LTR. Clicking anywhere in the field opens the picker.
   ───────────────────────────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0");
const toISODate = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function parseISODate(v?: string): { y: number; m: number; d: number } | null {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
}

const WEEKDAYS: Record<"en" | "ar", string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ar: ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"],
};

const CalendarIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a8854a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </svg>
);

const ClockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a8854a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

/** Close the popover when clicking outside / pressing Escape. */
function useDismiss(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  return ref;
}

const triggerClass = (error?: boolean, open?: boolean) =>
  cn(
    "flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm shadow-sm transition outline-none",
    "hover:border-gold/60",
    open ? "border-gold ring-2 ring-gold/30" : "border-charcoal/15",
    error && "border-red-400 ring-red-200",
  );

const popoverClass =
  "absolute z-40 mt-2 rounded-2xl border border-charcoal/10 bg-white p-3 shadow-luxe ltr:left-0 rtl:right-0 animate-fade-up";

export function DateField({
  id,
  value,
  min,
  onChange,
  error,
  placeholder,
  autoOpen,
}: {
  id?: string;
  value?: string;
  min?: string;
  onChange: (v: string) => void;
  error?: boolean;
  placeholder?: string;
  autoOpen?: boolean;
}) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [open, setOpen] = useState(!!autoOpen);
  const ref = useDismiss(open, () => setOpen(false));

  const sel = parseISODate(value);
  const minP = parseISODate(min);
  const [view, setView] = useState(() => {
    const base = sel ?? parseISODate(new Date().toISOString().slice(0, 10))!;
    return { y: base.y, m: base.m };
  });

  // Keep the visible month in sync when the value changes externally.
  useEffect(() => {
    if (sel) setView({ y: sel.y, m: sel.m });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const grid = useMemo(() => {
    const firstWeekday = new Date(view.y, view.m, 1).getDay();
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [view]);

  const header = new Intl.DateTimeFormat(ar ? "ar" : "en", { month: "long", year: "numeric" }).format(
    new Date(view.y, view.m, 1),
  );

  const isDisabled = (d: number) => (min ? toISODate(view.y, view.m, d) < min : false);
  const isSelected = (d: number) => sel && sel.y === view.y && sel.m === view.m && sel.d === d;

  const step = (delta: number) => {
    setView((v) => {
      const m = v.m + delta;
      return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" id={id} className={triggerClass(error, open)} onClick={() => setOpen((o) => !o)}>
        <span className={cn(value ? "font-medium text-charcoal" : "text-charcoal/35")}>
          {value ? formatDateOnly(value, locale) : placeholder ?? (ar ? "اختر التاريخ" : "Select date")}
        </span>
        <CalendarIcon />
      </button>

      {open && (
        <div className={cn(popoverClass, "w-[19rem]")} dir={ar ? "rtl" : "ltr"}>
          <div className="mb-2 flex items-center justify-between px-1">
            <button type="button" onClick={() => step(-1)} className="grid h-8 w-8 place-items-center rounded-lg text-charcoal/60 transition hover:bg-ivory-warm hover:text-gold-dark">
              <span className="rtl:hidden">‹</span><span className="ltr:hidden">›</span>
            </button>
            <span className="text-sm font-semibold text-charcoal">{header}</span>
            <button type="button" onClick={() => step(1)} className="grid h-8 w-8 place-items-center rounded-lg text-charcoal/60 transition hover:bg-ivory-warm hover:text-gold-dark">
              <span className="rtl:hidden">›</span><span className="ltr:hidden">‹</span>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 px-1 pb-1 text-center text-[11px] font-medium text-charcoal/40">
            {WEEKDAYS[ar ? "ar" : "en"].map((w) => (
              <span key={w} className="py-1">{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 px-1">
            {grid.map((d, i) =>
              d === null ? (
                <span key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled(d)}
                  onClick={() => {
                    onChange(toISODate(view.y, view.m, d));
                    setOpen(false);
                  }}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg text-sm transition",
                    isSelected(d)
                      ? "bg-gold-gradient font-semibold text-charcoal shadow-card"
                      : "text-charcoal/80 hover:bg-ivory-warm hover:text-gold-dark",
                    isDisabled(d) && "cursor-not-allowed text-charcoal/20 hover:bg-transparent hover:text-charcoal/20",
                  )}
                >
                  {d}
                </button>
              ),
            )}
          </div>
          {minP && (
            <button
              type="button"
              onClick={() => { onChange(min!); setOpen(false); }}
              className="mt-2 w-full rounded-lg py-1.5 text-xs font-medium text-gold-dark transition hover:bg-ivory-warm"
            >
              {ar ? "أقرب موعد متاح" : "Earliest available"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function TimeField({
  id,
  value,
  onChange,
  error,
  placeholder,
}: {
  id?: string;
  value?: string;
  onChange: (v: string) => void;
  error?: boolean;
  placeholder?: string;
}) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const uid = useId();

  const [h, m] = value ? value.split(":").map(Number) : [null, null];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const set = (nh: number | null, nm: number | null) => {
    const hh = nh ?? h ?? 0;
    const mm = nm ?? m ?? 0;
    onChange(`${pad(hh)}:${pad(mm)}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" id={id} className={triggerClass(error, open)} onClick={() => setOpen((o) => !o)}>
        <span className={cn(value ? "font-medium text-charcoal" : "text-charcoal/35")}>
          {value || placeholder || (ar ? "اختر الوقت" : "Select time")}
        </span>
        <ClockIcon />
      </button>

      {open && (
        <div className={cn(popoverClass, "w-44")} dir={ar ? "rtl" : "ltr"}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1 text-center text-[11px] font-medium text-charcoal/40">{ar ? "ساعة" : "Hour"}</p>
              <div className="max-h-44 overflow-y-auto rounded-lg border border-charcoal/5">
                {hours.map((hh) => (
                  <button
                    key={`${uid}-h-${hh}`}
                    type="button"
                    onClick={() => set(hh, null)}
                    className={cn(
                      "block w-full py-1.5 text-center text-sm transition",
                      h === hh ? "bg-gold-gradient font-semibold text-charcoal" : "text-charcoal/70 hover:bg-ivory-warm",
                    )}
                  >
                    {pad(hh)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-center text-[11px] font-medium text-charcoal/40">{ar ? "دقيقة" : "Min"}</p>
              <div className="max-h-44 overflow-y-auto rounded-lg border border-charcoal/5">
                {minutes.map((mm) => (
                  <button
                    key={`${uid}-m-${mm}`}
                    type="button"
                    onClick={() => set(null, mm)}
                    className={cn(
                      "block w-full py-1.5 text-center text-sm transition",
                      m === mm ? "bg-gold-gradient font-semibold text-charcoal" : "text-charcoal/70 hover:bg-ivory-warm",
                    )}
                  >
                    {pad(mm)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
