"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type SessionType } from "@/server/validators/session.validator";

type DayRange = "7" | "14" | "30";

const chartConfig = {
  ripe: { label: "Ripe", color: "#22c55e" },
  turning: { label: "Turning", color: "#f59e0b" },
  unripe: { label: "Unripe", color: "#38bdf8" },
  broken: { label: "Broken", color: "#ef4444" },
} satisfies ChartConfig;

interface DayEntry {
  date: string;
  ripe: number;
  turning: number;
  unripe: number;
  broken: number;
}

function groupByDay(sessions: SessionType[], days: number): DayEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);

  const map = new Map<string, DayEntry>();
  for (let i = 0; i < days; i++) {
    const d = new Date(cutoff);
    d.setDate(cutoff.getDate() + i);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    map.set(key, { date: key, ripe: 0, turning: 0, unripe: 0, broken: 0 });
  }

  for (const s of sessions) {
    const d = new Date(s.createdAt);
    if (d < cutoff) continue;
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    const entry = map.get(key);
    if (!entry) continue;
    entry.ripe += s.totalRipe ?? 0;
    entry.turning += s.totalTurning ?? 0;
    entry.unripe += s.totalUnripe ?? 0;
    entry.broken += s.totalDamaged ?? 0;
  }

  return Array.from(map.values());
}

export default function ScanningResultChart() {
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [range, setRange] = useState<DayRange>("7");

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then(setSessions)
      .catch(() => {});
  }, []);

  const data = groupByDay(sessions, Number(range));

  return (
    <Card className="flex-2">
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-3 pb-2">
        <CardTitle className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
          Scanning Results
        </CardTitle>
        <Select value={range} onValueChange={(v) => setRange(v as DayRange)}>
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pb-3">
        <ChartContainer config={chartConfig} className="h-44 w-full">
          <BarChart data={data} margin={{ left: -16, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="ripe"
              stackId="a"
              fill="var(--color-ripe)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="turning"
              stackId="a"
              fill="var(--color-turning)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="unripe"
              stackId="a"
              fill="var(--color-unripe)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="broken"
              stackId="a"
              fill="var(--color-broken)"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
