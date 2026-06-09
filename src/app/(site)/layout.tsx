import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PricingProvider } from "@/components/pricing/PricingProvider";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <PricingProvider>
      <div className="flex min-h-screen flex-col bg-ivory text-charcoal">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </PricingProvider>
  );
}
