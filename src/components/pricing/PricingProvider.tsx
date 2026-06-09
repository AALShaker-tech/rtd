"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  DEFAULT_PRICING_CONFIG,
  computeJourneyPricing,
  computeStepPrice,
  type PricingConfig,
} from "@/lib/pricing";
import { fetchPricingConfig } from "@/server/actions/pricing.actions";
import type { JourneyStepInput } from "@/lib/types";

interface PricingCtx {
  config: PricingConfig;
  loaded: boolean;
  stepPrice: (step: JourneyStepInput) => number;
  total: (steps: JourneyStepInput[]) => number;
}

const Ctx = createContext<PricingCtx | null>(null);

export function PricingProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPricingConfig()
      .then((c) => active && (setConfig(c), setLoaded(true)))
      .catch(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  const value: PricingCtx = {
    config,
    loaded,
    stepPrice: (step) => computeStepPrice(step, config).computedPrice,
    total: (steps) => computeJourneyPricing(steps, config).estimatedTotal,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePricing(): PricingCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePricing must be used within PricingProvider");
  return ctx;
}
