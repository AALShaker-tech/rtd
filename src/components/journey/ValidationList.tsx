"use client";

import { useI18n } from "@/i18n/I18nProvider";
import type { ValidationIssue } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ValidationList({ issues, className }: { issues: ValidationIssue[]; className?: string }) {
  const { locale } = useI18n();
  if (issues.length === 0) return null;
  return (
    <ul className={cn("space-y-1.5", className)}>
      {issues.map((issue, i) => (
        <li
          key={i}
          className={cn(
            "flex items-start gap-2 rounded-lg px-3 py-2 text-xs leading-relaxed",
            issue.severity === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800",
          )}
        >
          <Icon severity={issue.severity} />
          <span>{locale === "ar" ? issue.messageAr : issue.messageEn}</span>
        </li>
      ))}
    </ul>
  );
}

function Icon({ severity }: { severity: "error" | "warning" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
      {severity === "error" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M12 4l9 16H3z" strokeLinejoin="round" />
          <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
