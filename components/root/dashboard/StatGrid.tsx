"use client";

import { Card } from "@/components/ui/card";
import { Leaf, Grid2x2, Thermometer, Sun } from "lucide-react";
import { useAmbient, useDashboardOverview } from "./hooks";

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  unit?: string;
  loading?: boolean;
}) {
  return (
    <Card className="flex flex-col gap-1 border-none p-4 shadow-none">
      <div className="flex max-w-[80%] items-center gap-2">
        <div className="bg-muted flex items-center justify-center rounded-full p-3">
          <Icon className="size-5 text-green-700" />
        </div>
        <p className="text-base leading-tight font-medium">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-medium">
        {loading ? (
          <span className="bg-muted inline-block h-7 w-20 animate-pulse rounded" />
        ) : (
          value
        )}{" "}
        {unit && (
          <span className="text-muted-foreground text-sm font-normal">
            {unit}
          </span>
        )}
      </p>
    </Card>
  );
}

export default function StatGrid() {
  const { data, isLoading } = useDashboardOverview();
  const {
    data: ambient,
    isLoading: ambientLoading,
    isError: ambientError,
  } = useAmbient();

  const grid =
    data?.bed != null ? `${data.bed.rows}×${data.bed.cols} grid` : undefined;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <StatCard
        icon={Leaf}
        label="Total Tree Planted"
        loading={isLoading}
        value={data?.plantCount ?? 0}
        unit="Chili Trees"
      />
      <StatCard
        icon={Grid2x2}
        label="Active Planting Area"
        loading={isLoading}
        value={data?.bedCount ?? 0}
        unit={grid ? `Planter Bed · ${grid}` : "Planter Bed"}
      />
      <StatCard
        icon={Sun}
        label="Lighting Level"
        loading={ambientLoading}
        value={ambientError || ambient == null ? "—" : Math.round(ambient.lux)}
        unit={ambientError ? "Sensor offline" : "lux · Ambient"}
      />
      <StatCard
        icon={Thermometer}
        label="Environment Temperature"
        loading={ambientLoading}
        value={
          ambientError || ambient == null ? "—" : `${ambient.temperature_c}°C`
        }
        unit={
          ambientError
            ? "Sensor offline"
            : ambient
              ? `${ambient.humidity_pct}% RH`
              : "Ambient"
        }
      />
    </div>
  );
}
