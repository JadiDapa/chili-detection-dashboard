"use client";

import { useQuery } from "@tanstack/react-query";
import { piApi } from "@/lib/pi";
import type {
  DashboardOverview,
  PlantsOverview,
} from "@/server/services/dashboard.service";

// Single-bed deployment (matches ScheduleReminder / the /schedule page).
export const BED_ID = 1;

// DB-derived metrics (plants, ripeness, watering, weekly trend).
export function useDashboardOverview() {
  return useQuery<DashboardOverview>({
    queryKey: ["dashboard", "overview", BED_ID],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/overview?bedId=${BED_ID}`);
      if (!res.ok) throw new Error("Failed to load dashboard overview");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

// DB-derived "All Plants" page data — per-bed cards, monthly harvest, totals.
export function usePlantsOverview() {
  return useQuery<PlantsOverview>({
    queryKey: ["dashboard", "plants"],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/plants`);
      if (!res.ok) throw new Error("Failed to load plants overview");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

// Live ambient readings straight from the RPi (standalone ESP32). With stub
// mode on (default), piApi substitutes constant "normal" readings when the Pi
// or its sensor board returns nothing, so cards show a plausible state instead
// of erroring. Disable via NEXT_PUBLIC_SENSOR_STUB="false".
export function useAmbient() {
  return useQuery({
    queryKey: ["dashboard", "ambient"],
    queryFn: async () => {
      const [env, light] = await Promise.all([
        piApi.getEnvironment(),
        piApi.getLight(),
      ]);
      return { ...env, ...light };
    },
    refetchInterval: 30_000,
    retry: 1,
  });
}
