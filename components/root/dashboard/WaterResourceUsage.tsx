"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RefreshCw } from "lucide-react";
import { useDashboardOverview } from "./hooks";

function timeAgo(iso: string | null): string {
  if (!iso) return "no watering sessions yet";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

export default function WaterResourceUsage() {
  const { data, isFetching, refetch } = useDashboardOverview();
  const w = data?.water;

  // Optimal soil moisture target — the "Optimized" end of the bar.
  const TARGET_MOISTURE = 70;
  const moisture = w?.moistureAfterAvg ?? data?.avgMoisturePct ?? 0;
  const activeSegments = Math.max(
    0,
    Math.min(100, Math.round((moisture / TARGET_MOISTURE) * 100)),
  );

  const gain =
    w?.moistureAfterAvg != null && w?.moistureBeforeAvg != null
      ? +(w.moistureAfterAvg - w.moistureBeforeAvg).toFixed(1)
      : null;

  const stats = [
    {
      label: "Water Time (last)",
      value: w?.lastWaterSec != null ? `${w.lastWaterSec}s` : "—",
    },
    {
      label: "Soil Moisture",
      value: moisture ? `${Math.round(moisture)}%` : "—",
    },
    {
      label: "Moisture Gain",
      value: gain != null ? `${gain >= 0 ? "+" : ""}${gain}%` : "—",
    },
  ];

  return (
    <Card className="border-none p-3 shadow-none">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-semibold">Irrigation Summary</p>
          <p className="text-muted-foreground text-[10px]">
            Last watering {timeAgo(w?.lastWateredAt ?? null)}
            {w?.sessionCount ? ` · ${w.sessionCount} sessions total` : ""}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => refetch()}
            className="hover:bg-muted rounded-lg p-1.5 transition-colors"
          >
            <RefreshCw
              className={`text-muted-foreground size-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>
      <div className="bg-muted rounded-lg px-4 py-6">
        <div className="mb-3 grid grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-semibold">{stat.value}</p>
              <p className="text-muted-foreground text-[10px]">{stat.label}</p>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <div className="text-muted-foreground mb-1 flex justify-between text-sm">
          <span>Dry</span>
          <span>Optimal</span>
        </div>
        {/* Segmented soil-moisture gauge (current avg vs. target) */}
        <div className="flex h-10 gap-0.5 rounded-full p-0.5">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm ${i < activeSegments ? "bg-green-700" : "bg-muted-foreground/20"}`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
