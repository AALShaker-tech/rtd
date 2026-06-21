"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_CHAUFFEUR_USAGE,
  getPackage,
  getStep,
  loungeOptionsForCity,
  STEPS,
  stepSide,
  type PackageType,
  type StepType,
} from "@/lib/domain";
import { estimateServiceTime } from "@/lib/service-timing";
import type { CustomerDetailsInput, JourneyStepInput, TripInfoInput } from "@/lib/types";

/** How long an inactive customer draft survives before it's cleared. */
export const DRAFT_TTL_MS = 30 * 60 * 1000; // 30 minutes

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
  const def = getStep(base.stepType);
  const side = stepSide(base.stepType);
  const est = estimateServiceTime(base.stepType, tripInfo, tripInfo.departureFlight, tripInfo.returnFlight);
  const flightCode = side === "DEPARTURE" ? tripInfo.departureFlightCode : tripInfo.returnFlightCode;

  const step: JourneyStepInput = {
    ...base,
    city: def.cityScope === "DESTINATION" ? dest : "RUH",
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
    time: def.features.flight || def.features.transfer ? est.time : undefined,
    flightNumber: def.features.flight ? flightCode : undefined,
    passengers: def.features.transfer ? tripInfo.passengers : undefined,
    bags: def.features.transfer ? tripInfo.bags : undefined,
  };

  if (def.features.chauffeur) {
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

function blankStep(stepType: StepType): JourneyStepInput {
  const def = getStep(stepType);
  return {
    stepType,
    serviceType: def.features.assistance && !def.features.transfer ? "MEET_ASSIST_ONLY" : "CAR_ONLY",
    skipped: false,
    carCategory: def.features.transfer ? "VIP" : undefined,
    passengers: def.features.transfer ? 1 : undefined,
    bags: def.features.transfer ? 0 : undefined,
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
  /** Epoch ms of last user activity — drives draft expiry. */
  lastTouched: number;
  /** Transient (not persisted): set when a stale draft was just cleared. */
  draftExpired: boolean;
}

interface JourneyState extends JourneyDraftData {
  setDestination: (code: string) => void;
  setTripInfo: (patch: Partial<TripInfoInput>) => void;
  applyTripInfoToSteps: () => void;
  initFlow: (destination?: string) => void;
  applyPackage: (pkg: PackageType) => void;
  startBlank: () => void;
  addStep: (stepType: StepType) => void;
  removeStep: (stepType: StepType) => void;
  toggleStep: (stepType: StepType) => void;
  updateStep: (stepType: StepType, patch: Partial<JourneyStepInput>) => void;
  setSkipped: (stepType: StepType, skipped: boolean) => void;
  hasStep: (stepType: StepType) => boolean;
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
    lastTouched: Date.now(),
    draftExpired: false,
  };
}

function sortByOrder(steps: JourneyStepInput[]): JourneyStepInput[] {
  return [...steps].sort((a, b) => getStep(a.stepType).order - getStep(b.stepType).order);
}

const NOW = () => Date.now();

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      ...freshDraft(),

      setDestination: (code) =>
        set((st) => ({
          destination: code,
          lastTouched: NOW(),
          steps: st.steps.map((s) =>
            getStep(s.stepType).cityScope === "DESTINATION" ? { ...s, city: code } : s,
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
          steps: st.steps.map((s) => applyTripToStep(blankStep(s.stepType), st.tripInfo, st.destination, s)),
        })),

      /**
       * Build the step-by-step flow for the chosen destination, auto-filling
       * shared Trip Information into each step:
       *  - departure-side steps default to the departure date
       *  - return-side steps default to the return date
       *  - passengers / bags default to the global trip values
       * User-customized fields from a prior pass are preserved.
       */
      initFlow: (destination) => {
        const { tripInfo } = get();
        const dest = destination ?? get().destination;
        const prior = new Map(get().steps.map((s) => [s.stepType, s]));
        const steps = STEPS.map((def) => applyTripToStep(blankStep(def.type), tripInfo, dest, prior.get(def.type)));

        // For the chosen package, pre-select the recommended lounge option on its
        // assistance steps so the customer sees a default selection (they still
        // explicitly Add each step — nothing is auto-added).
        const pkg = get().selectedPackage;
        const pkgSteps = pkg ? new Set(getPackage(pkg)?.steps ?? []) : null;
        if (pkgSteps) {
          for (const s of steps) {
            const d = getStep(s.stepType);
            if (d.features.assistance && !s.loungeType && pkgSteps.has(s.stepType)) {
              s.loungeType = loungeOptionsForCity(s.city)[0]?.value;
            }
          }
        }

        set({ destination: dest, steps: sortByOrder(steps), lastTouched: NOW() });
      },

      applyPackage: (pkg) => {
        const def = getPackage(pkg);
        if (!def) return;
        const dest = get().destination;
        set({
          selectedPackage: pkg,
          lastTouched: NOW(),
          steps: sortByOrder(
            def.steps.map((t) => {
              const step = blankStep(t);
              // Packages no longer auto-add: the customer explicitly Adds each
              // service (or Skips). Steps start un-added.
              step.skipped = true;
              if (getStep(t).cityScope === "DESTINATION" && dest) step.city = dest;
              return step;
            }),
          ),
        });
      },

      startBlank: () => set({ selectedPackage: undefined, steps: [] }),

      addStep: (stepType) => {
        if (get().steps.some((s) => s.stepType === stepType)) return;
        const step = blankStep(stepType);
        const dest = get().destination;
        if (getStep(stepType).cityScope === "DESTINATION" && dest) step.city = dest;
        set((st) => ({ steps: sortByOrder([...st.steps, step]), lastTouched: NOW() }));
      },

      removeStep: (stepType) =>
        set((st) => ({ steps: st.steps.filter((s) => s.stepType !== stepType), lastTouched: NOW() })),

      toggleStep: (stepType) => {
        if (get().steps.some((s) => s.stepType === stepType)) get().removeStep(stepType);
        else get().addStep(stepType);
      },

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

      hasStep: (stepType) => get().steps.some((s) => s.stepType === stepType),

      setCustomer: (patch) => set((st) => ({ customer: { ...st.customer, ...patch }, lastTouched: NOW() })),
      setPhoneVerified: (v) => set({ phoneVerified: v }),
      setEmailVerified: (v) => set({ emailVerified: v }),

      clearExpiredNotice: () => set({ draftExpired: false }),

      reset: () => {
        set({ ...freshDraft() });
        // also wipe the persisted copy so a fresh start is truly clean
        try {
          useJourneyStore.persist.clearStorage();
        } catch {
          /* noop */
        }
      },
    }),
    {
      name: "rtd_journey_draft",
      version: 3,
      // Persist only user inputs — never computed prices. Derived dates/times are
      // recomputed from Trip Information whenever it changes.
      partialize: (s) => ({
        selectedPackage: s.selectedPackage,
        destination: s.destination,
        steps: s.steps,
        customer: s.customer,
        tripInfo: s.tripInfo,
        lastTouched: s.lastTouched,
      }),
      // Drop drafts saved by older (incompatible) versions.
      migrate: (persisted, version) => {
        if (version < 3 || !persisted) {
          const f = freshDraft();
          return { selectedPackage: f.selectedPackage, destination: f.destination, steps: f.steps, customer: f.customer, tripInfo: f.tripInfo, lastTouched: f.lastTouched } as any;
        }
        return persisted as any;
      },
      // On load, clear a stale draft and flag it so the UI can inform the user.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const ts = state.lastTouched;
        if (ts && Date.now() - ts > DRAFT_TTL_MS) {
          setTimeout(() => {
            useJourneyStore.setState({ ...freshDraft(), draftExpired: true });
            useJourneyStore.persist.clearStorage();
          }, 0);
        }
      },
    },
  ),
);

/** All available steps in canonical order (for the builder catalogue). */
export const ALL_STEPS = STEPS;
