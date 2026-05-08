"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "A mixed bar chart";

const chartData = [
  { browser: "unripe", fruits: 275, fill: "var(--color-unripe)" },
  { browser: "turning", fruits: 200, fill: "var(--color-turning)" },
  { browser: "ripe", fruits: 187, fill: "var(--color-ripe)" },
  { browser: "broken", fruits: 173, fill: "var(--color-broken)" },
];

const chartConfig = {
  fruits: {
    label: "Fruits",
  },
  unripe: {
    label: "Unripe",
    color: "var(--chart-1)",
  },
  turning: {
    label: "Turning",
    color: "var(--chart-2)",
  },
  ripe: {
    label: "Unripe",
    color: "var(--chart-3)",
  },
  broken: {
    label: "Broken",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function FruitRipenessChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Bar Chart - Mixed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="browser"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) =>
                chartConfig[value as keyof typeof chartConfig]?.label
              }
            />
            <XAxis dataKey="fruits" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="fruits" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
