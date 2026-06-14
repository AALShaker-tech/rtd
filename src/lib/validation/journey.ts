/**
 * The RTD journey validation engine.
 *
 * Produces bilingual, human errors and warnings:
 *  - Step-level checks (required fields, capacity, formats)
 *  - Cross-step timeline checks (chronological order across the whole journey)
 *
 * Errors block confirmation; warnings are soft reminders that do not.
 */

import {
  getStep,
  getVehicle,
  isLoungeValidForCity,
  serviceHasCar,
  type CarCategory,
  type StepType,
} from "@/lib/domain";
import { combineDateTime } from "@/lib/utils";
import { isValidEmail, isValidFlightNumber, parsePhone } from "@/lib/phone";
import type {
  CustomerDetailsInput,
  JourneyDraft,
  JourneyStepInput,
  JourneyValidationResult,
  StepValidationResult,
  TripInfoInput,
  ValidationIssue,
} from "@/lib/types";

const MAX_REASONABLE_BAGS_PER_PERSON = 3;

function issue(
  severity: "error" | "warning",
  en: string,
  ar: string,
  field?: string,
): ValidationIssue {
  return { severity, messageEn: en, messageAr: ar, field };
}

// ─────────────────────────── Vehicle capacity ───────────────────────────

export function validateVehicleCapacity(
  category: CarCategory | undefined,
  passengers: number | undefined,
): ValidationIssue | null {
  if (!category || passengers == null) return null;
  const vehicle = getVehicle(category);
  if (passengers <= vehicle.maxPassengers) return null;

  if (category === "VVIP") {
    return issue(
      "error",
      "VVIP supports up to 3 passengers. Please select VIP or add another vehicle.",
      "فئة VVIP تدعم حتى ٣ ركاب فقط. الرجاء اختيار VIP أو إضافة مركبة أخرى.",
      "passengers",
    );
  }
  if (category === "ECONOMY") {
    return issue(
      "error",
      "Economy supports up to 4 passengers. Please select VIP.",
      "الفئة الاقتصادية تدعم حتى ٤ ركاب فقط. الرجاء اختيار VIP.",
      "passengers",
    );
  }
  // VIP
  return issue(
    "error",
    "VIP supports up to 6 passengers. Please add another vehicle or combine VVIP/VIP.",
    "فئة VIP تدعم حتى ٦ ركاب فقط. الرجاء إضافة مركبة أخرى أو الجمع بين VVIP/VIP.",
    "passengers",
  );
}

// ─────────────────────────── Step-level validation ───────────────────────────

