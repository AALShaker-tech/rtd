"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_CHAUFFEUR_USAGE,
  getStep,
  STEPS,
  stepSideFromOrder,
  type PackageType,
  type StepDef,
  type StepType,
} from "@/lib/domain";
import { estimateServiceTime } from "@/lib/service-timing";
import type { CustomerDetailsInput, JourneyStepInput, TripInfoInput } from "@/lib/types";

/**
 * Build a step's trip-derived fields from Trip Information.
 *
 * Trip Information is the SINGLE SOURCE OF TRUTH: date, time, flight number,
 * passengers and bags are always (re)computed from it so editing trip info
 * immediately syncs everywhere and never leaves stale values. Only genuinely
 * service-specific choices (service type, vehicle, lounge, hotel/home address,
 * notes, chauffeur days/usage, skipped) are preserved from a prior pass.
 */
function applyTripToStep(
  base: JourneyStepInput,
  tripInfo: TripInfoInput,
  dest: string | undefined,
  prior?: JourneyStepInput,
): JourneyStepInput {
  const def = base.def ?? getStep(base.stepType);
  const f = def?.features;
  const side = stepSideFromOrder(def?.order ?? 99);
  const est = estimateServiceTime(base.stepType, tripInfo, tripInfo.departureFlight, tripInfo.returnFlight);
  const flightCode = side === "DEPARTURE" ? tripInfo.departureFlightCode : tripInfo.returnFlightCode;

  const step: JourneyStepInput = {
    ...base,
    def,
    city: def?.cityScope === "DESTINATION" ? dest : "RUH",
    // service-specific choices preserved
    skipped: prior ? prior.skipped : true,
    serviceType: prior?.serviceType ?? base.serviceType,
    carCategory: prior?.carCategory ?? base.carCategory,
    loungeType: prior?.loungeType,
    hotelName: prior?.hotelName,
    hotelAddress: prior?.hotelAddress,
    homeAddress: prior?.homeAddress,
    notes: prior?.notes,
    // trip-info-driven — always recomputed (no stale values)
    date: est.date,
    time: f?.flight || f?.transfer ? est.time : undefined,
    flightNumber: f?.flight ? flightCode : undefined,
    passengers: f?.transfer ? tripInfo.passengers : undefined,
    bags: f?.transfer ? tripInfo.bags : undefined,
  };

  if (f?.chauffeur) {
    // Chauffeur starts at destination arrival (or departure date); days/usage are service-specific.
    step.date = tripInfo.departureFlight?.estimatedArrivalDate ?? (tripInfo.departureDate || undefined);
    step.time = undefined;
    step.days = prior?.days ?? 1;
    step.dailyUsage = prior?.dailyUsage ?? DEFAULT_CHAUFFEUR_USAGE;
  }
  return step;
}

/**
 * Client-side journey draft. Persisted to localStorage purely as a *draft*
 * (not as the system of record) so a customer can resume an unfinished journey.
 * The PostgreSQL database remains the single source of truth on submission.
 */

/**
 * Return-side → outbound-side step pairing for the one-time mirror. When the
 * customer reaches the Return phase we copy each outbound service's selections
 * into its return counterpart (key = return step, value = source outbound step).
 * The chauffeur is deliberately absent — it belongs only to the destination
 * stay and is never mirrored to the return journey.
 */
const RETURN_MIRROR: Record<string, string> = {
  RIYADH_AIRPORT_TO_HOME: "HOME_TO_RIYADH_AIRPORT",
  ARRIVAL_ASSIST_RIYADH: "DEPARTURE_ASSIST_RIYADH",
  DEPARTURE_ASSIST_RETURN: "ARRIVAL_ASSIST_DESTINATION",
  HOTEL_TO_AIRPORT: "AIRPORT_TO_HOTEL",
};

const emptyCustomer: CustomerDetailsInput = {
  fullName: "",
  phone: "",
  phoneCountry: "SA",
  email: "",
  language: "en",
  children: false,
  childSeat: false,
  contactMeInstead: false,
  notes: "",
};

const emptyTripInfo: TripInfoInput = {
  departureDate: "",
  returnDate: "",
  passengers: 1,
  bags: 0,
  specialAssistance: false,
  assistanceNotes: "",
  departureFlightCode: "",
  returnFlightCode: "",
  departureTime: "",
  returnTime: "",
  departureFlight: null,
  returnFlight: null,
  departureLookupStatus: undefined,
  returnLookupStatus: undefined,
};

