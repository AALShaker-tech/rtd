import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PricingProvider } from "@/components/pricing/PricingProvider";
import { CatalogProvider } from "@/components/catalog/CatalogProvider";
import { getPublicConfig } from "@/server/services/settings.service";
import { getPricingConfig } from "@/server/services/pricing.service";
import { getCityCatalog } from "@/server/services/city.service";
import { DEFAULT_PRICING_CONFIG } from "@/lib/pricing";
import { FALLBACK_CATALOG } from "@/lib/catalog";

// Always render against live admin data. Without this the segment can be
// statically cached, so admin price / availability changes would never reach
// the customer. The catalog and pricing config are fetched here (server-side)
// and handed to the providers as their source of truth — the client no longer
// silently falls back to built-in defaults when a fetch fails.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [{ whatsappNumber, whatsappDisplay }, catalog, pricingConfig] = await Promise.all([
    getPublicConfig(),
    getCityCatalog().catch(() => FALLBACK_CATALOG),
    getPricingConfig().catch(() => DEFAULT_PRICING_CONFIG),
  ]);
  return (
    <CatalogProvider initialCatalog={catalog}>
      <PricingProvider initialConfig={pricingConfig}>
        <div className="flex min-h-screen flex-col bg-ivory text-charcoal">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter whatsappNumber={whatsappNumber} whatsappDisplay={whatsappDisplay} />
        </div>
      </PricingProvider>
    </CatalogProvider>
  );
}
