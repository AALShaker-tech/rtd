/**
 * Pure builder for the "new request" operations alert. Kept dependency-free so
 * it's unit-testable; the delivery side (channels/providers) lives in
 * notify.service.
 */

export interface NewRequestAlertInput {
  referenceNumber: string;
  customerName: string;
  phone: string;
  destination?: string | null;
  estimatedTotal: number;
  currency?: string;
  /** Base app URL, e.g. https://rtd-production.up.railway.app — for a deep link. */
  appUrl?: string | null;
  contactMeInstead?: boolean;
}

export interface OpsAlertMessage {
  subject: string;
  body: string;
}

/** Build a concise, channel-agnostic alert for a newly submitted request. */
export function buildNewRequestAlert(i: NewRequestAlertInput): OpsAlertMessage {
  const subject = `New RTD request ${i.referenceNumber}`;
  const lines = [
    `New request received: ${i.referenceNumber}`,
    `Customer: ${i.customerName} (${i.phone})`,
  ];
  if (i.destination) lines.push(`Destination: ${i.destination}`);
  lines.push(`Estimated: ${i.currency ?? "SAR"} ${i.estimatedTotal.toLocaleString("en-US")}`);
  if (i.contactMeInstead) lines.push("Note: customer asked to be contacted (details to follow).");
  if (i.appUrl) {
    lines.push(`Open: ${i.appUrl.replace(/\/+$/, "")}/admin/requests/${i.referenceNumber}`);
  }
  return { subject, body: lines.join("\n") };
}

// ─────────────── Full email body (detailed, email-only) ───────────────

/** One booked service in the request, already resolved to display values. */
export interface NewRequestServiceLine {
  name: string;
  serviceType?: string | null;
  city?: string | null;
  airport?: string | null;
  terminal?: string | null;
  lounge?: string | null;
  vehicle?: string | null;
  extraVehicles?: string[];
  date?: string | null;
  time?: string | null;
  pickup?: string | null;
  dropoff?: string | null;
  hotel?: string | null;
  home?: string | null;
  days?: number | null;
  dailyUsage?: string | null;
  price?: number | null;
}

export interface NewRequestEmailInput {
  referenceNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  language?: string | null;
  contactMeInstead?: boolean;
  destination?: string | null;
  selectedPackage?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  passengers?: number | null;
  bags?: number | null;
  children?: boolean;
  childSeat?: boolean;
  specialAssistance?: boolean;
  assistanceNotes?: string | null;
  departureFlight?: string | null;
  returnFlight?: string | null;
  notes?: string | null;
  services?: NewRequestServiceLine[];
  estimatedTotal: number;
  currency?: string;
  appUrl?: string | null;
}

function money(amount: number | null | undefined, currency: string): string {
  return `${currency} ${(amount ?? 0).toLocaleString("en-US")}`;
}

/**
 * Build the full, human-readable email body for a new request. Unlike the SMS
 * alert (kept short), this lists every booked service with its details and the
 * complete trip / customer information, so ops has everything without opening
 * the dashboard.
 */
export function buildNewRequestEmailBody(i: NewRequestEmailInput): string {
  const cur = i.currency ?? "SAR";
  const out: string[] = [];
  const section = (title: string) => out.push("", title, "─".repeat(title.length));

  out.push(`New request received: ${i.referenceNumber}`);

  section("Customer");
  out.push(`Name: ${i.customerName}`);
  out.push(`Phone: ${i.phone}`);
  if (i.email) out.push(`Email: ${i.email}`);
  if (i.language) out.push(`Preferred language: ${i.language}`);
  if (i.contactMeInstead) out.push("Customer asked to be contacted — full details to follow.");

  section("Trip");
  if (i.selectedPackage) out.push(`Package: ${i.selectedPackage}`);
  if (i.destination) out.push(`Destination: ${i.destination}`);
  if (i.departureDate) out.push(`Departure: ${i.departureDate}${i.departureFlight ? ` (flight ${i.departureFlight})` : ""}`);
  if (i.returnDate) out.push(`Return: ${i.returnDate}${i.returnFlight ? ` (flight ${i.returnFlight})` : ""}`);
  const party: string[] = [];
  if (i.passengers != null) party.push(`${i.passengers} passenger(s)`);
  if (i.bags != null) party.push(`${i.bags} bag(s)`);
  if (i.children) party.push("children");
  if (i.childSeat) party.push("child seat");
  if (party.length) out.push(`Party: ${party.join(", ")}`);
  if (i.specialAssistance) out.push(`Special assistance: yes${i.assistanceNotes ? ` — ${i.assistanceNotes}` : ""}`);
  if (i.notes) out.push(`Customer notes: ${i.notes}`);

  const services = i.services ?? [];
  if (services.length) {
    section("Services");
    services.forEach((s, idx) => {
      out.push(`${idx + 1}. ${s.name}${s.price != null ? ` — ${money(s.price, cur)}` : ""}`);
      const detail: string[] = [];
      if (s.serviceType) detail.push(`type: ${s.serviceType}`);
      if (s.vehicle) detail.push(`vehicle: ${s.vehicle}${s.extraVehicles?.length ? ` + ${s.extraVehicles.join(" + ")}` : ""}`);
      if (s.lounge) detail.push(`lounge: ${s.lounge}`);
      if (s.airport) detail.push(`airport: ${s.airport}${s.terminal ? ` (${s.terminal})` : ""}`);
      else if (s.city) detail.push(`city: ${s.city}`);
      if (s.date || s.time) detail.push(`when: ${[s.date, s.time].filter(Boolean).join(" ")}`);
      if (s.days) detail.push(`${s.days} day(s)${s.dailyUsage ? ` · ${s.dailyUsage}` : ""}`);
      if (s.pickup) detail.push(`pickup: ${s.pickup}`);
      if (s.dropoff) detail.push(`drop-off: ${s.dropoff}`);
      if (s.hotel) detail.push(`hotel: ${s.hotel}`);
      if (s.home) detail.push(`home: ${s.home}`);
      if (detail.length) out.push(`   ${detail.join(" · ")}`);
    });
  }

  section("Total");
  out.push(`Estimated total: ${money(i.estimatedTotal, cur)}`);

  if (i.appUrl) {
    out.push("");
    out.push(`Open in dashboard: ${i.appUrl.replace(/\/+$/, "")}/admin/requests/${i.referenceNumber}`);
  }
  return out.join("\n");
}
