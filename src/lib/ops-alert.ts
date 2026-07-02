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
