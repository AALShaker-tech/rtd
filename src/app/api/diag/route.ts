import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCityCatalog } from "@/server/services/city.service";
import { getPricingConfig } from "@/server/services/pricing.service";
import { getStepCatalog } from "@/server/services/step.service";
import { getVehicleCatalog } from "@/server/services/vehicle.service";
import { toStepDef } from "@/lib/steps";
import { hasCityPricing, isStepOffered, pricedVehicleClasses } from "@/lib/availability";

/**
 * Read-only diagnostic for the customer journey flow: runs the exact same data
 * loaders the (site) layout uses — without the silent fallback — and reports, per
 * destination, which steps would be shown vs hidden and why. Structural only: no
 * price values, no customer data, no secrets. Lets us see from outside why the
 * builder shows "No services available". Safe to remove once resolved.
 */
export const dynamic = "force-dynamic";

const commit = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || "unknown";

async function run<T>(fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }
}

export async function GET() {
  const [catalogR, pricingR, stepsR, vehiclesR] = await Promise.all([
    run(getCityCatalog),
    run(getPricingConfig),
    run(getStepCatalog),
    run(getVehicleCatalog),
  ]);

  const out: Record<string, unknown> = {
    commit,
    loaders: {
      cityCatalog: catalogR.ok
        ? { ok: true, cityCount: catalogR.value.cities.length, codes: catalogR.value.cities.map((c) => c.code), origins: catalogR.value.cities.filter((c) => c.isOrigin).map((c) => c.code) }
        : { ok: false, error: catalogR.error },
      pricingConfig: pricingR.ok
        ? {
            ok: true,
            hasCityPricing: hasCityPricing(pricingR.value),
            classPriceCities: Object.keys(pricingR.value.cityServiceClassPrices ?? {}),
            servicePriceCities: Object.keys(pricingR.value.cityServicePrices ?? {}),
            loungeAirports: Object.keys(pricingR.value.airportLoungePrices ?? {}),
          }
        : { ok: false, error: pricingR.error },
      stepCatalog: stepsR.ok ? { ok: true, count: stepsR.value.length, codes: stepsR.value.map((s) => s.code) } : { ok: false, error: stepsR.error },
      vehicleCatalog: vehiclesR.ok ? { ok: true, count: vehiclesR.value.length } : { ok: false, error: vehiclesR.error },
    },
  };

  // Where does a "disabled" step come from? Split the two sources so the fix is
  // unambiguous: a globally-disabled service (Pricing tab → ServicePricing.active
  // = false) hides it everywhere; a per-city disable (CityServicePricing.enabled
  // = false) hides it only in that city.
  const disableSources = await run(async () => {
    const [globalRows, cityRows] = await Promise.all([
      prisma.servicePricing.findMany({ select: { stepType: true, active: true } }),
      prisma.cityServicePricing.findMany({ where: { enabled: false }, select: { cityCode: true, stepType: true } }),
    ]);
    const perCity: Record<string, string[]> = {};
    for (const r of cityRows) (perCity[r.cityCode] ??= []).push(r.stepType);
    return {
      globallyDisabledSteps: globalRows.filter((r) => !r.active).map((r) => r.stepType),
      globalServiceActive: Object.fromEntries(globalRows.map((r) => [r.stepType, r.active])),
      perCityDisabledSteps: perCity,
    };
  });
  out.disableSources = disableSources.ok ? disableSources.value : { error: disableSources.error };

  // Per-destination breakdown of what the builder would show.
  if (catalogR.ok && pricingR.ok && stepsR.ok) {
    const catalog = catalogR.value;
    const config = pricingR.value;
    const defs = stepsR.value.map(toStepDef);
    const priceKnown = hasCityPricing(config);
    const cityLoungePrices = (code: string) => (catalog.cities.find((c) => c.code === code)?.airports ?? []).flatMap((a) => a.lounges.map((l) => l.price));
    const disabled = (code: string) => new Set(catalog.cities.find((c) => c.code === code)?.disabledSteps ?? []);
    const disabledRUH = disabled("RUH");

    out.destinations = catalog.cities
      .filter((c) => !c.isOrigin)
      .map((city) => {
        const disabledDest = disabled(city.code);
        const rows = defs.map((def) => {
          const cityCode = def.cityScope === "RIYADH" ? "RUH" : city.code;
          const isDisabled = (def.cityScope === "RIYADH" ? disabledRUH : disabledDest).has(def.type);
          const offered = isDisabled ? false : priceKnown ? isStepOffered(def, cityCode, config, cityLoungePrices(cityCode)) : true;
          return {
            step: def.type,
            scope: def.cityScope,
            pricedFrom: cityCode,
            disabled: isDisabled,
            pricedClasses: pricedVehicleClasses(config, cityCode, def.type).length,
            loungePrices: cityLoungePrices(cityCode).filter((p) => p > 0).length,
            offered,
          };
        });
        return { code: city.code, offeredCount: rows.filter((r) => r.offered).length, steps: rows };
      });
  }

  return NextResponse.json(out, { status: 200 });
}
