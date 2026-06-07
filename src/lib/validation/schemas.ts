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
export const packageEnum = z.enum([
  "ARRIVAL",
  "DEPARTURE",
  "FULL_JOURNEY",
  "VVIP_CONCIERGE",
  "LONDON_CHAUFFEUR",
  "AIRPORT_TO_HOTEL",
  "HOTEL_TO_AIRPORT",
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
  notes: z.string().max(1000).optional(),
});

export const customerDetailsSchema = z.object({
  fullName: z.string().min(3).max(120),
  phone: z.string().min(5).max(25),
  phoneCountry: z.string().min(2).max(2).default("SA"),
  email: z.string().email(),
  language: localeEnum.default("en"),
  children: z.boolean().default(false),
  childSeat: z.boolean().default(false),
  contactMeInstead: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

export const createRequestSchema = z.object({
  selectedPackage: packageEnum.optional(),
  steps: z.array(journeyStepSchema).min(1),
  customer: customerDetailsSchema,
  phoneVerified: z.boolean().default(false),
  emailVerified: z.boolean().default(false),
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
