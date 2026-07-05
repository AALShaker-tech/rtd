import { z } from "zod";

export const carCategoryEnum = z.enum(["VVIP", "VIP", "ECONOMY"]);
export const serviceTypeEnum = z.enum([
  "CAR_ONLY",
  "MEET_ASSIST_ONLY",
  "FAST_TRACK_ONLY",
  "MEET_ASSIST_CAR",
  "MEET_ASSIST_FASTTRACK_CAR",
  "SKIP",
]);
export const stepTypeEnum = z.enum([
  "HOME_TO_RIYADH_AIRPORT",
  "DEPARTURE_ASSIST_RIYADH",
  "ARRIVAL_ASSIST_DESTINATION",
  "AIRPORT_TO_HOTEL",
  "CHAUFFEUR_DURING_STAY",
  "HOTEL_TO_AIRPORT",
  "DEPARTURE_ASSIST_RETURN",
  "ARRIVAL_ASSIST_RIYADH",
  "RIYADH_AIRPORT_TO_HOME",
]);
export const localeEnum = z.enum(["en", "ar"]);

export const journeyStepSchema = z.object({
  stepType: stepTypeEnum,
  serviceType: serviceTypeEnum,
  skipped: z.boolean().default(false),
  city: z.string().optional(),
  airport: z.string().optional(),
  terminal: z.string().optional(),
  loungeType: z.string().optional(),
  flightNumber: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  hotelName: z.string().optional(),
  hotelAddress: z.string().optional(),
  homeAddress: z.string().optional(),
  carCategory: carCategoryEnum.optional(),
  passengers: z.number().int().min(0).max(50).optional(),
  bags: z.number().int().min(0).max(99).optional(),
  days: z.number().int().min(0).max(60).optional(),
  dailyHours: z.number().int().min(0).max(24).optional(),
  dailyUsage: z.enum(["SEVEN_HOURS", "EIGHT_HOURS", "FULL_DAY"]).optional(),
  flightData: z.any().optional(),
  flightLookupStatus: z.enum(["MANUAL", "VERIFIED", "LOOKUP_FAILED"]).optional(),
  notes: z.string().max(1000).optional(),
});

export const customerDetailsSchema = z.object({
  fullName: z.string().min(3).max(120),
  phone: z.string().min(5).max(25),
  phoneCountry: z.string().min(2).max(2).default("SA"),
  // Email is optional now; accept a valid email or an empty string.
  email: z.string().email().or(z.literal("")).optional().default(""),
  language: localeEnum.default("en"),
  children: z.boolean().default(false),
  childSeat: z.boolean().default(false),
  contactMeInstead: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

export const tripInfoSchema = z.object({
  departureDate: z.string().min(1),
  returnDate: z.string().optional().default(""),
  passengers: z.number().int().min(1).max(50),
  bags: z.number().int().min(0).max(99),
  specialAssistance: z.boolean().default(false),
  assistanceNotes: z.string().max(1000).optional(),
  departureFlightCode: z.string().max(10).optional(),
  returnFlightCode: z.string().max(10).optional(),
  departureTime: z.string().optional(),
  returnTime: z.string().optional(),
  departureFlight: z.any().optional(),
  returnFlight: z.any().optional(),
  departureLookupStatus: z.enum(["static_matched", "manual", "not_found"]).optional(),
  returnLookupStatus: z.enum(["static_matched", "manual", "not_found"]).optional(),
});

export const createRequestSchema = z.object({
  selectedPackage: z.string().optional(),
  destination: z.string().optional(),
  steps: z.array(journeyStepSchema).min(1),
  customer: customerDetailsSchema,
  tripInfo: tripInfoSchema,
  phoneVerified: z.boolean().optional().default(false),
  emailVerified: z.boolean().optional().default(false),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

// ── Verification ──
export const sendCodeSchema = z.object({
  target: z.string().min(3),
  purpose: z.enum(["PHONE", "EMAIL"]),
  channel: z.enum(["SMS", "WHATSAPP", "EMAIL"]),
  phoneCountry: z.string().optional(),
});

export const verifyCodeSchema = z.object({
  target: z.string().min(3),
  purpose: z.enum(["PHONE", "EMAIL"]),
  code: z.string().min(4).max(8),
});

// ── Auth ──
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof loginSchema>;
