/**
 * RTD domain constants — the single source of truth for cities, airports,
 * vehicle categories, services, packages and journey steps. Shared by the
 * customer UI, validation engine, and the database seed.
 */

export type Locale = "en" | "ar";

export type Bilingual = { en: string; ar: string };

// ─────────────────────────── Cities & Airports ───────────────────────────

export interface CityDef {
  code: string;
  name: Bilingual;
  country: string;
  isOrigin?: boolean; // Riyadh is the journey origin
  airports: AirportDef[];
}

export interface AirportDef {
  code: string;
  name: Bilingual;
  terminals: string[];
}

export const CITIES: CityDef[] = [
  {
    code: "RUH",
    country: "SA",
    isOrigin: true,
    name: { en: "Riyadh", ar: "الرياض" },
    airports: [
      {
        code: "RUH",
        name: { en: "King Khalid International Airport", ar: "مطار الملك خالد الدولي" },
        terminals: ["T1", "T2", "T3", "T4", "T5"],
      },
    ],
  },
  {
    code: "LON",
    country: "GB",
    name: { en: "London", ar: "لندن" },
    airports: [
      { code: "LHR", name: { en: "Heathrow Airport", ar: "مطار هيثرو" }, terminals: ["T2", "T3", "T4", "T5"] },
      { code: "LGW", name: { en: "Gatwick Airport", ar: "مطار جاتويك" }, terminals: ["North", "South"] },
    ],
  },
  {
    code: "PAR",
    country: "FR",
    name: { en: "Paris", ar: "باريس" },
    airports: [
      { code: "CDG", name: { en: "Charles de Gaulle Airport", ar: "مطار شارل ديغول" }, terminals: ["T1", "T2", "T3"] },
      { code: "ORY", name: { en: "Orly Airport", ar: "مطار أورلي" }, terminals: ["Orly 1", "Orly 2", "Orly 3", "Orly 4"] },
    ],
  },
  {
    code: "DXB",
    country: "AE",
    name: { en: "Dubai", ar: "دبي" },
    airports: [
      { code: "DXB", name: { en: "Dubai International Airport", ar: "مطار دبي الدولي" }, terminals: ["T1", "T2", "T3"] },
    ],
  },
  {
    code: "CAI",
    country: "EG",
    name: { en: "Cairo", ar: "القاهرة" },
    airports: [
      { code: "CAI", name: { en: "Cairo International Airport", ar: "مطار القاهرة الدولي" }, terminals: ["T1", "T2", "T3"] },
    ],
  },
];

export const DESTINATION_CITY_CODES = ["LON", "PAR", "DXB", "CAI"] as const;

export function getCity(code: string): CityDef | undefined {
  return CITIES.find((c) => c.code === code);
}

// ─────────────────────────── Vehicle categories ───────────────────────────

// Vehicle classes are data-driven (admin-managed in VehicleCategory), so a
// category is any string code. The built-in VVIP/VIP/ECONOMY are the seed
// defaults, not an exhaustive set.
export type CarCategory = string;

export interface VehicleDef {
  category: CarCategory;
  name: Bilingual;
  maxPassengers: number;
  exampleModels: string;
  description: Bilingual;
  /** Price multiplier applied to car-based services. */
  multiplier: number;
  isRecommended?: boolean;
  sortOrder: number;
}

