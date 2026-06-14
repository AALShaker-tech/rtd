import {
  getCity,
  getStep,
  getVehicle,
  SERVICE_TYPES,
  type Locale,
  type PackageType,
  getPackage,
} from "@/lib/domain";
import type { JourneyStepInput } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "966550832444";
export const WHATSAPP_DISPLAY = process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ?? "+966 55 083 2444";

export interface WhatsAppSummaryInput {
  referenceNumber: string;
  customerName: string;
  phone: string;
  selectedPackage?: PackageType | null;
  steps: JourneyStepInput[];
  carCategory?: string;
  passengers?: number;
  bags?: number;
  estimatedTotal?: number | null;
  specialAssistance?: boolean;
  assistanceNotes?: string | null;
  notes?: string | null;
  locale: Locale;
}

function serviceName(type: string, locale: Locale): string {
  return SERVICE_TYPES.find((s) => s.type === type)?.name[locale] ?? type;
}

/** Build a pre-filled, human-readable WhatsApp message body. */
export function buildWhatsAppMessage(input: WhatsAppSummaryInput): string {
  const { locale } = input;
  const L = locale === "ar";
  const lines: string[] = [];

  lines.push(L ? "مرحبًا فريق RTD 👋" : "Hello RTD team 👋");
  lines.push("");
  lines.push((L ? "رقم الطلب: " : "Reference: ") + input.referenceNumber);
  lines.push((L ? "الاسم: " : "Name: ") + input.customerName);
  lines.push((L ? "الجوال: " : "Phone: ") + input.phone);

  if (input.selectedPackage) {
    const pkg = getPackage(input.selectedPackage);
    if (pkg) lines.push((L ? "الباقة: " : "Package: ") + pkg.name[locale]);
  }
  if (input.carCategory) {
    lines.push((L ? "فئة السيارة: " : "Car: ") + getVehicle(input.carCategory as any).name[locale]);
  }
  if (input.passengers != null) lines.push((L ? "الركاب: " : "Passengers: ") + input.passengers);
  if (input.bags != null) lines.push((L ? "الحقائب: " : "Bags: ") + input.bags);

  lines.push("");
  lines.push(L ? "— تفاصيل الرحلة —" : "— Journey —");

  const active = input.steps.filter((s) => !s.skipped && s.serviceType !== "SKIP");
  active
    .sort((a, b) => getStep(a.stepType).order - getStep(b.stepType).order)
    .forEach((s, i) => {
      const def = getStep(s.stepType);
      const parts: string[] = [`${i + 1}. ${def.name[locale]}`];
      const city = s.city ? getCity(s.city)?.name[locale] : undefined;
      if (city) parts.push(`• ${L ? "المدينة" : "City"}: ${city}`);
      if (s.date) {
        const dt = formatDateTime(`${s.date}T${s.time ?? "00:00"}`, locale);
        parts.push(`• ${L ? "الموعد" : "When"}: ${dt}`);
      }
      if (s.flightNumber) parts.push(`• ${L ? "الرحلة" : "Flight"}: ${s.flightNumber}`);
      if (s.pickupLocation || s.homeAddress)
        parts.push(`• ${L ? "الاستلام" : "Pickup"}: ${s.pickupLocation || s.homeAddress}`);
      if (s.dropoffLocation || s.hotelName)
        parts.push(`• ${L ? "الوجهة" : "Drop-off"}: ${s.dropoffLocation || s.hotelName}`);
      parts.push(`• ${L ? "الخدمة" : "Service"}: ${serviceName(s.serviceType, locale)}`);
      lines.push(parts.join("\n   "));
    });

  if (input.estimatedTotal != null) {
    lines.push("");
    const amount = L
      ? `${input.estimatedTotal.toLocaleString("ar-SA")} ﷼`
      : `SAR ${input.estimatedTotal.toLocaleString("en-US")}`;
    lines.push((L ? "الإجمالي التقديري: " : "Estimated Total: ") + amount);
  }

  if (input.specialAssistance) {
    lines.push("");
    lines.push(
      (L ? "مساعدة خاصة: " : "Special assistance: ") +
        (input.assistanceNotes?.trim() || (L ? "نعم" : "Yes")),
    );
  }

  if (input.notes) {
    lines.push("");
    lines.push((L ? "ملاحظات: " : "Notes: ") + input.notes);
  }

  return lines.join("\n");
}

/** Build a wa.me deep link with the pre-filled message. */
export function buildWhatsAppLink(input: WhatsAppSummaryInput): string {
  const text = encodeURIComponent(buildWhatsAppMessage(input));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

/** Plain contact link with no message. */
export function whatsappContactLink(): string {
  return `https://wa.me/${WHATSAPP_NUMBER}`;
}
