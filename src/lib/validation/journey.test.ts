import { describe, it, expect } from "vitest";
import {
  validateVehicleCapacity,
  validateStep,
  validateTimeline,
  validateJourney,
} from "@/lib/validation/journey";
import type { JourneyStepInput, JourneyDraft } from "@/lib/types";

// A fixed "now" keeps date/time assertions deterministic. All test dates below
// are in June 2026, i.e. in the future relative to this anchor.
const NOW = new Date("2026-06-01T00:00:00Z");

function step(overrides: Partial<JourneyStepInput>): JourneyStepInput {
  return {
    stepType: "HOME_TO_RIYADH_AIRPORT",
    serviceType: "CAR_ONLY",
    skipped: false,
    ...overrides,
  };
}

function hasError(errors: { field?: string }[], field: string): boolean {
  return errors.some((e) => e.field === field);
}

describe("validateVehicleCapacity", () => {
  it("returns null when passengers fit the category", () => {
    expect(validateVehicleCapacity("VVIP", 3)).toBeNull();
    expect(validateVehicleCapacity("VIP", 6)).toBeNull();
    expect(validateVehicleCapacity("ECONOMY", 4)).toBeNull();
  });

  it("errors when VVIP is over its 3-passenger limit", () => {
    const issue = validateVehicleCapacity("VVIP", 4);
    expect(issue?.severity).toBe("error");
    expect(issue?.field).toBe("passengers");
  });

  it("errors when VIP is over its 6-passenger limit", () => {
    expect(validateVehicleCapacity("VIP", 7)?.severity).toBe("error");
  });

  it("errors when ECONOMY is over its 4-passenger limit", () => {
    expect(validateVehicleCapacity("ECONOMY", 5)?.severity).toBe("error");
  });

  it("returns null when the category is missing", () => {
    expect(validateVehicleCapacity(undefined, 10)).toBeNull();
  });

  it("honors an admin-configured (DB) capacity override", () => {
    // Admin raised VIP capacity to 8 → 7 passengers now fits.
    expect(validateVehicleCapacity("VIP", 7, 8)).toBeNull();
    // Admin lowered VVIP capacity to 2 → 3 passengers now errors.
    const issue = validateVehicleCapacity("VVIP", 3, 2);
    expect(issue?.severity).toBe("error");
    expect(issue?.messageEn).toContain("2");
  });
});

describe("validateStep — required fields", () => {
  it("accepts a complete car transfer with no errors", () => {
    const r = validateStep(
      step({ date: "2026-06-10", time: "10:00", carCategory: "VIP", passengers: 2, homeAddress: "Riyadh" }),
      NOW,
    );
    expect(r.errors).toHaveLength(0);
  });

  it("errors on a date in the past", () => {
    const r = validateStep(
      step({ date: "2020-01-01", time: "10:00", carCategory: "VIP", passengers: 2 }),
      NOW,
    );
    expect(hasError(r.errors, "date")).toBe(true);
  });

  it("requires a time on a non-time-optional step", () => {
    const r = validateStep(
      step({ stepType: "DEPARTURE_ASSIST_RIYADH", serviceType: "MEET_ASSIST_ONLY", date: "2026-06-10" }),
      NOW,
    );
    expect(hasError(r.errors, "time")).toBe(true);
  });

  it("does NOT require a time on an arrival-driven (time-optional) step", () => {
    const r = validateStep(
      step({ stepType: "ARRIVAL_ASSIST_DESTINATION", serviceType: "MEET_ASSIST_ONLY", date: "2026-06-10", city: "LON", loungeType: "MEET_ASSIST" }),
      NOW,
    );
    expect(hasError(r.errors, "time")).toBe(false);
    expect(r.errors).toHaveLength(0);
  });
});

describe("validateStep — lounge / city rules", () => {
  it("errors when a Saudi lounge is chosen for an international airport", () => {
    const r = validateStep(
      step({ stepType: "ARRIVAL_ASSIST_DESTINATION", serviceType: "MEET_ASSIST_ONLY", date: "2026-06-10", city: "LON", loungeType: "EXECUTIVE_OFFICE" }),
      NOW,
    );
    expect(hasError(r.errors, "loungeType")).toBe(true);
  });

  it("accepts an international lounge for an international airport", () => {
    const r = validateStep(
      step({ stepType: "ARRIVAL_ASSIST_DESTINATION", serviceType: "MEET_ASSIST_ONLY", date: "2026-06-10", city: "LON", loungeType: "MEET_ASSIST" }),
      NOW,
    );
    expect(hasError(r.errors, "loungeType")).toBe(false);
  });
});

describe("validateStep — chauffeur", () => {
  it("accepts a complete chauffeur step", () => {
    const r = validateStep(
      step({ stepType: "CHAUFFEUR_DURING_STAY", serviceType: "CAR_ONLY", date: "2026-06-12", city: "LON", days: 3, dailyUsage: "FULL_DAY" }),
      NOW,
    );
    expect(r.errors).toHaveLength(0);
  });

  it("requires days, usage and city", () => {
    const r = validateStep(
      step({ stepType: "CHAUFFEUR_DURING_STAY", serviceType: "CAR_ONLY", date: "2026-06-12" }),
      NOW,
    );
    expect(hasError(r.errors, "days")).toBe(true);
    expect(hasError(r.errors, "dailyUsage")).toBe(true);
    expect(hasError(r.errors, "city")).toBe(true);
  });
});

