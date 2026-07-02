import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PricingProvider } from "@/components/pricing/PricingProvider";
import { CatalogProvider } from "@/components/catalog/CatalogProvider";
import { getPublicConfig } from "@/server/services/settings.service";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { whatsappNumber, whatsappDisplay } = await getPublicConfig();
  return (
    <CatalogProvider>
      <PricingProvider>
        <div className="flex min-h-screen flex-col bg-ivory text-charcoal">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter whatsappNumber={whatsappNumber} whatsappDisplay={whatsappDisplay} />
        </div>
      </PricingProvider>
    </CatalogProvider>
  );
}
