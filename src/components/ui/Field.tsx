"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FieldWrapProps {
  label?: string;
  hint?: string;
  error?: string;
  optional?: string;
  children: React.ReactNode;
  className?: string;
}

export function FieldWrap({ label, hint, error, optional, children, className }: FieldWrapProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="field-label flex items-center justify-between">
          <span>{label}</span>
          {optional && <span className="text-xs font-normal text-charcoal/40">{optional}</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-charcoal/50">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function TextInput({ className, invalid, ...props }, ref) {
    return <input ref={ref} className={cn("field-input", invalid && "field-input-error", className)} {...props} />;
  },
);

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn("field-input appearance-none pe-9", invalid && "field-input-error", className)} {...props}>
      {children}
    </select>
  );
});

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function TextArea({ className, invalid, ...props }, ref) {
  return <textarea ref={ref} className={cn("field-input min-h-[90px] resize-y", invalid && "field-input-error", className)} {...props} />;
});