export const VEHICLES: VehicleDef[] = [
  {
    category: "VVIP",
    name: { en: "VVIP", ar: "VVIP" },
    maxPassengers: 3,
    exampleModels: "Maybach / Rolls-Royce",
    description: {
      en: "Our highest tier. The most premium chauffeured experience.",
      ar: "أعلى فئاتنا. تجربة القيادة الأكثر فخامة وتميزًا.",
    },
    multiplier: 2.0,
    sortOrder: 1,
  },
  {
    category: "VIP",
    name: { en: "VIP", ar: "VIP" },
    maxPassengers: 6,
    exampleModels: "Mercedes V-Class / GMC",
    description: {
      en: "Luxurious and spacious. Our recommended choice for most journeys.",
      ar: "فخامة واتساع. خيارنا الموصى به لأغلب الرحلات.",
    },
    multiplier: 1.4,
    isRecommended: true,
    sortOrder: 2,
  },
  {
    category: "ECONOMY",
    name: { en: "Economy", ar: "اقتصادي" },
    maxPassengers: 4,
    exampleModels: "Camry / Sonata",
    description: {
      en: "Practical and comfortable for everyday transfers.",
      ar: "خيار عملي ومريح للتنقلات اليومية.",
    },
    multiplier: 1.0,
    sortOrder: 3,
  },
];

/** Built-in vehicle definition for a category, or undefined for a custom class
 * (custom classes live only in the DB — resolve their name via the catalog). */
export function getVehicle(category: CarCategory): VehicleDef | undefined {
  return VEHICLES.find((v) => v.category === category);
}

/** Display label for a vehicle class: the built-in name, else the raw code. */
export function vehicleLabel(category: string | null | undefined, locale: Locale): string {
  if (!category) return "";
  return getVehicle(category)?.name[locale] ?? category;
}

// ─────────────────────────── Journey steps ───────────────────────────

// Services (steps) are admin-managed (see ServiceStep / the step catalog), so a
// step "type" is any string code. The built-in codes below are the seed set.
export type StepType = string;

/** Which kinds of input a step needs (drives progressive disclosure in the form). */
export interface StepFeatureSet {
  transfer: boolean; // pickup/dropoff/car/passengers/bags
  assistance: boolean; // lounge/terminal/meet&assist
  flight: boolean;
  hotel: boolean;
  home: boolean;
  chauffeur: boolean;
}

export interface StepDef {
  type: StepType;
  order: number;
  name: Bilingual;
  shortName: Bilingual;
  description: Bilingual;
  /** Which city this step takes place in. "RIYADH" | "DESTINATION" | "ANY" */
  cityScope: "RIYADH" | "DESTINATION" | "ANY";
  features: StepFeatureSet;
}

const F = (p: Partial<StepFeatureSet>): StepFeatureSet => ({
  transfer: false,
  assistance: false,
  flight: false,
  hotel: false,
  home: false,
  chauffeur: false,
  ...p,
});

