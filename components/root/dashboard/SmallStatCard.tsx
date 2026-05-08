import { Card } from "@/components/ui/card";
import React from "react";

export default function SmallStatCard({
  icon: Icon,
  label,
  value,
  unit,
  desc,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  desc?: string;
}) {
  return (
    <Card className="flex flex-col gap-1 border-none p-4 shadow-none">
      <Icon className="size-5 text-green-700" />
      <p className="text-base leading-tight font-medium">{label}</p>
      <p className="mt-6 text-3xl font-medium">
        {value}{" "}
        <span className="text-muted-foreground text-sm font-normal">
          {unit}
        </span>
      </p>
      <p className="text-muted-foreground text-xs">{desc}</p>
    </Card>
  );
}
