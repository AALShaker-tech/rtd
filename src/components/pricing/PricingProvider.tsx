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

export function PricingProvider({
  children,
  initialConfig,
}: {
  children: React.ReactNode;
  /** Live config resolved on the server (preferred). When present the client
   * skips the fetch, so a failed request can never mask admin changes with the
   * built-in defaults. */
  initialConfig?: PricingConfig;
}) {
  const [config, setConfig] = useState<PricingConfig>(initialConfig ?? DEFAULT_PRICING_CONFIG);
  const [loaded, setLoaded] = useState(!!initialConfig);

  useEffect(() => {
    if (initialConfig) return; // already hydrated with live server data
    let active = true;
    fetchPricingConfig()
      .then((c) => active && (setConfig(c), setLoaded(true)))
      .catch(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [initialConfig]);

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