export const STEPS: StepDef[] = [
  {
    type: "HOME_TO_RIYADH_AIRPORT",
    order: 1,
    cityScope: "RIYADH",
    name: { en: "Chauffeur from Your Home", ar: "سائقك من بيتك" },
    shortName: { en: "Home → Riyadh Airport", ar: "المنزل ← مطار الرياض" },
    description: {
      en: "Private pick-up from your doorstep to King Khalid International Airport.",
      ar: "توصيل خاص من باب منزلك إلى مطار الملك خالد الدولي.",
    },
    features: F({ transfer: true, home: true, flight: true }),
  },
  {
    type: "DEPARTURE_ASSIST_RIYADH",
    order: 2,
    cityScope: "RIYADH",
    name: { en: "Departure Send-Off — Riyadh", ar: "توديعك في مطار الرياض" },
    shortName: { en: "Riyadh Departure Assist", ar: "مساعدة المغادرة – الرياض" },
    description: {
      en: "Executive Office or Marhaba lounge assistance at Riyadh Airport.",
      ar: "خدمة المكتب التنفيذي أو مرحبا في مطار الرياض.",
    },
    features: F({ assistance: true, flight: true }),
  },
  {
    type: "ARRIVAL_ASSIST_DESTINATION",
    order: 3,
    cityScope: "DESTINATION",
    name: { en: "Arrival Welcome — Destination", ar: "استقبالك في مطار الوجهة" },
    shortName: { en: "Destination Arrival Assist", ar: "مساعدة الوصول – الوجهة" },
    description: {
      en: "Meet & Assist or Fast Track on arrival in London, Paris, Dubai or Cairo.",
      ar: "الاستقبال والمساعدة أو المسار السريع عند الوصول في لندن أو باريس أو دبي أو القاهرة.",
    },
    features: F({ assistance: true, flight: true }),
  },
  {
    type: "AIRPORT_TO_HOTEL",
    order: 4,
    cityScope: "DESTINATION",
    name: { en: "Chauffeur to Your Hotel", ar: "سائقك إلى الفندق" },
    shortName: { en: "Airport → Hotel", ar: "المطار ← الفندق" },
    description: {
      en: "Seamless private transfer from the destination airport to your hotel.",
      ar: "توصيل خاص وسلس من مطار الوجهة إلى فندقك.",
    },
    features: F({ transfer: true, hotel: true }),
  },
  {
    type: "CHAUFFEUR_DURING_STAY",
    order: 5,
    cityScope: "DESTINATION",
    name: { en: "Private Chauffeur During Your Stay", ar: "سائقك الخاص طوال إقامتك" },
    shortName: { en: "Chauffeur During Stay", ar: "سائق خاص أثناء الإقامة" },
    description: {
      en: "A dedicated chauffeur for your days abroad — by the day and hours you choose.",
      ar: "سائق خاص مخصّص طوال أيام إقامتك — بالأيام والساعات التي تختارها.",
    },
    features: F({ chauffeur: true }),
  },
  {
    type: "HOTEL_TO_AIRPORT",
    order: 6,
    cityScope: "DESTINATION",
    name: { en: "Chauffeur to the Airport", ar: "سائقك إلى المطار" },
    shortName: { en: "Hotel → Airport", ar: "الفندق ← المطار" },
    description: {
      en: "Private transfer from your hotel back to the airport for your return flight.",
      ar: "توصيل خاص من فندقك إلى المطار لرحلة العودة.",
    },
    features: F({ transfer: true, hotel: true }),
  },
  {
    type: "DEPARTURE_ASSIST_RETURN",
    order: 7,
    cityScope: "DESTINATION",
    name: { en: "Departure Send-Off — Destination", ar: "توديعك في مطار الوجهة" },
    shortName: { en: "Return Departure Assist", ar: "مساعدة المغادرة – العودة" },
    description: {
      en: "Meet & Assist or Fast Track for your departure from the destination.",
      ar: "الاستقبال والمساعدة أو المسار السريع لمغادرتك من الوجهة.",
    },
    features: F({ assistance: true, flight: true }),
  },
  {
    type: "ARRIVAL_ASSIST_RIYADH",
    order: 8,
    cityScope: "RIYADH",
    name: { en: "Arrival Welcome — Riyadh", ar: "استقبالك في مطار الرياض" },
    shortName: { en: "Riyadh Arrival Assist", ar: "مساعدة الوصول – الرياض" },
    description: {
      en: "Executive Office, Meet & Assist and arrival assistance back home.",
      ar: "المكتب التنفيذي، الاستقبال والمساعدة وخدمة الوصول عند عودتك.",
    },
    features: F({ assistance: true, flight: true }),
  },
  {
    type: "RIYADH_AIRPORT_TO_HOME",
    order: 9,
    cityScope: "RIYADH",
    name: { en: "Chauffeur to Your Home", ar: "سائقك إلى بيتك" },
    shortName: { en: "Riyadh Airport → Home", ar: "مطار الرياض ← المنزل" },
    description: {
      en: "The final leg — a private transfer from the airport to your door.",
      ar: "المرحلة الأخيرة — توصيل خاص من المطار إلى باب منزلك.",
    },
    features: F({ transfer: true, home: true }),
  },
];

/** Built-in step definition for a code, or undefined for an admin-added step
 * (those live only in the DB / step catalog). */
export function getStep(type: StepType): StepDef | undefined {
  return STEPS.find((s) => s.type === type);
}

