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
  steps: JourneyStepInput[];
  customer: CustomerDetailsInput;
  phoneVerified: boolean;
  emailVerified: boolean;

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
      steps: [],
      customer: emptyCustomer,
      phoneVerified: false,
      emailVerified: false,

      applyPackage: (pkg) => {
        const def = getPackage(pkg);
        if (!def) return;
        set({
          selectedPackage: pkg,
          steps: sortByOrder(def.steps.map(blankStep)),
        });
      },

      startBlank: () => set({ selectedPackage: undefined, steps: [] }),

      addStep: (stepType) => {
        if (get().steps.some((s) => s.stepType === stepType)) return;
        set((st) => ({ steps: sortByOrder([...st.steps, blankStep(stepType)]) }));
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
