// Which deployment environment this instance is running as.
//
// Driven by NEXT_PUBLIC_APP_ENV so it is known both on the server and in the
// browser (that is why the name is prefixed NEXT_PUBLIC_). Set it per Railway
// environment:
//   production   → "production"   (or leave unset — production is the default)
//   preparation  → "preparation"
//   local dev    → "development"
//
// Anything that is not production is treated as a non-production environment:
// it shows the preparation banner and is blocked from search engines.

export type AppEnv = "production" | "preparation" | "development";

function resolveAppEnv(): AppEnv {
  const raw = (process.env.NEXT_PUBLIC_APP_ENV || "").trim().toLowerCase();
  if (raw === "preparation" || raw === "staging" || raw === "prep") return "preparation";
  if (raw === "development" || raw === "dev" || raw === "local") return "development";
  if (raw === "production" || raw === "prod") return "production";
  // Fall back to NODE_ENV so an unset value still behaves sensibly.
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export const appEnv: AppEnv = resolveAppEnv();

export const isProduction = appEnv === "production";
export const isPreparation = appEnv === "preparation";

/** Human-readable label for banners and diagnostics. */
export const envLabel: string =
  appEnv === "preparation"
    ? "Preparation"
    : appEnv === "development"
      ? "Development"
      : "Production";
