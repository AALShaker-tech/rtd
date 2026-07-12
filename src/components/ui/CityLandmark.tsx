import type { ReactNode } from "react";

/**
 * Line-art landmark icons for destination cards, drawn in the app's stroked
 * style (currentColor, rounded joins) so they inherit the surrounding
 * gold/charcoal palette.
 *
 * Icons are a fixed, developer-curated library keyed by a `landmarkKey`. An
 * admin assigns one to a city from the Cities tab; when none is set we fall back
 * to a sensible default by city code, then to a generic monument. New preset art
 * is added here.
 */
const ART: Record<string, ReactNode> = {
  // ── Signature landmarks ──
  "big-ben": (
    <>
      <path d="M9 21V9h6v12" />
      <path d="M9 9l3-4 3 4" />
      <path d="M12 5V3" />
      <circle cx="12" cy="12.5" r="1.8" />
      <path d="M7.5 21h9" />
    </>
  ),
  "eiffel-tower": (
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
  "burj-khalifa": (
    <>
      <path d="M12 2v19" />
      <path d="M9.5 21V9l2.5-4" />
      <path d="M14.5 21V9L12 5" />
      <path d="M7.5 21v-7l2-3" />
      <path d="M16.5 21v-7l-2-3" />
      <path d="M7 21h10" />
    </>
  ),
  pyramids: (
    <>
      <path d="M2.5 20 9 7l6.5 13" />
      <path d="M11 20 16 10l5 10" />
      <path d="M2 20h20" />
      <circle cx="19.5" cy="5.5" r="1.4" />
    </>
  ),
  "kingdom-centre": (
    <>
      <path d="M8.5 21C8.5 12 9 7 11 4.6" />
      <path d="M15.5 21C15.5 12 15 7 13 4.6" />
      <path d="M11 4.6a2.2 2.2 0 0 1 2 0" />
      <path d="M7 21h10" />
    </>
  ),
  "statue-of-liberty": (
    <>
      <path d="M12 21V9" />
      <circle cx="12" cy="6.6" r="1.5" />
      <path d="M10.5 5.4l-.3-1.4M12 5.1V3.5M13.5 5.4l.3-1.4" />
      <path d="M13 7l2.6-4 .5-1.6" />
      <path d="M9 21v-4h6v4" />
      <path d="M7.5 21h9" />
    </>
  ),
  // ── Generic presets (for cities without a signature icon) ──
  skyscraper: (
    <>
      <path d="M8 21V5h8v16" />
      <path d="M6 21h12" />
      <path d="M10.5 21v-4h3v4" />
      <path d="M9.5 8h5M9.5 11h5M9.5 14h5" />
    </>
  ),
  tower: (
    <>
      <path d="M9 21V7a3 3 0 0 1 6 0v14" />
      <path d="M9 8h6" />
      <circle cx="12" cy="11.5" r="1.2" />
      <path d="M7.5 21h9" />
    </>
  ),
  mosque: (
    <>
      <path d="M7 21v-7a5 5 0 0 1 10 0v7" />
      <path d="M12 9V7" />
      <path d="M4.5 21V12M19.5 21V12" />
      <path d="M3.5 21h17" />
    </>
  ),
  arch: (
    <>
      <path d="M5 21V9a7 7 0 0 1 14 0v12" />
      <path d="M9 21v-8a3 3 0 0 1 6 0v8" />
      <path d="M4 21h16" />
    </>
  ),
  monument: (
    <>
      <path d="M10 21 11 5 12 2 13 5 14 21" />
      <path d="M8.5 21h7" />
    </>
  ),
  mountains: (
    <>
      <path d="M2 20 9 8l4 6 3-4 6 10z" />
      <path d="M2 20h20" />
    </>
  ),
  // Parthenon-style temple (e.g. Athens)
  temple: (
    <>
      <path d="M3 9 12 4l9 5" />
      <path d="M4.5 9h15" />
      <path d="M6 9v9M9 9v9M12 9v9M15 9v9M18 9v9" />
      <path d="M5.5 18h13" />
      <path d="M4.5 21h15" />
    </>
  ),
  // Palm — coastal/Riviera destinations (e.g. Cannes, El Alamein)
  palm: (
    <>
      <path d="M11 21c.3-6 .3-8 0-10" />
      <path d="M11 11C8 9 5 9 3 11" />
      <path d="M11 11c3-2 6-2 8 0" />
      <path d="M11 11C9 8 7 6 4 6" />
      <path d="M11 11c2-3 4-5 7-5" />
      <path d="M11 11c-1-2-1-4 0-6" />
      <path d="M8.5 21h5" />
    </>
  ),
  // ── Beach / seaside destinations ──
  // Beach umbrella planted in the sand
  "beach-umbrella": (
    <>
      <path d="M12 4v17" />
      <path d="M4 11a8 6 0 0 1 16 0z" />
      <path d="M12 4c2.5 0 4 3 4 7" />
      <path d="M12 4c-2.5 0-4 3-4 7" />
      <path d="M9 21h6" />
    </>
  ),
  // Sailboat on the water
  sailboat: (
    <>
      <path d="M12 3v11" />
      <path d="M12 5l5 9h-5z" />
      <path d="M5 16h14l-2.5 4h-9z" />
      <path d="M3 21q2.5-2 5 0t5 0 5 0" />
    </>
  ),
  // Sun setting over the sea
  "sea-sun": (
    <>
      <circle cx="12" cy="9" r="4" />
      <path d="M2 15q2.5-2 5 0t5 0 5 0 5 0" />
      <path d="M2 19q2.5-2 5 0t5 0 5 0 5 0" />
    </>
  ),
};

/** Default landmark for a city code, used when no explicit key is assigned. */
const CODE_DEFAULTS: Record<string, string> = {
  LON: "big-ben",
  PAR: "eiffel-tower",
  DXB: "burj-khalifa",
  CAI: "pyramids",
  RUH: "kingdom-centre",
  NYC: "statue-of-liberty",
};

/** The curated presets an admin can pick from, in display order. */
export const LANDMARK_PRESETS: { key: string; name: { en: string; ar: string } }[] = [
  { key: "big-ben", name: { en: "Big Ben", ar: "بيغ بن" } },
  { key: "eiffel-tower", name: { en: "Eiffel Tower", ar: "برج إيفل" } },
  { key: "burj-khalifa", name: { en: "Burj Khalifa", ar: "برج خليفة" } },
  { key: "pyramids", name: { en: "Pyramids", ar: "الأهرامات" } },
  { key: "kingdom-centre", name: { en: "Kingdom Centre", ar: "برج المملكة" } },
  { key: "statue-of-liberty", name: { en: "Statue of Liberty", ar: "تمثال الحرية" } },
  { key: "skyscraper", name: { en: "Skyscraper", ar: "ناطحة سحاب" } },
  { key: "tower", name: { en: "Tower", ar: "برج" } },
  { key: "mosque", name: { en: "Mosque", ar: "مسجد" } },
  { key: "temple", name: { en: "Temple", ar: "معبد" } },
  { key: "arch", name: { en: "Arch", ar: "قوس" } },
  { key: "monument", name: { en: "Monument", ar: "نصب تذكاري" } },
  { key: "mountains", name: { en: "Mountains", ar: "جبال" } },
  { key: "palm", name: { en: "Palm / Coast", ar: "نخلة / ساحل" } },
  { key: "beach-umbrella", name: { en: "Beach umbrella", ar: "مظلة شاطئ" } },
  { key: "sailboat", name: { en: "Sailboat", ar: "قارب شراعي" } },
  { key: "sea-sun", name: { en: "Sea & sun", ar: "بحر وشمس" } },
];

/** The generic monument fallback, used when nothing else resolves. */
const MONUMENT: ReactNode = (
  <>
    <path d="M8 21V7l4-4 4 4v14" />
    <path d="M8 21h8" />
    <path d="M10.5 21v-5h3v5" />
  </>
);

/** Resolve the art for an explicit key → city-code default → generic monument. */
function resolveArt(landmarkKey?: string | null, code?: string | null): ReactNode {
  if (landmarkKey && ART[landmarkKey]) return ART[landmarkKey];
  const byCode = code ? CODE_DEFAULTS[code.toUpperCase()] : undefined;
  if (byCode && ART[byCode]) return ART[byCode];
  return MONUMENT;
}

export function CityLandmark({
  code,
  landmarkKey,
  size = 20,
  className,
}: {
  code?: string | null;
  /** Admin-assigned preset key; wins over the city-code default. */
  landmarkKey?: string | null;
  size?: number;
  className?: string;
}) {
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
      {resolveArt(landmarkKey, code)}
    </svg>
  );
}