export function validateStep(step: JourneyStepInput, now: Date = new Date()): StepValidationResult {
  const def = getStep(step.stepType);
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (step.skipped || step.serviceType === "SKIP") {
    return { stepType: step.stepType, errors, warnings };
  }

  const f = def.features;
  const hasCar = serviceHasCar(step.serviceType);

  // Date / time
  const when = combineDateTime(step.date, step.time);
  if (f.chauffeur) {
    // End date is auto-calculated (start + days); the customer no longer enters it.
    if (!step.date) errors.push(req("start date", "تاريخ البداية", "date"));
    const start = combineDateTime(step.date, null);
    if (start && start < startOfDay(now)) errors.push(pastDate());
    if (!step.days || step.days < 1) errors.push(req("number of days", "عدد الأيام", "days"));
    if (!step.dailyUsage)
      errors.push(req("daily usage", "نوع الاستخدام اليومي", "dailyUsage"));
    if (!step.city) errors.push(req("city", "المدينة", "city"));
  } else {
    if (!step.date) errors.push(req("date", "التاريخ", "date"));
    if (!step.time) errors.push(req("time", "الوقت", "time"));
    if (when && when < now) errors.push(pastDate());
  }

  // Flight
  if (f.flight) {
    if (step.flightNumber && !isValidFlightNumber(step.flightNumber)) {
      errors.push(
        issue(
          "error",
          "Please enter a valid flight number (e.g. SV021).",
          "الرجاء إدخال رقم رحلة صحيح (مثال: SV021).",
          "flightNumber",
        ),
      );
    } else if (!step.flightNumber) {
      warnings.push(
        issue(
          "warning",
          "Flight number helps us time your service precisely.",
          "رقم الرحلة يساعدنا على ضبط توقيت خدمتك بدقة.",
          "flightNumber",
        ),
      );
    }
  }

  // Assistance
  if (f.assistance && step.serviceType !== "CAR_ONLY" && !step.loungeType) {
    warnings.push(
      issue(
        "warning",
        "Select a lounge or assistance type so we can prepare the right service.",
        "اختر نوع الصالة أو المساعدة حتى نهيّئ الخدمة المناسبة.",
        "loungeType",
      ),
    );
  }
  // Lounge option must match the airport's country (Saudi vs international).
  if (f.assistance && step.loungeType && !isLoungeValidForCity(step.loungeType, step.city)) {
    errors.push(
      issue(
        "error",
        "This assistance option isn't available at the selected airport. Please choose a valid option.",
        "خيار المساعدة هذا غير متاح في المطار المحدد. الرجاء اختيار خيار صحيح.",
        "loungeType",
      ),
    );
  }

  // Transfer specifics
  if (f.transfer && hasCar) {
    if (!step.carCategory) errors.push(req("car category", "فئة السيارة", "carCategory"));
    if (step.passengers == null || step.passengers < 1)
      errors.push(req("passengers", "عدد الركاب", "passengers"));

    const cap = validateVehicleCapacity(step.carCategory, step.passengers);
    if (cap) errors.push(cap);

    if (step.passengers && step.bags != null) {
      const maxBags = step.passengers * MAX_REASONABLE_BAGS_PER_PERSON;
      if (step.bags > maxBags) {
        warnings.push(
          issue(
            "warning",
            "That's a lot of luggage — we may arrange extra space. Please confirm with our team.",
            "هذا عدد كبير من الحقائب — قد نرتّب مساحة إضافية. الرجاء التأكيد مع فريقنا.",
            "bags",
          ),
        );
      }
    }
  }

  // Location requirements
  if (f.home && hasCar && !step.homeAddress) {
    warnings.push(
      issue("warning", "Add your home address for an accurate pick-up.", "أضف عنوان منزلك لضمان دقة الاستلام.", "homeAddress"),
    );
  }
  if (f.hotel && hasCar && !step.hotelName) {
    warnings.push(
      issue("warning", "Add your hotel so we can plan the transfer.", "أضف اسم فندقك لنتمكن من تخطيط التوصيل.", "hotelName"),
    );
  }
  if (f.transfer && hasCar && def.cityScope === "DESTINATION" && !step.airport) {
    warnings.push(issue("warning", "Select the airport for this transfer.", "اختر المطار لهذا التوصيل.", "airport"));
  }

  return { stepType: step.stepType, errors, warnings };
}

// ─────────────────────────── Customer validation ───────────────────────────

export function validateCustomer(c: CustomerDetailsInput): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  if (!c.fullName || c.fullName.trim().length < 3) {
    errors.push(req("full name", "الاسم الكامل", "fullName"));
  }
  const phone = parsePhone(c.phone || "", c.phoneCountry || "SA");
  if (!phone.valid) {
    errors.push(
      issue("error", "Please enter a valid mobile number.", "الرجاء إدخال رقم جوال صحيح.", "phone"),
    );
  }
  // Email is optional — only validate the format if one was entered.
  if (c.email && c.email.trim() && !isValidEmail(c.email)) {
    errors.push(
      issue("error", "Please enter a valid email address.", "الرجاء إدخال بريد إلكتروني صحيح.", "email"),
    );
  }
  return errors;
}

// ─────────────────────────── Trip information ───────────────────────────

