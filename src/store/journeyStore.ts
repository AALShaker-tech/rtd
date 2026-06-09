"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getPackage, getStep, STEPS, type PackageType, type StepType } from "@/lib/domain";
import type { CustomerDetailsInput, JourneyStepInput } from "@/lib/types";

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
  phoneVerified: boolean;
  emailVerified: boolean;

  setDestination: (code: string) => void;
  initFlow: (destination: string) => void;
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
      phoneVerified: false,
      emailVerified: false,

      setDestination: (code) =>
        set((st) => ({
          destination: code,
          steps: st.steps.map((s) =>
            getStep(s.stepType).cityScope === "DESTINATION" ? { ...s, city: code } : s,
          ),
        })),

      /**
       * Start a SAFAR-style step-by-step flow: pre-build all 9 steps for the
       * chosen destination, each starting as "skipped" (not counted) until the
       * customer explicitly adds it.
       */
      initFlow: (destination) => {
        const existing = new Map(get().steps.map((s) => [s.stepType, s]));
        const steps = STEPS.map((def) => {
          const prior = existing.get(def.type);
          const base = blankStep(def.type);
          const step: JourneyStepInput = prior ? { ...base, ...prior } : { ...base, skipped: true };
          if (def.cityScope === "DESTINATION") step.city = destination;
          return step;
        });
        set({ destination, selectedPackage: undefined, steps: sortByOrder(steps) });
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
          phoneVerified: false,
          emailVerified: false,
        }),
    }),
    { name: "rtd_journey_draft" },
  ),
);

/** All available steps in canonical order (for the builder catalogue). */
export const ALL_STEPS = STEPS;
