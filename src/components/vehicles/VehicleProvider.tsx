"use client";

import { createContext, useContext } from "react";
import {
  FALLBACK_VEHICLES,
  defaultVehicleCategory,
  vehicleCapacityMap,
  type CatalogVehicle,
} from "@/lib/vehicles";

interface VehicleCtx {
  vehicles: CatalogVehicle[];
  /** Category to pre-select (recommended, else first). */
  defaultCategory?: string;
  /** category → maxPassengers, for capacity checks. */
  capacityByCategory: Record<string, number>;
  vehicle: (category?: string | null) => CatalogVehicle | undefined;
}

const Ctx = createContext<VehicleCtx | null>(null);

export function VehicleProvider({
  children,
  initialVehicles,
}: {
  children: React.ReactNode;
  /** Live fleet resolved on the server (preferred). Falls back to the built-in
   * fleet so a failed load never leaves the picker empty. */
  initialVehicles?: CatalogVehicle[];
}) {
  const vehicles = initialVehicles?.length ? initialVehicles : FALLBACK_VEHICLES;
  const value: VehicleCtx = {
    vehicles,
    defaultCategory: defaultVehicleCategory(vehicles),
    capacityByCategory: vehicleCapacityMap(vehicles),
    vehicle: (category) => vehicles.find((v) => v.category === category),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVehicles(): VehicleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVehicles must be used within VehicleProvider");
  return ctx;
}
