"use client";

import { Bar, BarChart, Cell, XAxis, Tooltip, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Maximize2, RefreshCw } from "lucide-react";

const TARGET = 60;

const harvestData = [
  { week: "W1", value: 52 },
  { week: "W2", value: 61 },
  { week: "W3", value: 47 },
  { week: "W4", value: 65 },
  { week: "W5", value: 58 },
  { week: "W6", value: 70 },
  { week: "W8", value: 65 },
  { week: "W9", value: 59 },
  { week: "W10", value: 56 },
];

const lastWeek = harvestData[harvestData.length - 1].value;
const prevWeek = harvestData[harvestData.length - 2].value;
const delta = +(lastWeek - prevWeek).toFixed(1);
const total = Math.round(harvestData.reduce((a, b) => a + b.value, 0));
const avg = +(total / harvestData.length).toFixed(1);
const best = Math.max(...harvestData.map((d) => d.value));
const progressPct = Math.min(100, Math.round((lastWeek / TARGET) * 100));

const chartConfig = {
  value: {
    label: "Yield (kg)",
    color: "#639922",
  },
} satisfies ChartConfig;

export default function WeeklyYield() {
  return (
    <Card className="w-full gap-3">
      <CardHeader className="">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-semibold">Weekly Harvest Yield </p>
            <p className="text-muted-foreground text-[10px]">
              Last session 4 days ago
            </p>
          </div>
          <div className="flex gap-1.5">
            <button className="hover:bg-muted rounded-lg p-1.5 transition-colors">
              <Maximize2 className="text-muted-foreground size-3.5" />
            </button>
            <button className="hover:bg-muted rounded-lg p-1.5 transition-colors">
              <RefreshCw className="text-muted-foreground size-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: "This week",
              value: lastWeek,
              unit: "kg",
              sub: `${delta >= 0 ? "+" : ""}${delta} kg`,
              subColor: delta >= 0 ? "text-green-600" : "text-red-500",
            },
            { label: "Weekly avg", value: avg, unit: "kg" },
            { label: "Season best", value: best, unit: "kg" },
          ].map((m) => (
            <div key={m.label} className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground mb-1 text-[11px]">
                {m.label}
              </p>
              <p className="text-[20px] leading-none font-medium">
                {m.value}
                <span className="text-muted-foreground text-[11px] font-normal">
                  {" "}
                  {m.unit}
                </span>
              </p>
              {m.sub && (
                <p className={`mt-1 text-[11px] ${m.subColor}`}>{m.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <ChartContainer config={chartConfig} className="h-68 w-full">
          <BarChart
            data={harvestData}
            margin={{ top: 10, right: 0, bottom: 0, left: 0 }}
          >
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              tickMargin={6}
            />
            <ReferenceLine
              y={TARGET}
              stroke="#C0DD97"
              strokeDasharray="3 3"
              strokeWidth={1.5}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-background border-border rounded-md border px-2 py-1 text-xs shadow-sm">
                    <span className="text-muted-foreground">
                      {payload[0].payload.week}:
                    </span>{" "}
                    <span className="font-medium">{payload[0].value} kg</span>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {harvestData.map((entry, i) => {
                const isLast = i === harvestData.length - 1;
                const meetsTarget = entry.value >= TARGET;
                return (
                  <Cell
                    key={i}
                    fill={
                      isLast ? "#639922" : meetsTarget ? "#97C459" : "#C0DD97"
                    }
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Footer */}
        {/* <div className="border-t pt-3">
          <div className="flex justify-between">
            {[
              { label: "Total", value: `${total} kg` },
              { label: "Trees", value: "50" },
              { label: "Target", value: `${TARGET} kg/wk` },
            ].map((f) => (
              <div key={f.label} className="text-center">
                <p className="text-muted-foreground text-[11px]">{f.label}</p>
                <p className="text-[12px] font-medium">{f.value}</p>
              </div>
            ))}
          </div>
        </div> */}
      </CardContent>
    </Card>
  );
}