export function validateTripInfo(trip: TripInfoInput): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  if (!trip.departureDate) {
    errors.push(req("departure date", "تاريخ المغادرة", "departureDate"));
  }
  if (trip.returnDate && trip.departureDate && trip.returnDate < trip.departureDate) {
    errors.push(
      issue(
        "error",
        "Return date cannot be before the departure date.",
        "تاريخ العودة لا يمكن أن يكون قبل تاريخ المغادرة.",
        "returnDate",
      ),
    );
  }
  if (trip.passengers == null || trip.passengers < 1) {
    errors.push(
      issue("error", "At least one passenger is required.", "يجب إدخال راكب واحد على الأقل.", "passengers"),
    );
  }
  if (trip.bags != null && trip.bags < 0) {
    errors.push(issue("error", "Bag count cannot be negative.", "عدد الحقائب لا يمكن أن يكون سالبًا.", "bags"));
  }
  if (trip.specialAssistance && !(trip.assistanceNotes && trip.assistanceNotes.trim())) {
    errors.push(
      issue(
        "warning",
        "Please describe the assistance needed so we can prepare.",
        "يرجى توضيح نوع المساعدة المطلوبة حتى نتمكن من التحضير.",
        "assistanceNotes",
      ),
    );
  }
  return errors;
}

// ─────────────────────────── Timeline (cross-step) ───────────────────────────

/** Anchor a step to a comparable timestamp. */
function stepTime(step: JourneyStepInput): Date | null {
  return combineDateTime(step.date, step.time);
}

function findStep(steps: JourneyStepInput[], type: StepType): JourneyStepInput | undefined {
  return steps.find((s) => s.stepType === type && !s.skipped && s.serviceType !== "SKIP");
}