/**
 * The city-owned pricing key a step draws its price from. Journey steps are the
 * customer-facing legs; pricing is separated from them so a price is entered
 * once per city and applies to every leg that shares the key. In particular the
 * two directions of an airport transfer resolve to the same key (and city), so
 * "to airport" and "from airport" always cost the same within a city.
 *
 *   Home ⇄ (origin) Airport   → HOME_AIRPORT_TRANSFER   (priced on the origin city)
 *   (destination) Airport ⇄ Hotel → AIRPORT_HOTEL_TRANSFER (priced on the destination)
 *   Chauffeur during stay      → CHAUFFEUR_DURING_STAY   (destination only)
 *
 * Airport-assistance legs are NOT here: they are priced per airport from the
 * selected lounge (see AirportLounge), never per step.
 */
export const STEP_PRICE_KEY: Record<string, string> = {
  HOME_TO_RIYADH_AIRPORT: "HOME_AIRPORT_TRANSFER",
  RIYADH_AIRPORT_TO_HOME: "HOME_AIRPORT_TRANSFER",
  AIRPORT_TO_HOTEL: "AIRPORT_HOTEL_TRANSFER",
  HOTEL_TO_AIRPORT: "AIRPORT_HOTEL_TRANSFER",
  CHAUFFEUR_DURING_STAY: "CHAUFFEUR_DURING_STAY",
};

/** The three city-owned car/transfer pricing keys, in display order. */
export const TRANSFER_PRICE_KEYS = [
  "HOME_AIRPORT_TRANSFER",
  "AIRPORT_HOTEL_TRANSFER",
  "CHAUFFEUR_DURING_STAY",
] as const;

/** Bilingual labels for the pricing keys (shown on the city pricing page). */
export const PRICE_KEY_LABELS: Record<string, Bilingual> = {
  HOME_AIRPORT_TRANSFER: { en: "Home ⇄ Airport transfer", ar: "التوصيل بين المنزل والمطار" },
  AIRPORT_HOTEL_TRANSFER: { en: "Airport ⇄ Hotel transfer", ar: "التوصيل بين المطار والفندق" },
  CHAUFFEUR_DURING_STAY: { en: "Chauffeur during stay", ar: "السائق الخاص أثناء الإقامة" },
};

/** Resolve the city-owned pricing key for a step code (self if not mapped). */
export function stepPriceKey(stepType: string): string {
  return STEP_PRICE_KEY[stepType] ?? stepType;
}

/** Which built-in steps spawn a driver task. Admin steps use their own flag. */
export const DRIVER_TASK_STEPS = new Set<string>([
  "HOME_TO_RIYADH_AIRPORT",
  "AIRPORT_TO_HOTEL",
  "HOTEL_TO_AIRPORT",
  "RIYADH_AIRPORT_TO_HOME",
  "CHAUFFEUR_DURING_STAY",
]);

/** Which trip leg an order belongs to (first half = departure). */
export function stepSideFromOrder(order: number): "DEPARTURE" | "RETURN" {
  return order <= 5 ? "DEPARTURE" : "RETURN";
}

/** Display label for a step: the built-in name, else the raw code. */
export function stepLabel(code: string | null | undefined, locale: Locale): string {
  if (!code) return "";
  return getStep(code)?.name[locale] ?? code;
}

/** Short display label for a step: the built-in short name, else the raw code. */
export function stepShortLabel(code: string | null | undefined, locale: Locale): string {
  if (!code) return "";
  return getStep(code)?.shortName[locale] ?? code;
}

// ─────────────────────────── Service types ───────────────────────────

export type ServiceType =
  | "CAR_ONLY"
  | "MEET_ASSIST_ONLY"
  | "FAST_TRACK_ONLY"
  | "MEET_ASSIST_CAR"
  | "MEET_ASSIST_FASTTRACK_CAR"
  | "SKIP";

