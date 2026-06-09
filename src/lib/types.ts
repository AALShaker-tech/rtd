import type {
  CarCategory,
  Locale,
  PackageType,
  ServiceType,
  StepType,
} from "./domain";
import type { NormalizedFlight } from "./flight";

export type FlightLookupStatus = "MANUAL" | "VERIFIED" | "LOOKUP_FAILED";

/** A single journey step as held in the client draft / submitted to the API. */
export interface JourneyStepInput {
  stepType: StepType;
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
  homeAddress?: string;

  carCategory?: CarCategory;
  passengers?: number;
  bags?: number;

  // chauffeur
  days?: number;
  dailyHours?: number;

  // flight lookup
  flightData?: NormalizedFlight | null;
  flightLookupStatus?: FlightLookupStatus;

  notes?: string;
}

/** Customer contact + traveller details. */
export interface CustomerDetailsInput {
  fullName: string;
  phone: string;
  phoneCountry: string; // ISO code for the dial selector
  email: string;
  language: Locale;
  children: boolean;
  childSeat: boolean;
  contactMeInstead: boolean;
  notes?: string;
}

/** The full journey draft built on the client. */
export interface JourneyDraft {
  selectedPackage?: PackageType;
  steps: JourneyStepInput[];
  customer: CustomerDetailsInput;
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
