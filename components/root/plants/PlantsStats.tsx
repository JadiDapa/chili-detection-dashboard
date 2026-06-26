"use client";

import { Card } from "@/components/ui/card";
import { Leaf, ShoppingBasket } from "lucide-react";
import { usePlantsOverview } from "@/components/root/dashboard/hooks";

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
  unit: string;
  loading?: boolean;
}) {
  return (
    <Card className="w-full border-none p-4 shadow-none">
      <div className="flex items-center gap-3">
        <div className="bg-muted rounded-full p-3">
          <Icon className="size-5 text-green-700" />
        </div>
        <p className="font-medium">{label}</p>
      </div>
      <p className="text-3xl font-medium">
        {loading ? (
          <span className="bg-muted inline-block h-7 w-16 animate-pulse rounded" />
        ) : (
          value
        )}{" "}
        <span className="text-muted-foreground text-sm">{unit}</span>
      </p>
    </Card>
  );
}

export default function PlantsStats() {
  const { data, isLoading } = usePlantsOverview();

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <StatCard
        icon={Leaf}
        label="Total Tree Planted"
        loading={isLoading}
        value={data?.totalPlants ?? 0}
        unit="Chili Trees"
      />
      <StatCard
        icon={ShoppingBasket}
        label="Total Ripe Detected"
        loading={isLoading}
        value={data?.totalRipeAllTime ?? 0}
        unit="Fruits"
      />
    </div>
  );
}
