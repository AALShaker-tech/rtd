"use client";

import { createContext, useContext, useMemo } from "react";
import { FALLBACK_STEPS, toStepDef, type CatalogStep } from "@/lib/steps";
import type { StepDef } from "@/lib/domain";

interface StepCatalogCtx {
  /** Active services as engine-ready defs, in order. */
  steps: StepDef[];
  catalog: CatalogStep[];
  def: (code: string) => StepDef | undefined;
  createsDriverTask: (code: string) => boolean;
}

const Ctx = createContext<StepCatalogCtx | null>(null);

export function StepCatalogProvider({
  children,
  initialSteps,
}: {
  children: React.ReactNode;
  initialSteps?: CatalogStep[];
}) {
  const catalog = initialSteps?.length ? initialSteps : FALLBACK_STEPS;
  const value = useMemo<StepCatalogCtx>(() => {
    const byCode = new Map(catalog.map((c) => [c.code, c]));
    return {
      catalog,
      steps: catalog.map(toStepDef),
      def: (code) => {
        const c = byCode.get(code);
        return c ? toStepDef(c) : undefined;
      },
      createsDriverTask: (code) => byCode.get(code)?.createsDriverTask ?? false,
    };
  }, [catalog]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStepCatalog(): StepCatalogCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStepCatalog must be used within StepCatalogProvider");
  return ctx;
}