export function validateTimeline(steps: JourneyStepInput[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const active = steps.filter((s) => !s.skipped && s.serviceType !== "SKIP");

  // 1) Active steps must be in non-decreasing chronological order.
  const ordered = [...active].sort((a, b) => getStep(a.stepType).order - getStep(b.stepType).order);
  let prev: { step: JourneyStepInput; t: Date } | null = null;
  for (const s of ordered) {
    const t = stepTime(s);
    if (!t) continue;
    if (prev && t < prev.t) {
      issues.push(
        issue(
          "error",
          "The order of your services doesn't line up in time. Please review the dates and times.",
          "ترتيب خدماتك غير متسق زمنيًا. الرجاء مراجعة التواريخ والأوقات.",
        ),
      );
      break;
    }
    if (t) prev = { step: s, t };
  }

  const arrivalDest = findStep(steps, "ARRIVAL_ASSIST_DESTINATION");
  const airportToHotel = findStep(steps, "AIRPORT_TO_HOTEL");
  const hotelToAirport = findStep(steps, "HOTEL_TO_AIRPORT");
  const departureReturn = findStep(steps, "DEPARTURE_ASSIST_RETURN");
  const arrivalRiyadh = findStep(steps, "ARRIVAL_ASSIST_RIYADH");
  const departureRiyadh = findStep(steps, "DEPARTURE_ASSIST_RIYADH");
  const chauffeur = findStep(steps, "CHAUFFEUR_DURING_STAY");

  // 2) Airport→Hotel must not precede destination arrival.
  if (arrivalDest && airportToHotel) {
    const a = stepTime(arrivalDest);
    const h = stepTime(airportToHotel);
    if (a && h && h < a) {
      issues.push(
        issue(
          "error",
          "This transfer is scheduled before your flight arrival. Please check the time.",
          "تم اختيار موعد التوصيل قبل وقت وصول الرحلة. الرجاء مراجعة الوقت.",
        ),
      );
    }
  }

  // 3) Hotel→Airport must be before the return departure (with smart buffer suggestion).
  if (hotelToAirport && departureReturn) {
    const h = stepTime(hotelToAirport);
    const d = stepTime(departureReturn);
    if (h && d && h > d) {
      issues.push(
        issue(
          "error",
          "Your hotel-to-airport transfer is after your departure assistance. Please move it earlier.",
          "موعد التوصيل من الفندق إلى المطار بعد موعد خدمة المغادرة. الرجاء تقديمه.",
        ),
      );
    } else if (h && d) {
      const bufferHours = (d.getTime() - h.getTime()) / 3.6e6;
      if (bufferHours < 3) {
        issues.push(
          issue(
            "warning",
            "We recommend leaving for the airport at least 3 hours before departure.",
            "ننصح بالتوجه إلى المطار قبل المغادرة بثلاث ساعات على الأقل.",
          ),
        );
      }
    }
  }

  // 4) Riyadh arrival cannot be before the return departure.
  if (arrivalRiyadh && departureReturn) {
    const ar = stepTime(arrivalRiyadh);
    const dep = stepTime(departureReturn);
    if (ar && dep && ar < dep) {
      issues.push(
        issue(
          "error",
          "Your arrival in Riyadh is before your return departure. Please check the dates.",
          "موعد وصولك إلى الرياض قبل موعد مغادرة العودة. الرجاء مراجعة التواريخ.",
        ),
      );
    }
  }

  // 5) Departure from Riyadh should be before destination arrival.
  if (departureRiyadh && arrivalDest) {
    const dep = stepTime(departureRiyadh);
    const arr = stepTime(arrivalDest);
    if (dep && arr && dep > arr) {
      issues.push(
        issue(
          "error",
          "Your Riyadh departure is after your destination arrival. Please review the timeline.",
          "موعد مغادرتك من الرياض بعد موعد وصولك إلى الوجهة. الرجاء مراجعة الجدول الزمني.",
        ),
      );
    }
  }

  // 6) Chauffeur should start at/after destination arrival.
  if (chauffeur && arrivalDest) {
    const c = stepTime(chauffeur);
    const a = stepTime(arrivalDest);
    if (c && a && c < startOfDay(a)) {
      issues.push(
        issue(
          "warning",
          "Your chauffeur service starts before you arrive in the destination city.",
          "تبدأ خدمة السائق الخاص قبل وصولك إلى مدينة الوجهة.",
        ),
      );
    }
  }

  return issues;
}

// ─────────────────────────── Whole journey ───────────────────────────

export function validateJourney(draft: JourneyDraft, now: Date = new Date()): JourneyValidationResult {
  const active = draft.steps.filter((s) => !s.skipped && s.serviceType !== "SKIP");
  const steps = active.map((s) => validateStep(s, now));
  const timeline = validateTimeline(draft.steps);

  // Fold trip-info and customer validation into the journey result so the server
  // (which calls validateJourney) enforces everything authoritatively.
  if (draft.tripInfo) timeline.push(...validateTripInfo(draft.tripInfo));
  if (draft.customer) timeline.push(...validateCustomer(draft.customer));

  // A journey with zero active steps is itself an error.
  if (active.length === 0) {
    timeline.push(
      issue(
        "error",
        "Please add at least one service to your journey.",
        "الرجاء إضافة خدمة واحدة على الأقل إلى رحلتك.",
      ),
    );
  }

  const hasErrors =
    steps.some((s) => s.errors.length > 0) || timeline.some((t) => t.severity === "error");
  const hasWarnings =
    steps.some((s) => s.warnings.length > 0) || timeline.some((t) => t.severity === "warning");

  return { steps, timeline, hasErrors, hasWarnings };
}

// ─────────────────────────── helpers ───────────────────────────

function req(fieldEn: string, fieldAr: string, field?: string): ValidationIssue {
  return issue("error", `Please provide the ${fieldEn}.`, `الرجاء إدخال ${fieldAr}.`, field);
}

function pastDate(): ValidationIssue {
  return issue(
    "error",
    "Date and time cannot be in the past.",
    "لا يمكن أن يكون التاريخ والوقت في الماضي.",
    "date",
  );
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
