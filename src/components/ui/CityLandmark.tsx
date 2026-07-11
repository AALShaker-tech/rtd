import type { ReactNode } from "react";

/**
 * A simple line-art landmark representing a destination, drawn in the same
 * stroked style as the rest of the app's icons (currentColor, rounded joins) so
 * it inherits the surrounding gold/charcoal palette. Admin-added cities we don't
 * have art for fall back to a generic monument.
 */
const LANDMARKS: Record<string, ReactNode> = {
  // Big Ben — London
  LON: (
    <>
      <path d="M9 21V9h6v12" />
      <path d="M9 9l3-4 3 4" />
      <path d="M12 5V3" />
      <circle cx="12" cy="12.5" r="1.8" />
      <path d="M7.5 21h9" />
    </>
  ),
  // Eiffel Tower — Paris
  PAR: (
    <>
      <path d="M12 2v3" />
      <path d="M9.5 5h5" />
      <path d="M9.5 5 4 21" />
      <path d="M14.5 5 20 21" />
      <path d="M8 12h8" />
      <path d="M6 17h12" />
      <path d="M3.5 21h17" />
    </>
  ),
  // Burj Khalifa — Dubai
  DXB: (
    <>
      <path d="M12 2v19" />
      <path d="M9.5 21V9l2.5-4" />
      <path d="M14.5 21V9L12 5" />
      <path d="M7.5 21v-7l2-3" />
      <path d="M16.5 21v-7l-2-3" />
      <path d="M7 21h10" />
    </>
  ),
  // Pyramids — Cairo
  CAI: (
    <>
      <path d="M2.5 20 9 7l6.5 13" />
      <path d="M11 20 16 10l5 10" />
      <path d="M2 20h20" />
      <circle cx="19.5" cy="5.5" r="1.4" />
    </>
  ),
  // Kingdom Centre — Riyadh
  RUH: (
    <>
      <path d="M8.5 21C8.5 12 9 7 11 4.6" />
      <path d="M15.5 21C15.5 12 15 7 13 4.6" />
      <path d="M11 4.6a2.2 2.2 0 0 1 2 0" />
      <path d="M7 21h10" />
    </>
  ),
  // Statue of Liberty — New York (for future NYC-coded cities)
  NYC: (
    <>
      <path d="M12 21V9" />
      <circle cx="12" cy="6.6" r="1.5" />
      <path d="M10.5 5.4l-.3-1.4M12 5.1V3.5M13.5 5.4l.3-1.4" />
      <path d="M13 7l2.6-4 .5-1.6" />
      <path d="M9 21v-4h6v4" />
      <path d="M7.5 21h9" />
    </>
  ),
};

export function CityLandmark({
  code,
  size = 20,
  className,
}: {
  code?: string | null;
  size?: number;
  className?: string;
}) {
  const art = (code && LANDMARKS[code.toUpperCase()]) ?? (
    // Generic monument fallback for cities without dedicated art.
    <>
      <path d="M8 21V7l4-4 4 4v14" />
      <path d="M8 21h8" />
      <path d="M10.5 21v-5h3v5" />
    </>
  );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {art}
    </svg>
  );
}
