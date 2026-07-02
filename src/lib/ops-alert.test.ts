import { describe, it, expect } from "vitest";
import { buildNewRequestAlert } from "@/lib/ops-alert";

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
