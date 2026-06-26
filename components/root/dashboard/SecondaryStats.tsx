"use client";

import { Ruler, Droplet, ShoppingBasket } from "lucide-react";
import SmallStatCard from "./SmallStatCard";
import { useDashboardOverview } from "./hooks";

function fmt(n: number | null | undefined, suffix = "") {
  return n == null ? "—" : `${n}${suffix}`;
}

export default function SecondaryStats() {
  const { data } = useDashboardOverview();

  const total = data?.plantCount ?? 0;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <SmallStatCard
        icon={Ruler}
        label="Avg Plant Height"
        value={fmt(data?.avgHeightCm, " cm")}
        unit="Latest sweep"
        desc="Mean canopy height measured by the gantry TOF sensor."
      />
      <SmallStatCard
        icon={Droplet}
        label="Avg Soil Moisture"
        value={fmt(data?.avgMoisturePct, "%")}
        unit="Latest watering"
        desc="Average of the bed's capacitive soil moisture sensors."
      />
      <SmallStatCard
        icon={ShoppingBasket}
        label="Harvest-Ready"
        value={`${data?.harvestReady ?? 0}`}
        unit={`of ${total} plants`}
        desc="Plants with enough ripe fruit detected to pick now."
      />
    </div>
  );
}
