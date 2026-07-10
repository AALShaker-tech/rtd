import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Cormorant_Garamond, Tajawal } from "next/font/google";
import { I18nProvider } from "@/i18n/I18nProvider";
import type { Locale } from "@/lib/domain";
import { isProduction } from "@/lib/app-env";
import { EnvBanner } from "@/components/EnvBanner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});
const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RTD — Luxury Airport Concierge",
  description:
    "RTD is a premium travel transportation and airport concierge company. From your doorstep to your final destination.",
  // Keep every non-production deployment (preparation, dev) out of search
  // engines so only the live site is ever indexed.
  robots: isProduction ? undefined : { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("rtd_locale")?.value as Locale) ?? "en";
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${cormorant.variable} ${tajawal.variable}`}>
      <body>
        <EnvBanner />
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