export const SERVICE_TYPES: { type: ServiceType; name: Bilingual; hasCar: boolean }[] = [
  { type: "CAR_ONLY", name: { en: "Car only", ar: "سيارة فقط" }, hasCar: true },
  { type: "MEET_ASSIST_ONLY", name: { en: "Meet & Assist only", ar: "استقبال ومساعدة فقط" }, hasCar: false },
  { type: "FAST_TRACK_ONLY", name: { en: "Fast Track only", ar: "المسار السريع فقط" }, hasCar: false },
  { type: "MEET_ASSIST_CAR", name: { en: "Meet & Assist + Car", ar: "استقبال ومساعدة + سيارة" }, hasCar: true },
  {
    type: "MEET_ASSIST_FASTTRACK_CAR",
    name: { en: "Meet & Assist + Fast Track + Car", ar: "استقبال ومساعدة + مسار سريع + سيارة" },
    hasCar: true,
  },
  { type: "SKIP", name: { en: "Skip this step", ar: "تخطّي هذه الخطوة" }, hasCar: false },
];

export function serviceHasCar(type: ServiceType): boolean {
  return SERVICE_TYPES.find((s) => s.type === type)?.hasCar ?? false;
}

// ─────────────────────────── Lounge / assistance options ───────────────────────────

export const LOUNGE_TYPES: { value: string; name: Bilingual }[] = [
  { value: "EXECUTIVE_OFFICE", name: { en: "Executive Office", ar: "المكتب التنفيذي" } },
  { value: "MARHABA", name: { en: "Marhaba", ar: "مرحبا" } },
  { value: "VIP_LOUNGE", name: { en: "VIP Lounge", ar: "صالة كبار الزوار" } },
  { value: "MEET_ASSIST", name: { en: "Meet & Assist", ar: "الاستقبال والمساعدة" } },
  { value: "FAST_TRACK", name: { en: "Fast Track", ar: "المسار السريع" } },
];

/** Riyadh / Saudi airports offer Executive Office & Marhaba. */
const SAUDI_LOUNGES = ["EXECUTIVE_OFFICE", "MARHABA"];
/** Airports outside Saudi Arabia offer Meet & Assist & Fast Track. */
const INTL_LOUNGES = ["MEET_ASSIST", "FAST_TRACK"];

/**
 * Airport assistance options depend on the airport's country:
 *  - Saudi Arabia → Executive Office, Marhaba
 *  - elsewhere    → Meet & Assist, Fast Track
 */
/** Lounge option values a country offers (Saudi airports vs international). */
export function loungeValuesForCountry(country?: string | null): string[] {
  return country === "SA" ? SAUDI_LOUNGES : INTL_LOUNGES;
}

export function loungeOptionsForCity(cityCode?: string | null): typeof LOUNGE_TYPES {
  // Resolves country from the STATIC city list, so it only covers built-in
  // cities. Server code holding a DB city should use loungeValuesForCountry with
  // the DB country instead — admin-added cities aren't in this static list.
  const country = cityCode ? getCity(cityCode)?.country : undefined;
  return LOUNGE_TYPES.filter((l) => loungeValuesForCountry(country).includes(l.value));
}

/** Is a lounge option valid for the given city's country? */
export function isLoungeValidForCity(loungeType: string, cityCode?: string | null): boolean {
  return loungeOptionsForCity(cityCode).some((l) => l.value === loungeType);
}

// ─────────────────────────── Chauffeur daily usage ───────────────────────────

export type ChauffeurUsage = "SEVEN_HOURS" | "EIGHT_HOURS" | "FULL_DAY";

// Chauffeur is offered as a single full-day (10 hour) tier. The price is simply
// the admin's per-class chauffeur price × days (multiplier 1.0 — no tier
// premium). The `ChauffeurUsage` union keeps the legacy values so historical
// bookings that stored 7h/8h still resolve (their multiplier falls back to 1).
export const CHAUFFEUR_USAGE: { value: ChauffeurUsage; name: Bilingual; multiplier: number }[] = [
  { value: "FULL_DAY", name: { en: "Full day (10 hours)", ar: "يوم كامل (١٠ ساعات)" }, multiplier: 1.0 },
];

