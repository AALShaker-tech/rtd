"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_CHAUFFEUR_USAGE,
  getPackage,
  getStep,
  STEPS,
  stepSide,
  type PackageType,
  type StepType,
} from "@/lib/domain";
import { estimateServiceTime } from "@/lib/service-timing";
import type { CustomerDetailsInput, JourneyStepInput, TripInfoInput } from "@/lib/types";

/** Build a step's trip-derived fields (city, date, time, flight, pax, bags). */
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
    // user customizations preserved
    skipped: prior ? prior.skipped : true,
    serviceType: prior?.serviceType ?? base.serviceType,
    carCategory: prior?.carCategory ?? base.carCategory,
    loungeType: prior?.loungeType,
    hotelName: prior?.hotelName,
    hotelAddress: prior?.hotelAddress,
    homeAddress: prior?.homeAddress,
    notes: prior?.notes,
    // trip-info-driven (auto), editable per step
    date: prior?.date ?? est.date,
    time: def.features.flight || def.features.transfer ? prior?.time ?? est.time : prior?.time,
    flightNumber: def.features.flight ? flightCode : undefined,
    passengers: def.features.transfer ? prior?.passengers ?? tripInfo.passengers : undefined,
    bags: def.features.transfer ? prior?.bags ?? tripInfo.bags : undefined,
  };

  if (def.features.chauffeur) {
    step.date = prior?.date ?? tripInfo.departureFlight?.estimatedArrivalDate ?? (tripInfo.departureDate || undefined);
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

interface JourneyState {
  selectedPackage?: PackageType;
  destination?: string; // destination city code
  steps: JourneyStepInput[];
  customer: CustomerDetailsInput;
  tripInfo: TripInfoInput;
  phoneVerified: boolean;
  emailVerified: boolean;

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
  reset: () => void;
}

function sortByOrder(steps: JourneyStepInput[]): JourneyStepInput[] {
  return [...steps].sort((a, b) => getStep(a.stepType).order - getStep(b.stepType).order);
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      selectedPackage: undefined,
      destination: undefined,
      steps: [],
      customer: emptyCustomer,
      tripInfo: emptyTripInfo,
      phoneVerified: false,
      emailVerified: false,

      setDestination: (code) =>
        set((st) => ({
          destination: code,
          steps: st.steps.map((s) =>
            getStep(s.stepType).cityScope === "DESTINATION" ? { ...s, city: code } : s,
          ),
        })),

      setTripInfo: (patch) => set((st) => ({ tripInfo: { ...st.tripInfo, ...patch } })),

      /**
       * Re-apply Trip Information to every step's auto-filled fields (dates by
       * side, passengers & bags). Called after the customer edits Trip Info —
       * Trip Info is the source of truth, so these values propagate everywhere.
       */
      applyTripInfoToSteps: () =>
        set((st) => ({
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
        set({ destination: dest, steps: sortByOrder(steps) });
      },

      applyPackage: (pkg) => {
        const def = getPackage(pkg);
        if (!def) return;
        const dest = get().destination;
        set({
          selectedPackage: pkg,
          steps: sortByOrder(
            def.steps.map((t) => {
              const step = blankStep(t);
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
        set((st) => ({ steps: sortByOrder([...st.steps, step]) }));
      },

      removeStep: (stepType) =>
        set((st) => ({ steps: st.steps.filter((s) => s.stepType !== stepType) })),

      toggleStep: (stepType) => {
        if (get().steps.some((s) => s.stepType === stepType)) get().removeStep(stepType);
        else get().addStep(stepType);
      },

      updateStep: (stepType, patch) =>
        set((st) => ({
          steps: st.steps.map((s) => (s.stepType === stepType ? { ...s, ...patch } : s)),
        })),

      setSkipped: (stepType, skipped) =>
        set((st) => ({
          steps: st.steps.map((s) =>
            s.stepType === stepType ? { ...s, skipped, serviceType: skipped ? "SKIP" : "CAR_ONLY" } : s,
          ),
        })),

      hasStep: (stepType) => get().steps.some((s) => s.stepType === stepType),

      setCustomer: (patch) => set((st) => ({ customer: { ...st.customer, ...patch } })),
      setPhoneVerified: (v) => set({ phoneVerified: v }),
      setEmailVerified: (v) => set({ emailVerified: v }),

      reset: () =>
        set({
          selectedPackage: undefined,
          destination: undefined,
          steps: [],
          customer: emptyCustomer,
          tripInfo: emptyTripInfo,
          phoneVerified: false,
          emailVerified: false,
        }),
    }),
    { name: "rtd_journey_draft" },
  ),
);

/** All available steps in canonical order (for the builder catalogue). */
export const ALL_STEPS = STEPS;
