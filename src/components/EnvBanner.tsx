import { appEnv, isProduction, envLabel } from "@/lib/app-env";

// A slim ribbon shown on every non-production deployment (preparation, dev) so
// it is impossible to confuse the preparation site with the live production
// site. Renders nothing in production. Kept in normal document flow (not fixed)
// so it never overlaps sticky headers — on production the layout is unchanged.
export function EnvBanner() {
  if (isProduction) return null;

  const isPrep = appEnv === "preparation";
  const background = isPrep ? "#b45309" : "#334155"; // amber for prep, slate for dev

  return (
    <div
      role="status"
      aria-label={`${envLabel} environment`}
      style={{
        background,
        color: "#fff",
        textAlign: "center",
        fontSize: "12px",
        lineHeight: "1.4",
        letterSpacing: "0.08em",
        padding: "5px 12px",
        fontWeight: 600,
        textTransform: "uppercase",
      }}
    >
      {envLabel} environment — not the live site
    </div>
  );
}
