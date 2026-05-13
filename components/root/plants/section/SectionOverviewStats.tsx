"use client";

import { useEffect, useMemo, useState } from "react";
import { Thermometer, Wind, Sun, Droplets, Sprout, Gauge } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  piApi,
  type SoilSensorData,
  type EnvironmentData,
  type LightData,
} from "@/lib/pi";
import { cn } from "@/lib/utils";

const SENSOR_COLORS = [
  "from-emerald-400 to-emerald-600",
  "from-sky-400 to-sky-600",
  "from-amber-400 to-amber-600",
] as const;

const FALLBACK_SENSORS = [
  { id: 1, label: "Sensor 1", moisture_pct: 0 },
  { id: 2, label: "Sensor 2", moisture_pct: 0 },
  { id: 3, label: "Sensor 3", moisture_pct: 0 },
];

function getMoistureStatus(value: number) {
  if (value < 30)
    return {
      label: "Dry",
      color: "text-red-500",
    };

  if (value < 70)
    return {
      label: "Optimal",
      color: "text-emerald-500",
    };

  return {
    label: "Wet",
    color: "text-sky-500",
  };
}

export default function SectionOverviewStats() {
  const [soil, setSoil] = useState<SoilSensorData | null>(null);
  const [env, setEnv] = useState<EnvironmentData | null>(null);
  const [light, setLight] = useState<LightData | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        setSoil(await piApi.getSoilSensors());
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

            <div className="flex gap-6 rounded-2xl border border-emerald-500/15 bg-emerald-500/10 px-4 py-2 text-right">
              <p className="text-[10px] font-semibold tracking-widest text-emerald-600 uppercase">
                Average
              </p>

              <div className="flex items-end justify-end gap-1">
                <span className="text-2xl font-black tabular-nums">
                  {averageMoisture}
                </span>

                <span className="text-muted-foreground mb-1 text-xs">%</span>
              </div>
            </div>
          </div>

          {/* Sensors */}
          <div className="space-y-4">
            {sensors.map((sensor, i) => {
              const status = getMoistureStatus(sensor.moisture_pct);

              return (
                <div
                  key={sensor.id}
                  className="border-border/50 bg-background/60 rounded-2xl border p-4 backdrop-blur"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{sensor.label}</p>

                      <p className={cn("text-xs font-medium", status.color)}>
                        {status.label}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black tabular-nums">
                        {sensor.moisture_pct}
                      </span>

                      <span className="text-muted-foreground ml-1 text-xs">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted relative h-3 overflow-hidden rounded-full">
                    <div
                      className={cn(
                        "h-full rounded-full bg-linear-to-r transition-all duration-700",
                        SENSOR_COLORS[i % SENSOR_COLORS.length],
                      )}
                      style={{
                        width: `${sensor.moisture_pct}%`,
                      }}
                    />

                    <div className="absolute inset-0 bg-[linear-linear(to_right,transparent,rgba(255,255,255,0.18),transparent)]" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* RIGHT SIDE */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {/* ENVIRONMENT */}
        <Card className="border-border/60 from-background to-muted/20 border bg-linear-to-br shadow-sm">
          <CardContent className="p-5">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
                <Gauge className="h-4.5 w-4.5 text-orange-500" />
              </div>

              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                  Greenhouse
                </p>

                <h3 className="text-lg font-semibold tracking-tight">
                  Environment
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border-border/50 bg-background/70 rounded-2xl border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-orange-400" />
                  <span className="text-muted-foreground text-xs font-medium">
                    Temperature
                  </span>
                </div>

                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black tabular-nums">
                    {env?.temperature_c ?? "—"}
                  </span>

                  <span className="text-muted-foreground mb-1 text-xs">°C</span>
                </div>
              </div>

              <div className="border-border/50 bg-background/70 rounded-2xl border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-sky-400" />
                  <span className="text-muted-foreground text-xs font-medium">
                    Humidity
                  </span>
                </div>

                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black tabular-nums">
                    {env?.humidity_pct ?? "—"}
                  </span>

                  <span className="text-muted-foreground mb-1 text-xs">%</span>
                </div>
              </div>

              <div className="border-border/50 bg-background/70 rounded-2xl border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Sun className="h-4 w-4 text-yellow-400" />
                  <span className="text-muted-foreground text-xs font-medium">
                    Lighting
                  </span>
                </div>

                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black tabular-nums">
                    {light?.lux ?? "—"}
                  </span>

                  <span className="text-muted-foreground mb-1 text-xs">
                    lux
                  </span>
                </div>
              </div>

              <div className="border-border/50 bg-background/70 rounded-2xl border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Wind className="h-4 w-4 text-zinc-400" />
                  <span className="text-muted-foreground text-xs font-medium">
                    Fan Speed
                  </span>
                </div>

                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black tabular-nums">
                    {env?.exhaust_fan_speed_pct ?? "—"}
                  </span>

                  <span className="text-muted-foreground mb-1 text-xs">%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