export const DEFAULT_CHAUFFEUR_USAGE: ChauffeurUsage = "FULL_DAY";

export function chauffeurUsageMultiplier(usage?: string | null): number {
  return CHAUFFEUR_USAGE.find((u) => u.value === usage)?.multiplier ?? 1;
}

/** Which leg of the trip a step belongs to (drives default date auto-fill). */
export function stepSide(stepType: StepType): "DEPARTURE" | "RETURN" {
  return stepSideFromOrder(getStep(stepType)?.order ?? 99);
}

// ─────────────────────────── Packages ───────────────────────────

// Packages are admin-managed standalone products (see ServicePackage / the
// package catalog). A "type" here is just a stable id string.
export type PackageType = string;

export interface PackageDef {
  type: PackageType;
  name: Bilingual;
  description: Bilingual;
  price: number;
  featured?: boolean;
  sortOrder: number;
}

/** Built-in packages — fallback shown only before the admin seeds/edits the DB. */
export const PACKAGES: PackageDef[] = [
  {
    type: "ARRIVAL",
    sortOrder: 1,
    featured: true,
    price: 1500,
    name: { en: "Arrival Package", ar: "باقة الوصول" },
    description: {
      en: "We take care of everything on arrival — VIP assistance, transfer, and hotel check-in.",
      ar: "نعتني بكل شيء عند الوصول — استقبال كبار الشخصيات والتوصيل وتسجيل الدخول في الفندق.",
    },
  },
  {
    type: "DEPARTURE",
    sortOrder: 2,
    price: 1200,
    name: { en: "Departure Package", ar: "باقة المغادرة" },
    description: {
      en: "A seamless transfer and departure assistance at the airport.",
      ar: "توصيل سلس وخدمة مغادرة في المطار.",
    },
  },
  {
    type: "FULL_JOURNEY",
    sortOrder: 3,
    featured: true,
    price: 3500,
    name: { en: "Full Journey", ar: "الرحلة الكاملة" },
    description: {
      en: "Door-to-door perfection — everything from home to destination and back.",
      ar: "تكامل من الباب إلى الباب — كل شيء من المنزل إلى الوجهة والعودة.",
    },
  },
];

export function getPackage(type: PackageType): PackageDef | undefined {
  return PACKAGES.find((p) => p.type === type);
}

// ─────────────────────────── Statuses ───────────────────────────

export type RequestStatus =
  | "REQUEST_RECEIVED"
  | "UNDER_REVIEW"
  | "CLIENT_CONTACTED"
  | "EMPLOYEE_ASSIGNED"
  | "DRIVER_ASSIGNED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export const REQUEST_STATUSES: { value: RequestStatus; name: Bilingual; order: number }[] = [
  { value: "REQUEST_RECEIVED", order: 1, name: { en: "Request Received", ar: "تم استلام الطلب" } },
  { value: "UNDER_REVIEW", order: 2, name: { en: "Under Review", ar: "تحت المراجعة" } },
  { value: "CLIENT_CONTACTED", order: 3, name: { en: "Client Contacted", ar: "تم التواصل مع العميل" } },
  { value: "EMPLOYEE_ASSIGNED", order: 4, name: { en: "Employee Assigned", ar: "تم تعيين الموظف" } },
  { value: "DRIVER_ASSIGNED", order: 5, name: { en: "Driver Assigned", ar: "تم تعيين السائق" } },
  { value: "CONFIRMED", order: 6, name: { en: "Confirmed", ar: "مؤكد" } },
  { value: "IN_PROGRESS", order: 7, name: { en: "In Progress", ar: "قيد التنفيذ" } },
  { value: "COMPLETED", order: 8, name: { en: "Completed", ar: "مكتمل" } },
  { value: "CANCELLED", order: 9, name: { en: "Cancelled", ar: "ملغي" } },
];

