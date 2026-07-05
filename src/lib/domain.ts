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

export type CarCategory = "VVIP" | "VIP" | "ECONOMY";

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

export function getVehicle(category: CarCategory): VehicleDef {
  return VEHICLES.find((v) => v.category === category)!;
}

// ─────────────────────────── Journey steps ───────────────────────────

export type StepType =
  | "HOME_TO_RIYADH_AIRPORT"
  | "DEPARTURE_ASSIST_RIYADH"
  | "ARRIVAL_ASSIST_DESTINATION"
  | "AIRPORT_TO_HOTEL"
  | "CHAUFFEUR_DURING_STAY"
  | "HOTEL_TO_AIRPORT"
  | "DEPARTURE_ASSIST_RETURN"
  | "ARRIVAL_ASSIST_RIYADH"
  | "RIYADH_AIRPORT_TO_HOME";

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
    name: { en: "Home to Riyadh Airport", ar: "من المنزل إلى مطار الرياض" },
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
    name: { en: "Departure Assistance at Riyadh Airport", ar: "خدمة المغادرة في مطار الرياض" },
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
    name: { en: "Arrival Assistance at Destination", ar: "خدمة الوصول في الوجهة" },
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
    name: { en: "Airport to Hotel Transfer", ar: "التوصيل من المطار إلى الفندق" },
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
    name: { en: "Chauffeur Service During Stay", ar: "خدمة السائق الخاص أثناء الإقامة" },
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
    name: { en: "Hotel to Airport Return Transfer", ar: "التوصيل من الفندق إلى المطار للعودة" },
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
    name: { en: "Departure Assistance at Return Airport", ar: "خدمة المغادرة في مطار العودة" },
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
    name: { en: "Arrival Assistance at Riyadh Airport", ar: "خدمة الوصول في مطار الرياض" },
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
    name: { en: "Riyadh Airport to Home Transfer", ar: "التوصيل من مطار الرياض إلى المنزل" },
    shortName: { en: "Riyadh Airport → Home", ar: "مطار الرياض ← المنزل" },
    description: {
      en: "The final leg — a private transfer from the airport to your door.",
      ar: "المرحلة الأخيرة — توصيل خاص من المطار إلى باب منزلك.",
    },
    features: F({ transfer: true, home: true }),
  },
];

export function getStep(type: StepType): StepDef {
  return STEPS.find((s) => s.type === type)!;
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

export const CHAUFFEUR_USAGE: { value: ChauffeurUsage; name: Bilingual; multiplier: number }[] = [
  { value: "SEVEN_HOURS", name: { en: "7 hours", ar: "٧ ساعات" }, multiplier: 1.0 },
  { value: "EIGHT_HOURS", name: { en: "8 hours", ar: "٨ ساعات" }, multiplier: 1.1 },
  { value: "FULL_DAY", name: { en: "Full day", ar: "يوم كامل" }, multiplier: 1.4 },
];

export const DEFAULT_CHAUFFEUR_USAGE: ChauffeurUsage = "EIGHT_HOURS";

export function chauffeurUsageMultiplier(usage?: string | null): number {
  return CHAUFFEUR_USAGE.find((u) => u.value === usage)?.multiplier ?? 1;
}

/** Which leg of the trip a step belongs to (drives default date auto-fill). */
export function stepSide(stepType: StepType): "DEPARTURE" | "RETURN" {
  return getStep(stepType).order <= 5 ? "DEPARTURE" : "RETURN";
}

// ─────────────────────────── Packages ───────────────────────────

export type PackageType =
  | "ARRIVAL"
  | "DEPARTURE"
  | "FULL_JOURNEY"
  | "VVIP_CONCIERGE"
  | "LONDON_CHAUFFEUR"
  | "AIRPORT_TO_HOTEL"
  | "HOTEL_TO_AIRPORT";

export interface PackageDef {
  type: PackageType;
  name: Bilingual;
  description: Bilingual;
  steps: StepType[];
  featured?: boolean;
  sortOrder: number;
}

export const PACKAGES: PackageDef[] = [
  {
    type: "FULL_JOURNEY",
    sortOrder: 1,
    featured: true,
    name: { en: "Full Journey", ar: "الرحلة الكاملة" },
    description: {
      en: "Door-to-door perfection — every leg from home to destination and back.",
      ar: "تكامل من الباب إلى الباب — كل مرحلة من المنزل إلى الوجهة والعودة.",
    },
    steps: STEPS.map((s) => s.type),
  },
  {
    type: "VVIP_CONCIERGE",
    sortOrder: 2,
    featured: true,
    name: { en: "VVIP Concierge", ar: "كونسيرج VVIP" },
    description: {
      en: "The pinnacle of discretion and care, with our highest service tier throughout.",
      ar: "قمة الخصوصية والعناية، مع أعلى فئات خدماتنا في كل مرحلة.",
    },
    steps: STEPS.map((s) => s.type),
  },
  {
    type: "ARRIVAL",
    sortOrder: 3,
    name: { en: "Arrival Package", ar: "باقة الوصول" },
    description: {
      en: "VIP arrival assistance and a private transfer to your hotel.",
      ar: "خدمة وصول كبار الشخصيات وتوصيل خاص إلى فندقك.",
    },
    steps: ["ARRIVAL_ASSIST_DESTINATION", "AIRPORT_TO_HOTEL"],
  },
  {
    type: "DEPARTURE",
    sortOrder: 4,
    name: { en: "Departure Package", ar: "باقة المغادرة" },
    description: {
      en: "A seamless transfer and departure assistance at Riyadh Airport.",
      ar: "توصيل سلس وخدمة مغادرة في مطار الرياض.",
    },
    steps: ["HOME_TO_RIYADH_AIRPORT", "DEPARTURE_ASSIST_RIYADH"],
  },
  {
    type: "LONDON_CHAUFFEUR",
    sortOrder: 5,
    name: { en: "London Chauffeur", ar: "سائق لندن الخاص" },
    description: {
      en: "A dedicated chauffeur at your service throughout your London stay.",
      ar: "سائق خاص في خدمتك طوال إقامتك في لندن.",
    },
    steps: ["CHAUFFEUR_DURING_STAY"],
  },
  {
    type: "AIRPORT_TO_HOTEL",
    sortOrder: 6,
    name: { en: "Airport to Hotel Transfer", ar: "التوصيل من المطار إلى الفندق" },
    description: {
      en: "A single elegant transfer from the airport to your hotel.",
      ar: "توصيل أنيق واحد من المطار إلى فندقك.",
    },
    steps: ["AIRPORT_TO_HOTEL"],
  },
  {
    type: "HOTEL_TO_AIRPORT",
    sortOrder: 7,
    name: { en: "Hotel to Airport Transfer", ar: "التوصيل من الفندق إلى المطار" },
    description: {
      en: "A single elegant transfer from your hotel to the airport.",
      ar: "توصيل أنيق واحد من فندقك إلى المطار.",
    },
    steps: ["HOTEL_TO_AIRPORT"],
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

/** Default price per lounge / assistance option, in whole SAR. */
export const DEFAULT_LOUNGE_PRICES: Record<string, number> = {
  EXECUTIVE_OFFICE: 320,
  MARHABA: 240,
  VIP_LOUNGE: 300,
  MEET_ASSIST: 180,
  FAST_TRACK: 200,
};

/** Default destination price factor. Riyadh = 1.0 (origin). */
export const DEFAULT_DESTINATION_FACTORS: Record<string, number> = {
  RUH: 1.0,
  LON: 1.3,
  PAR: 1.25,
  DXB: 1.1,
  CAI: 0.9,
};
