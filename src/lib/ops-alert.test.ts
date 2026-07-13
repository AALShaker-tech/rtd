import { describe, it, expect } from "vitest";
import { buildNewRequestAlert, buildNewRequestEmailBody } from "@/lib/ops-alert";

const base = {
  referenceNumber: "RTD-2026-00042",
  customerName: "Ahmed Ali",
  phone: "+966512345678",
  estimatedTotal: 1350,
};

describe("buildNewRequestAlert", () => {
  it("includes the reference in the subject and body", () => {
    const { subject, body } = buildNewRequestAlert(base);
    expect(subject).toContain("RTD-2026-00042");
    expect(body).toContain("RTD-2026-00042");
  });

  it("includes customer name, phone and a formatted estimate", () => {
    const { body } = buildNewRequestAlert(base);
    expect(body).toContain("Ahmed Ali");
    expect(body).toContain("+966512345678");
    expect(body).toContain("SAR 1,350");
  });

  it("adds the destination when provided", () => {
    expect(buildNewRequestAlert({ ...base, destination: "LON" }).body).toContain("LON");
  });

  it("builds an admin deep link from appUrl (trailing slash trimmed)", () => {
    const { body } = buildNewRequestAlert({ ...base, appUrl: "https://rtd.example.com/" });
    expect(body).toContain("https://rtd.example.com/admin/requests/RTD-2026-00042");
  });

  it("omits the link when no appUrl is given", () => {
    expect(buildNewRequestAlert(base).body).not.toContain("/admin/requests/");
  });

  it("flags contact-me-instead requests", () => {
    expect(buildNewRequestAlert({ ...base, contactMeInstead: true }).body).toContain(
      "asked to be contacted",
    );
  });
});

describe("buildNewRequestEmailBody", () => {
  const full = {
    ...base,
    email: "ahmed@example.com",
    destination: "CAI",
    departureDate: "2026-08-01",
    returnDate: "2026-08-10",
    passengers: 3,
    bags: 4,
    specialAssistance: true,
    assistanceNotes: "wheelchair",
    departureFlight: "SV021",
    notes: "VIP client",
    estimatedTotal: 1350,
    currency: "SAR",
    appUrl: "https://rtd.example.com",
    services: [
      { name: "Chauffeur from Your Home", serviceType: "CAR_ONLY", vehicle: "VVIP", extraVehicles: ["VIP"], city: "RUH", date: "2026-08-01", time: "08:00", home: "King Fahd Rd", price: 500 },
      { name: "Departure Send-Off — Riyadh", serviceType: "MEET_ASSIST_ONLY", airport: "RUH", terminal: "T2", lounge: "Executive Office", price: 320 },
    ],
  };

  it("includes full customer, trip and contact details", () => {
    const body = buildNewRequestEmailBody(full);
    expect(body).toContain("ahmed@example.com");
    expect(body).toContain("3 passenger(s)");
    expect(body).toContain("4 bag(s)");
    expect(body).toContain("wheelchair");
    expect(body).toContain("flight SV021");
    expect(body).toContain("VIP client");
  });

  it("lists every booked service with its details and price", () => {
    const body = buildNewRequestEmailBody(full);
    expect(body).toContain("Chauffeur from Your Home");
    expect(body).toContain("vehicle: VVIP + VIP");
    expect(body).toContain("lounge: Executive Office");
    expect(body).toContain("SAR 500");
    expect(body).toContain("SAR 320");
    expect(body).toContain("Estimated total: SAR 1,350");
  });

  it("still builds a body for a package request with no services", () => {
    const body = buildNewRequestEmailBody({ ...base, selectedPackage: "Golden Package", estimatedTotal: 5000 });
    expect(body).toContain("Golden Package");
    expect(body).toContain("Estimated total: SAR 5,000");
  });
});
