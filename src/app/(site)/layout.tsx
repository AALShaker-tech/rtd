import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PricingProvider } from "@/components/pricing/PricingProvider";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <PricingProvider>
      <div className="ink-shell flex min-h-screen flex-col">
        <SiteHeader />
        <main className="relative z-[1] flex-1">{children}</main>
        <SiteFooter />
      </div>
    </PricingProvider>
  );
}
