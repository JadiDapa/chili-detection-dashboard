"use client";

import { Bar, BarChart, Cell, XAxis, Tooltip, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { RefreshCw } from "lucide-react";
import { useDashboardOverview } from "./hooks";

// Ripe-fruit count that marks a "good harvest week" — the dashed reference line.
const TARGET = 20;

const chartConfig = {
  value: {
    label: "Ripe fruits",
    color: "#639922",
  },
} satisfies ChartConfig;

export default function WeeklyYield() {
  const { data, isFetching, refetch } = useDashboardOverview();
  const harvestData = data?.weeklyRipe ?? [];

  const lastWeek = harvestData.at(-1)?.value ?? 0;
  const prevWeek = harvestData.at(-2)?.value ?? 0;
  const delta = +(lastWeek - prevWeek).toFixed(0);
  const total = harvestData.reduce((a, b) => a + b.value, 0);
  const avg = harvestData.length ? +(total / harvestData.length).toFixed(0) : 0;
  const best = harvestData.length
    ? Math.max(...harvestData.map((d) => d.value))
    : 0;

  return (
    <Card className="w-full gap-3 border-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-semibold">Weekly Ripe Detections</p>
            <p className="text-muted-foreground text-[10px]">
              {data?.lastScanAt
                ? `Last scan ${new Date(data.lastScanAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                : "No completed scans yet"}
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
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: "This week",
              value: lastWeek,
              unit: "fruits",
              sub:
                harvestData.length > 1
                  ? `${delta >= 0 ? "+" : ""}${delta}`
                  : undefined,
              subColor: delta >= 0 ? "text-green-600" : "text-red-500",
            },
            { label: "Weekly avg", value: avg, unit: "fruits" },
            { label: "Best week", value: best, unit: "fruits" },
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
        {harvestData.length === 0 ? (
          <div className="bg-muted/50 flex h-68 items-center justify-center rounded-lg">
            <p className="text-muted-foreground text-xs">
              Complete a scan session to see ripe-fruit trends.
            </p>
          </div>
        ) : (
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
                      <span className="font-medium">
                        {payload[0].value} fruits
                      </span>
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
        )}
      </CardContent>
    </Card>
  );
}