export const DRIVER_TASK_STATUSES: { value: string; name: Bilingual }[] = [
  { value: "PENDING", name: { en: "Pending", ar: "بانتظار القبول" } },
  { value: "ACCEPTED", name: { en: "Accepted", ar: "تم القبول" } },
  { value: "ON_THE_WAY", name: { en: "On the way", ar: "في الطريق" } },
  { value: "ARRIVED", name: { en: "Arrived", ar: "وصل" } },
  { value: "COMPLETED", name: { en: "Completed", ar: "مكتمل" } },
];

export function statusLabel(value: RequestStatus, locale: Locale): string {
  return REQUEST_STATUSES.find((s) => s.value === value)?.name[locale] ?? value;
}

// ─────────────────────────── Pricing defaults (SAR) ───────────────────────────
// These seed the admin-editable pricing tables. The database is authoritative
// once seeded; these are the fallback/default values.

export const CURRENCY = "SAR";

/** Default base price per service, in whole SAR. */
export const DEFAULT_SERVICE_PRICES: Record<StepType, number> = {
  HOME_TO_RIYADH_AIRPORT: 250,
  DEPARTURE_ASSIST_RIYADH: 320,
  ARRIVAL_ASSIST_DESTINATION: 420,
  AIRPORT_TO_HOTEL: 380,
  CHAUFFEUR_DURING_STAY: 650, // per day
  HOTEL_TO_AIRPORT: 380,
  DEPARTURE_ASSIST_RETURN: 460,
  ARRIVAL_ASSIST_RIYADH: 420,
  RIYADH_AIRPORT_TO_HOME: 250,
};

/** Does this step use a vehicle (priced per class), rather than assistance only? */
export function isCarStep(stepType: StepType): boolean {
  const f = getStep(stepType)?.features;
  return !!(f?.transfer || f?.chauffeur);
}

/**
 * Default per-class price for each car service, in whole SAR. Seeded from the
 * previous base × class-multiplier so existing prices are preserved when the
 * pricing model switched to a direct per-(service × class) amount.
 */
export const DEFAULT_SERVICE_CLASS_PRICES: Record<string, Record<string, number>> = (() => {
  const out: Record<string, Record<string, number>> = {};
  for (const def of STEPS) {
    if (!(def.features.transfer || def.features.chauffeur)) continue;
    const base = DEFAULT_SERVICE_PRICES[def.type];
    out[def.type] = Object.fromEntries(VEHICLES.map((v) => [v.category, Math.round(base * v.multiplier)]));
  }
  return out;
})();

/**
 * Default per-class prices keyed by the city-owned pricing key (see stepPriceKey).
 * This is what a fresh database seeds into CityServiceClassPrice, so transfer
 * prices are stored once per city and shared by both directions.
 */
export const DEFAULT_CITY_CLASS_PRICES: Record<string, Record<string, number>> = {
  HOME_AIRPORT_TRANSFER: DEFAULT_SERVICE_CLASS_PRICES.HOME_TO_RIYADH_AIRPORT,
  AIRPORT_HOTEL_TRANSFER: DEFAULT_SERVICE_CLASS_PRICES.AIRPORT_TO_HOTEL,
  CHAUFFEUR_DURING_STAY: DEFAULT_SERVICE_CLASS_PRICES.CHAUFFEUR_DURING_STAY,
};

/** Default price per lounge / assistance option, in whole SAR. */
export const DEFAULT_LOUNGE_PRICES: Record<string, number> = {
  EXECUTIVE_OFFICE: 320,
  MARHABA: 240,
  VIP_LOUNGE: 300,
  MEET_ASSIST: 180,
  FAST_TRACK: 200,
};
