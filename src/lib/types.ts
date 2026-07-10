import type {
  CarCategory,
  Locale,
  PackageType,
  ServiceType,
  StepDef,
  StepType,
} from "./domain";
import type { NormalizedFlight, ResolvedFlight, FlightLookupStatusValue } from "./flight";

export type FlightLookupStatus = "MANUAL" | "VERIFIED" | "LOOKUP_FAILED";

/** One extra vehicle attached to a step (beyond the primary `carCategory`). */
export interface StepVehicleInput {
  carCategory: CarCategory;
  passengers?: number;
  bags?: number;
}

/** A single journey step as held in the client draft / submitted to the API. */
export interface JourneyStepInput {
  stepType: StepType;
  /** Resolved service definition (behavior + presentation). Attached when the
   * step is built from the catalog; the engine prefers it over the static def. */
  def?: StepDef;
  serviceType: ServiceType;
  skipped: boolean;

  city?: string; // city code
  airport?: string; // airport code
  terminal?: string;
  loungeType?: string;
  flightNumber?: string;

  date?: string; // yyyy-mm-dd
  time?: string; // HH:mm
  endDate?: string; // chauffeur end
  endTime?: string;

  pickupLocation?: string;
  dropoffLocation?: string;
  hotelName?: string;
  hotelAddress?: string;
  homeAddress?: string; // National Address or short location description

  carCategory?: CarCategory;
  passengers?: number;
  bags?: number;

  /**
   * Additional vehicles booked for this step, on top of the primary
   * `carCategory` above. Used when one vehicle can't carry the whole party:
   * the customer keeps their chosen vehicle and adds one or more others of any
   * category. Empty/undefined for the common single-vehicle case.
   */
  additionalVehicles?: StepVehicleInput[];

  // chauffeur
  days?: number;
  dailyHours?: number;
  dailyUsage?: string; // SEVEN_HOURS | EIGHT_HOURS | FULL_DAY

  // flight lookup
  flightData?: NormalizedFlight | null;
  flightLookupStatus?: FlightLookupStatus;

  notes?: string;
}

/** Customer contact details. */
export interface CustomerDetailsInput {
  fullName: string;
  phone: string;
  phoneCountry: string; // ISO code for the dial selector
  email: string; // optional — may be empty
  language: Locale;
  children: boolean;
  childSeat: boolean;
  contactMeInstead: boolean;
  notes?: string;
}

/** Trip-level information collected once at the start of the journey. */
export interface TripInfoInput {
  departureDate: string; // yyyy-mm-dd
  returnDate: string; // yyyy-mm-dd
  passengers: number;
  bags: number;
  specialAssistance: boolean;
  assistanceNotes?: string;

  // Flight details (resolved from the static schedule, or manual fallback)
  departureFlightCode?: string;
  returnFlightCode?: string;
  departureTime?: string; // manual fallback (origin local) when no match
  returnTime?: string; // manual fallback
  departureFlight?: ResolvedFlight | null;
  returnFlight?: ResolvedFlight | null;
  departureLookupStatus?: FlightLookupStatusValue;
  returnLookupStatus?: FlightLookupStatusValue;
}

/** The full journey draft built on the client. */
export interface JourneyDraft {
  selectedPackage?: PackageType;
  steps: JourneyStepInput[];
  customer: CustomerDetailsInput;
  tripInfo: TripInfoInput;
  phoneVerified: boolean;
  emailVerified: boolean;
}

export type Severity = "error" | "warning";

export interface ValidationIssue {
  field?: string;
  messageEn: string;
  messageAr: string;
  severity: Severity;
}

export interface StepValidationResult {
  stepType: StepType;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface JourneyValidationResult {
  steps: StepValidationResult[];
  /** Cross-step (timeline / chronology) issues. */
  timeline: ValidationIssue[];
  hasErrors: boolean;
  hasWarnings: boolean;
}
