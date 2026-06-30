"use client";

import { PlanterBedCard } from "@/components/root/plants/PlanterBedCard";
import { usePlantsOverview } from "@/components/root/dashboard/hooks";

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  return `${Math.round(hrs / 24)} day${Math.round(hrs / 24) === 1 ? "" : "s"} ago`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Slugify the bed name for the detail route (e.g. "Planter Bed 01").
function bedLink(id: number, name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `/plants/${slug || `bed-${id}`}`;
}

export default function PlanterBedList() {
  const { data, isLoading } = usePlantsOverview();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="bg-muted/50 h-56 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  const beds = data?.beds ?? [];

  if (beds.length === 0) {
    return (
      <div className="bg-muted/50 flex h-40 items-center justify-center rounded-2xl">
        <p className="text-muted-foreground text-sm">
          No planter beds configured yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {beds.map((bed) => (
        <PlanterBedCard
          key={bed.id}
          bedId={bed.id}
          label={bed.name}
          streamUrl={bed.streamUrl}
          status={bed.status}
          lastScan={timeAgo(bed.lastScanAt)}
          soilMoisture={bed.soilMoisture ?? 0}
          lastHarvest={{
            count: bed.lastHarvest.count,
            date: formatDate(bed.lastHarvest.date),
          }}
          scanResult={bed.scanResult}
          link={bedLink(bed.id, bed.name)}
        />
      ))}
    </div>
  );
}
