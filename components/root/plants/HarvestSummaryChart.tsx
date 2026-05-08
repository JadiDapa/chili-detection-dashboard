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

const chartData = [
  { month: "09", desktop: 186, mobile: 80 },
  { month: "10", desktop: 305, mobile: 200 },
  { month: "11", desktop: 237, mobile: 120 },
  { month: "12", desktop: 73, mobile: 190 },
  { month: "01", desktop: 209, mobile: 130 },
  { month: "02", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Ripe",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Unripe",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function HarvestSummaryChart() {
  return (
    <Card className="border-none p-4 shadow-none">
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
            dataKey="desktop"
            stackId="a"
            fill="var(--color-desktop)"
            radius={[0, 0, 4, 4]}
          />
          <Bar
            dataKey="mobile"
            stackId="a"
            fill="var(--color-mobile)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </Card>
  );
}