describe("validateTimeline", () => {
  const errorMessages = (steps: JourneyStepInput[]) =>
    validateTimeline(steps).filter((i) => i.severity === "error").map((i) => i.messageEn);
  const allMessages = (steps: JourneyStepInput[]) => validateTimeline(steps).map((i) => i.messageEn);

  it("flags an airport→hotel transfer scheduled before flight arrival", () => {
    const steps: JourneyStepInput[] = [
      step({ stepType: "ARRIVAL_ASSIST_DESTINATION", serviceType: "MEET_ASSIST_ONLY", date: "2026-06-10", time: "10:00", city: "LON" }),
      step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", date: "2026-06-10", time: "09:00", carCategory: "VIP", passengers: 2 }),
    ];
    expect(errorMessages(steps).some((m) => m.includes("before your flight arrival"))).toBe(true);
  });

  it("flags a hotel→airport transfer that is after return departure assistance", () => {
    const steps: JourneyStepInput[] = [
      step({ stepType: "HOTEL_TO_AIRPORT", serviceType: "CAR_ONLY", date: "2026-06-15", time: "20:00", carCategory: "VIP", passengers: 2 }),
      step({ stepType: "DEPARTURE_ASSIST_RETURN", serviceType: "MEET_ASSIST_ONLY", date: "2026-06-15", time: "18:00", city: "LON" }),
    ];
    expect(errorMessages(steps).some((m) => m.includes("after your departure assistance"))).toBe(true);
  });

  it("warns when the airport buffer is under 3 hours", () => {
    const steps: JourneyStepInput[] = [
      step({ stepType: "HOTEL_TO_AIRPORT", serviceType: "CAR_ONLY", date: "2026-06-15", time: "16:00", carCategory: "VIP", passengers: 2 }),
      step({ stepType: "DEPARTURE_ASSIST_RETURN", serviceType: "MEET_ASSIST_ONLY", date: "2026-06-15", time: "17:00", city: "LON" }),
    ];
    expect(allMessages(steps).some((m) => m.includes("at least 3 hours"))).toBe(true);
  });

  it("flags Riyadh departure scheduled after destination arrival", () => {
    const steps: JourneyStepInput[] = [
      step({ stepType: "DEPARTURE_ASSIST_RIYADH", serviceType: "MEET_ASSIST_ONLY", date: "2026-06-11", time: "08:00" }),
      step({ stepType: "ARRIVAL_ASSIST_DESTINATION", serviceType: "MEET_ASSIST_ONLY", date: "2026-06-10", time: "10:00", city: "LON" }),
    ];
    expect(errorMessages(steps).some((m) => m.includes("after your destination arrival"))).toBe(true);
  });

  it("produces no timeline issues for a well-ordered journey", () => {
    const steps: JourneyStepInput[] = [
      step({ stepType: "ARRIVAL_ASSIST_DESTINATION", serviceType: "MEET_ASSIST_ONLY", date: "2026-06-10", time: "10:00", city: "LON" }),
      step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", date: "2026-06-10", time: "12:00", carCategory: "VIP", passengers: 2 }),
    ];
    expect(validateTimeline(steps)).toHaveLength(0);
  });
});

describe("validateJourney", () => {
  const customer = {
    fullName: "Ahmed Ali",
    phone: "0512345678",
    phoneCountry: "SA",
    email: "",
    language: "en" as const,
    children: false,
    childSeat: false,
    contactMeInstead: false,
  };
  const tripInfo = {
    departureDate: "2026-06-10",
    returnDate: "",
    passengers: 2,
    bags: 1,
    specialAssistance: false,
    departureTime: "10:00",
  };

  it("reports no errors for a minimal valid journey", () => {
    const draft: JourneyDraft = {
      steps: [
        step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", date: "2026-06-10", carCategory: "VIP", passengers: 2, city: "LON", airport: "LHR", hotelName: "The Savoy" }),
      ],
      customer,
      tripInfo,
      phoneVerified: false,
      emailVerified: false,
    };
    const result = validateJourney(draft, NOW);
    expect(result.hasErrors).toBe(false);
  });

  it("errors when every step is skipped (empty journey)", () => {
    const draft: JourneyDraft = {
      steps: [step({ skipped: true }), step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "SKIP" })],
      customer,
      tripInfo,
      phoneVerified: false,
      emailVerified: false,
    };
    const result = validateJourney(draft, NOW);
    expect(result.hasErrors).toBe(true);
    expect(result.timeline.some((i) => i.messageEn.includes("at least one service"))).toBe(true);
  });

  it("errors when the customer phone number is invalid", () => {
    const draft: JourneyDraft = {
      steps: [
        step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", date: "2026-06-10", carCategory: "VIP", passengers: 2, city: "LON", airport: "LHR", hotelName: "The Savoy" }),
      ],
      customer: { ...customer, phone: "123" },
      tripInfo,
      phoneVerified: false,
      emailVerified: false,
    };
    expect(validateJourney(draft, NOW).hasErrors).toBe(true);
  });
});
