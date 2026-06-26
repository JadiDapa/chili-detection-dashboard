"use client";

import { Sprout } from "lucide-react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { usePlantsOverview } from "@/components/root/dashboard/hooks";

const chartConfig = {
  ready: {
    label: "Harvest-ready",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function RadialChart() {
  const { data } = usePlantsOverview();
  const ready = data?.harvestReady ?? 0;
  const total = data?.totalPlants ?? 0;
  const pct = total ? Math.round((ready / total) * 100) : 0;

  // Domain max guards the divide-by-zero case so the bar still renders.
  const chartData = [{ key: "ready", ready, fill: "var(--color-ready)" }];

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Harvest Readiness</CardTitle>
        <CardDescription>Plants with ripe fruit ready to pick</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={220}
            endAngle={-40}
            outerRadius={90}
            innerRadius={80}
            cx="50%"
            cy="50%"
          >
            <PolarRadiusAxis
              type="number"
              domain={[0, Math.max(total, 1)]}
              tick={false}
              tickLine={false}
              axisLine={false}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          style={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            fill: "currentColor",
                          }}
                        >
                          {ready}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 28}
                          style={{ fontSize: "0.875rem", fill: "gray" }}
                        >
                          of {total} plants
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[90, 80]}
            />
            <RadialBar dataKey="ready" background cornerRadius={10} />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {pct}% of the bed ready to harvest <Sprout className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Based on the latest ripeness scan per plant
        </div>
      </CardFooter>
    </Card>
  );
}
