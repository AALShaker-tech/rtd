"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Reusable overlay dialog matching the app's modal style (bottom sheet on
 * mobile, centred card on desktop). Accessible by default: labelled dialog
 * role, Escape-to-close, backdrop click, body-scroll lock, and focus moved into
 * the dialog on open and restored to the trigger on close.
 */
export function Modal({
  title,
  onClose,
  children,
  footer,
  describedById,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional action row rendered at the bottom (e.g. the primary/secondary buttons). */
  footer?: React.ReactNode;
  /** id of the element describing the dialog, wired to aria-describedby. */
  describedById?: string;
}) {
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Remember what was focused so we can restore it when the dialog closes.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Move focus into the dialog for keyboard and screen-reader users.
    cardRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // Lock background scroll while the dialog is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedById}
        tabIndex={-1}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-luxe bg-white p-6 shadow-luxe outline-none sm:rounded-luxe"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 id={titleId} className="font-serif text-xl font-semibold text-charcoal">{title}</h3>
          <button onClick={onClose} className="btn-ghost px-2 py-1 text-lg" aria-label="close">✕</button>
        </div>
        {children}
        {footer && <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}