function blankStep(def: StepDef): JourneyStepInput {
  const f = def.features;
  return {
    stepType: def.type,
    def,
    serviceType: f.assistance && !f.transfer ? "MEET_ASSIST_ONLY" : "CAR_ONLY",
    skipped: false,
    carCategory: f.transfer ? "VIP" : undefined,
    passengers: f.transfer ? 1 : undefined,
    bags: f.transfer ? 0 : undefined,
    city: def.cityScope === "RIYADH" ? "RUH" : undefined,
  };
}

interface JourneyDraftData {
  selectedPackage?: PackageType;
  destination?: string; // destination city code
  steps: JourneyStepInput[];
  customer: CustomerDetailsInput;
  tripInfo: TripInfoInput;
  phoneVerified: boolean;
  emailVerified: boolean;
  /**
   * Whether the return services have already been seeded from the outbound
   * selections. The mirror runs exactly once (on first entry to the Return
   * phase); after that the return journey is independent and is never
   * auto-overwritten again — only the explicit "match outbound" action re-copies.
   */
  returnMirrored: boolean;
  /** Epoch ms of last user activity — drives draft expiry. */
  lastTouched: number;
  /** Transient (not persisted): set when a stale draft was just cleared. */
  draftExpired: boolean;
}

interface JourneyState extends JourneyDraftData {
  setDestination: (code: string) => void;
  setTripInfo: (patch: Partial<TripInfoInput>) => void;
  applyTripInfoToSteps: () => void;
  initFlow: (destination?: string, stepDefs?: StepDef[]) => void;
  startBlank: () => void;
  /**
   * Copy the outbound service selections into their return counterparts. Called
   * once automatically on first entry to the Return phase, and again only when
   * the customer explicitly asks to re-match. Trip-derived fields (dates, times,
   * passengers, bags) are NOT copied — they stay computed for the return side.
   */
  mirrorReturnFromOutbound: () => void;
  updateStep: (stepType: StepType, patch: Partial<JourneyStepInput>) => void;
  setSkipped: (stepType: StepType, skipped: boolean) => void;
  setCustomer: (patch: Partial<CustomerDetailsInput>) => void;
  setPhoneVerified: (v: boolean) => void;
  setEmailVerified: (v: boolean) => void;
  clearExpiredNotice: () => void;
  reset: () => void;
}

/** A fresh, empty draft (data only). */
function freshDraft(): JourneyDraftData {
  return {
    selectedPackage: undefined,
    destination: undefined,
    steps: [],
    customer: emptyCustomer,
    tripInfo: emptyTripInfo,
    phoneVerified: false,
    emailVerified: false,
    returnMirrored: false,
    lastTouched: Date.now(),
    draftExpired: false,
  };
}

const orderOf = (s: JourneyStepInput) => s.def?.order ?? getStep(s.stepType)?.order ?? 0;
const defOf = (s: JourneyStepInput): StepDef | undefined => s.def ?? getStep(s.stepType);

function sortByOrder(steps: JourneyStepInput[]): JourneyStepInput[] {
  return [...steps].sort((a, b) => orderOf(a) - orderOf(b));
}

const NOW = () => Date.now();

// How long an unfinished booking draft may sit before we treat it as stale.
// Overridable via env; defaults to 24h so a customer can resume within a day.
const DRAFT_TTL_MS = Number(process.env.NEXT_PUBLIC_DRAFT_TTL_MS ?? 24 * 60 * 60 * 1000);

