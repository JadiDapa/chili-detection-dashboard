"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Thermometer, Wind, Sun, Droplets, Sprout, Gauge } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  piApi,
  type SoilSensorData,
  type EnvironmentData,
  type LightData,
} from "@/lib/pi";
import { cn } from "@/lib/utils";

const SENSOR_LINE_COLORS = ["#10b981", "#0ea5e9", "#f59e0b"] as const;

const FALLBACK_SENSORS = [
  { id: 1, label: "Sensor 1", moisture_pct: 0 },
  { id: 2, label: "Sensor 2", moisture_pct: 0 },
  { id: 3, label: "Sensor 3", moisture_pct: 0 },
];

// Rolling window of readings kept for the moisture trend chart.
const MAX_HISTORY_POINTS = 30;

type MoistureHistoryPoint = {
  time: string;
  [sensorKey: string]: string | number;
};

export default function SectionOverviewStats() {
  const [soil, setSoil] = useState<SoilSensorData | null>(null);
  const [env, setEnv] = useState<EnvironmentData | null>(null);
  const [light, setLight] = useState<LightData | null>(null);
  const [history, setHistory] = useState<MoistureHistoryPoint[]>([]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const soilData = await piApi.getSoilSensors();
        setSoil(soilData);

        const point: MoistureHistoryPoint = {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        };

        soilData.sensors.forEach((sensor) => {
          point[`sensor${sensor.id}`] = sensor.moisture_pct;
        });

        setHistory((prev) => [...prev, point].slice(-MAX_HISTORY_POINTS));
      } catch {}

      try {
        setEnv(await piApi.getEnvironment());
      } catch {}

      try {
        setLight(await piApi.getLight());
      } catch {}
    }

    fetchAll();

    const id = setInterval(fetchAll, 5000);

    return () => clearInterval(id);
  }, []);

  const sensors = soil?.sensors ?? FALLBACK_SENSORS;

  const averageMoisture = useMemo(() => {
    if (!sensors.length) return 0;

    return Math.round(
      sensors.reduce((acc, item) => acc + item.moisture_pct, 0) /
        sensors.length,
    );
  }, [sensors]);

  const chartConfig = useMemo<ChartConfig>(() => {
    return sensors.reduce<ChartConfig>((config, sensor, i) => {
      config[`sensor${sensor.id}`] = {
        label: sensor.label,
        color: SENSOR_LINE_COLORS[i % SENSOR_LINE_COLORS.length],
      };
      return config;
    }, {});
  }, [sensors]);

  // Each bar's fill is the reading normalized against a sensible max for its unit.
  const environmentMetrics = useMemo(() => {
    const clampPct = (value: number, max: number) =>
      Math.max(0, Math.min(100, (value / max) * 100));

    return [
      {
        label: "Temperature",
        icon: Thermometer,
        iconColor: "text-orange-400",
        display: env ? `${env.temperature_c}°C` : "—",
        fillPct: env ? clampPct(env.temperature_c, 50) : 0,
      },
      {
        label: "Humidity",
        icon: Droplets,
        iconColor: "text-sky-400",
        display: env ? `${env.humidity_pct}%` : "—",
        fillPct: env ? clampPct(env.humidity_pct, 100) : 0,
      },
      {
        label: "Lighting",
        icon: Sun,
        iconColor: "text-yellow-400",
        display: light ? `${light.lux} lux` : "—",
        fillPct: light ? clampPct(light.lux, 2000) : 0,
      },
      {
        label: "Fan Speed",
        icon: Wind,
        iconColor: "text-zinc-400",
        display: env ? `${env.exhaust_fan_speed_pct}%` : "—",
        fillPct: env ? clampPct(env.exhaust_fan_speed_pct, 100) : 0,
      },
    ];
  }, [env, light]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      {/* LEFT - SOIL SECTION */}
      <Card className="border-border/60 from-background to-muted/20 overflow-hidden border bg-linear-to-br shadow-sm">
        <CardContent className="p-5">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Sprout className="h-4.5 w-4.5 text-emerald-500" />
                </div>

                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                    Soil Monitoring
                  </p>

                  <h3 className="text-lg font-semibold tracking-tight">
                    Moisture Sensors
                  </h3>
                </div>
              </div>
            </div>

            <div className="gap-6 px-4 text-right">
              <div className="flex items-end justify-end gap-1">
                <span className="text-2xl font-semibold tabular-nums">
                  {averageMoisture}
                </span>

                <span className="text-muted-foreground mb-1 text-xs">%</span>
              </div>
              <p className="text-xs font-semibold tracking-widest text-emerald-600 uppercase">
                Average
              </p>
            </div>
          </div>

          {/* Current readings */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            {sensors.map((sensor, i) => (
              <div
                key={sensor.id}
                className="border-border/50 rounded-lg p-3 backdrop-blur"
              >
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-semibold tabular-nums">
                    {sensor.moisture_pct}
                  </span>
                  <span className="text-muted-foreground mb-1 text-xs">%</span>
                </div>
                <div className="mb-1 flex items-center gap-1.5">
                  {/* <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        SENSOR_LINE_COLORS[i % SENSOR_LINE_COLORS.length],
                    }}
                  /> */}
                  <p className="text-muted-foreground truncate text-xs font-medium">
                    {sensor.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Moisture trend */}
          <div className="border-border/50 bg-background/60 rounded-lg border p-4 backdrop-blur">
            <p className="text-muted-foreground mb-3 text-xs font-medium">
              Moisture trend (live)
            </p>

            <ChartContainer config={chartConfig} className="h-50 w-full">
              <LineChart
                accessibilityLayer
                data={history}
                margin={{ left: 4, right: 12, top: 4 }}
              >
                <CartesianGrid vertical={false} />

                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />

                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={32}
                  tickFormatter={(value) => `${value}%`}
                />

                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />

                {sensors.map((sensor) => (
                  <Line
                    key={sensor.id}
                    dataKey={`sensor${sensor.id}`}
                    type="monotone"
                    stroke={`var(--color-sensor${sensor.id})`}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}

                <ChartLegend content={<ChartLegendContent />} />
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* RIGHT SIDE */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {/* ENVIRONMENT */}
        <Card className="border-border/60 from-background to-muted/20 border bg-linear-to-br shadow-sm">
          <CardContent className="p-5">
            <div className="mb-7 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
                <Gauge className="h-4.5 w-4.5 text-orange-500" />
              </div>

              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                  Environment
                </p>

                <h3 className="text-lg font-semibold tracking-tight">
                  Monitoring
                </h3>
              </div>
            </div>

            {/* Hero stats */}
            <div className="mb-5 grid grid-cols-3 gap-3">
              <div className="border-border/50 rounded-lg p-3 backdrop-blur">
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-semibold tabular-nums">
                    {env?.temperature_c ?? "—"}
                  </span>
                  <span className="text-muted-foreground mb-1 text-xs">°C</span>
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Temperature
                </p>
              </div>

              <div className="border-border/50 rounded-lg p-3 backdrop-blur">
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-semibold tabular-nums">
                    {env?.humidity_pct ?? "—"}
                  </span>
                  <span className="text-muted-foreground mb-1 text-xs">%</span>
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">Humidity</p>
              </div>

              <div className="border-border/50 rounded-lg p-3 backdrop-blur">
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-semibold tabular-nums">
                    {light?.lux ?? "—"}
                  </span>
                  <span className="text-muted-foreground mb-1 text-xs">
                    lux
                  </span>
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">Lighting</p>
              </div>
            </div>

            {/* Metric bars */}
            <div className="border-border/50 bg-background/60 space-y-7.5 rounded-lg border p-4 backdrop-blur">
              {environmentMetrics.map((metric) => (
                <div key={metric.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <metric.icon
                        className={cn("h-4 w-4", metric.iconColor)}
                      />
                      <span className="text-sm font-medium">
                        {metric.label}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-sm font-medium tabular-nums">
                      {metric.display}
                    </span>
                  </div>

                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-700"
                      style={{ width: `${metric.fillPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
