/**
 * Tiny inline glyphs drawn in the app's stroked style (currentColor, rounded
 * joins) so they inherit the surrounding text colour. Used where a compact icon
 * reads more clearly than a word — e.g. people (party size) and luggage (bags).
 */

export function PeopleIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.3a3 3 0 0 1 0 5.4" />
      <path d="M18 14.2c2.1.7 3.5 2.6 3.5 5" />
    </svg>
  );
}

export function LuggageIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="6" y="8" width="12" height="12" rx="2" />
      <path d="M9.5 8V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2" />
      <path d="M10 12v4M14 12v4" />
    </svg>
  );
}