// Persisted to localStorage as a *draft* so a customer can resume an unfinished
// booking after a reload or a later visit (the database stays the source of
// truth on submission). A draft older than DRAFT_TTL_MS is dropped on rehydrate
// and the `draftExpired` notice is raised so the builder can offer a clean start.
export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      ...freshDraft(),

      setDestination: (code) =>
        set((st) => ({
          destination: code,
          lastTouched: NOW(),
          steps: st.steps.map((s) =>
            defOf(s)?.cityScope === "DESTINATION" ? { ...s, city: code } : s,
          ),
        })),

      setTripInfo: (patch) => set((st) => ({ tripInfo: { ...st.tripInfo, ...patch }, lastTouched: NOW() })),

      /**
       * Re-apply Trip Information to every step's auto-filled fields (dates by
       * side, passengers & bags). Called after the customer edits Trip Info —
       * Trip Info is the source of truth, so these values propagate everywhere.
       */
      applyTripInfoToSteps: () =>
        set((st) => ({
          lastTouched: NOW(),
          steps: st.steps.map((s) => {
            const d = defOf(s);
            return d ? applyTripToStep(blankStep(d), st.tripInfo, st.destination, s) : s;
          }),
        })),

      /**
       * Build the step-by-step flow for the chosen destination, auto-filling
       * shared Trip Information into each step:
       *  - departure-side steps default to the departure date
       *  - return-side steps default to the return date
       *  - passengers / bags default to the global trip values
       * User-customized fields from a prior pass are preserved.
       */
      initFlow: (destination, stepDefs) => {
        const { tripInfo } = get();
        const dest = destination ?? get().destination;
        const prior = new Map(get().steps.map((s) => [s.stepType, s]));
        // Build from the provided (admin-managed, already availability-filtered)
        // service catalog; fall back to the built-in steps when none supplied.
        const defs = stepDefs?.length ? stepDefs : STEPS;
        const steps = defs.map((def) => applyTripToStep(blankStep(def), tripInfo, dest, prior.get(def.type)));
        // A freshly (re)built flow hasn't seeded its return services yet.
        set({ destination: dest, steps: sortByOrder(steps), returnMirrored: false, lastTouched: NOW() });
      },

      startBlank: () => set({ steps: [] }),

      mirrorReturnFromOutbound: () =>
        set((st) => {
          const bySource = new Map(st.steps.map((s) => [s.stepType, s]));
          return {
            lastTouched: NOW(),
            returnMirrored: true,
            steps: st.steps.map((s) => {
              const sourceType = RETURN_MIRROR[s.stepType];
              if (!sourceType) return s; // not a mirrored return step (e.g. chauffeur)
              const src = bySource.get(sourceType);
              if (!src) return s;
              // Copy only the service *selections* — never the trip-derived
              // timing/party fields, which stay correct for the return side.
              return {
                ...s,
                skipped: src.skipped,
                serviceType: src.serviceType,
                carCategory: src.carCategory,
                loungeType: src.loungeType,
                airport: src.airport ?? s.airport,
                homeAddress: src.homeAddress ?? s.homeAddress,
                hotelName: src.hotelName ?? s.hotelName,
                notes: src.notes ?? s.notes,
                additionalVehicles: src.additionalVehicles
                  ? src.additionalVehicles.map((v) => ({ ...v }))
                  : undefined,
              };
            }),
          };
        }),

      updateStep: (stepType, patch) =>
        set((st) => ({
          lastTouched: NOW(),
          steps: st.steps.map((s) => (s.stepType === stepType ? { ...s, ...patch } : s)),
        })),

      setSkipped: (stepType, skipped) =>
        set((st) => ({
          lastTouched: NOW(),
          steps: st.steps.map((s) =>
            s.stepType === stepType ? { ...s, skipped, serviceType: skipped ? "SKIP" : "CAR_ONLY" } : s,
          ),
        })),

      setCustomer: (patch) => set((st) => ({ customer: { ...st.customer, ...patch }, lastTouched: NOW() })),
      setPhoneVerified: (v) => set({ phoneVerified: v }),
      setEmailVerified: (v) => set({ emailVerified: v }),

      clearExpiredNotice: () => set({ draftExpired: false }),

      reset: () => set({ ...freshDraft() }),
    }),
    {
      name: "rtd-journey-draft",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Don't hydrate during SSR; the builder triggers rehydration on mount so
      // the server and first client render always match (no hydration flash).
      skipHydration: true,
      // Persist draft data only — never the action functions or the transient
      // `draftExpired` flag (that's recomputed from `lastTouched` on rehydrate).
      partialize: (s) => ({
        selectedPackage: s.selectedPackage,
        destination: s.destination,
        steps: s.steps,
        customer: s.customer,
        tripInfo: s.tripInfo,
        phoneVerified: s.phoneVerified,
        emailVerified: s.emailVerified,
        returnMirrored: s.returnMirrored,
        lastTouched: s.lastTouched,
      }),
      // Drop a stale draft on rehydrate and raise the expiry notice; otherwise
      // restore it verbatim over the fresh in-memory defaults.
      merge: (persisted, current) => {
        const p = persisted as Partial<JourneyDraftData> | undefined;
        const stale =
          !p ||
          typeof p.lastTouched !== "number" ||
          Date.now() - p.lastTouched > DRAFT_TTL_MS;
        return stale
          ? { ...current, ...freshDraft(), draftExpired: !!p }
          : { ...current, ...p, draftExpired: false };
      },
    },
  ),
);

/** All available steps in canonical order (for the builder catalogue). */
export const ALL_STEPS = STEPS;
