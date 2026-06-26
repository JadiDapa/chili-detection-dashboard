"use client";

import { Card } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { usePlantsOverview } from "@/components/root/dashboard/hooks";

const chartConfig = {
  ripe: {
    label: "Ripe",
    color: "var(--chart-1)",
  },
  unripe: {
    label: "Unripe",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function HarvestSummaryChart() {
  const { data } = usePlantsOverview();
  const chartData = data?.monthly ?? [];

  return (
    <Card className="border-none p-4 shadow-none">
      <p className="mb-2 text-sm font-semibold">Monthly Detection Summary</p>
      {chartData.length === 0 ? (
        <div className="bg-muted/50 flex h-63 items-center justify-center rounded-lg">
          <p className="text-muted-foreground text-xs">
            Complete a scan session to see monthly detections.
          </p>
        </div>
      ) : (
        <ChartContainer className="h-63" config={chartConfig}>
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />

            <Bar
              dataKey="ripe"
              stackId="a"
              fill="var(--color-ripe)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="unripe"
              stackId="a"
              fill="var(--color-unripe)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </Card>
  );
}
