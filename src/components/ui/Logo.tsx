import { cn } from "@/lib/utils";

export function Logo({ className, variant = "dark" }: { className?: string; variant?: "dark" | "light" }) {
  const color = variant === "light" ? "text-ivory" : "text-charcoal";
  return (
    <span className={cn("inline-flex items-baseline gap-2 font-serif", className)}>
      <span className={cn("text-2xl font-semibold tracking-[0.2em]", color)}>RTD</span>
      <span className="h-4 w-px bg-gold/60" aria-hidden />
      <span className="gold-text text-[0.7rem] font-medium uppercase tracking-[0.3em]">Concierge</span>
    </span>
  );
}
