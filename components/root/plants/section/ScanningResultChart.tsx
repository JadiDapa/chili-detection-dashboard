"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Leaf, Sprout, Sparkles, CalendarClock } from "lucide-react";
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { type SessionType } from "@/server/validators/session.validator";
import { CaptureImage } from "./CaptureImage";
import { CaptureDetailDialog } from "./CaptureDetailDialog";

type DayRange = "7" | "14" | "30";

// A tree counts as ready-to-harvest once it has more than this many ripe fruits.
const HARVEST_RIPE_THRESHOLD = 5;
// Fallback grid when a session has no scan-config snapshot to read rows/cols from.
const FALLBACK_ROWS = 3;
const FALLBACK_COLS = 9;

type Capture = SessionType["captures"][number];
type FruitClass = "Ripe" | "Unripe" | "Turning" | "Broken";

const CLASS_DOT_COLOR: Record<FruitClass, string> = {
  Ripe: "bg-emerald-500",
  Unripe: "bg-sky-500",
  Turning: "bg-amber-500",
  Broken: "bg-red-500",
};

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

// Read rows/cols from the session's frozen scan-config snapshot, falling back to
// a 3×9 grid when no usable snapshot exists.
function gridDims(session: SessionType | null): { rows: number; cols: number } {
  const snap = session?.scanConfigSnapshot as
    | { rows?: number; cols?: number }
    | null
    | undefined;
  if (
    snap &&
    typeof snap.rows === "number" &&
    typeof snap.cols === "number" &&
    snap.rows > 0 &&
    snap.cols > 0
  ) {
    return { rows: snap.rows, cols: snap.cols };
  }
  return { rows: FALLBACK_ROWS, cols: FALLBACK_COLS };
}

function formatSessionDate(session: SessionType): string {
  const iso = session.startedAt ?? session.createdAt;
  return new Date(iso).toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Hover card mirroring the session-detail capture card ──────────────────────

function CaptureHoverCard({ capture }: { capture: Capture }) {
  const classes: Record<FruitClass, number> = {
    Ripe: capture.ripeCount,
    Unripe: capture.unripeCount,
    Turning: capture.turningCount,
    Broken: capture.brokenCount,
  };

  return (
    <div className="bg-muted flex items-start gap-1 overflow-hidden rounded-lg">
      <CaptureImage
        plantId={capture.plantIndex ?? "?"}
        rawUrl={capture.imageUrl || null}
        annotatedUrl={capture.annotatedImageUrl || null}
      />
      <div className="flex w-full flex-col gap-1 p-2">
        <div className="flex w-full items-center justify-between border-b pb-1">
          <span className="text-xs text-zinc-500">Total</span>
          <span className="text-primary text-sm font-bold">
            {capture.totalFruits}
          </span>
        </div>
        {(Object.entries(classes) as [FruitClass, number][]).map(
          ([label, count]) => (
            <div
              key={label}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    CLASS_DOT_COLOR[label],
                  )}
                />
                <span className="text-xs text-zinc-400">{label}</span>
              </div>
              <span className="text-foreground text-xs font-semibold">
                {count}
              </span>
            </div>
          ),
        )}
        {capture.heightCm != null && (
          <div className="mt-1 flex items-center justify-between border-t pt-1">
            <span className="text-[10px] text-zinc-500">Height</span>
            <span className="text-[10px] text-zinc-400">
              {capture.heightCm} cm
            </span>
          </div>
        )}
        {capture.moisturePct != null && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Moisture</span>
            <span className="text-[10px] text-zinc-400">
              {capture.moisturePct}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Per-plant grid box ────────────────────────────────────────────────────────

function PlantBox({
  plantNo,
  capture,
}: {
  plantNo: number;
  capture: Capture | null;
}) {
  if (!capture) {
    return (
      <div className="border-border/40 bg-muted/30 relative flex aspect-square items-center justify-center rounded-lg border border-dashed">
        <span className="absolute top-1 left-1.5 text-[8px] font-medium text-zinc-500">
          {String(plantNo).padStart(2, "0")}
        </span>
        <span className="text-sm text-zinc-600">—</span>
      </div>
    );
  }

  const isReady = capture.ripeCount > HARVEST_RIPE_THRESHOLD;

  return (
    <HoverCard openDelay={80} closeDelay={40}>
      <CaptureDetailDialog capture={capture} isReady={isReady}>
        <HoverCardTrigger asChild>
          <div
            className={cn(
              "relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border pb-3 transition-colors",
              isReady
                ? "border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/15"
                : "border-border/60 bg-muted hover:bg-muted/70",
            )}
          >
            <span className="absolute top-1 left-1.5 text-[8px] font-medium text-zinc-500">
              {String(plantNo).padStart(2, "0")}
            </span>

            <span
              className={cn(
                "text-lg leading-none font-bold tabular-nums",
                isReady ? "text-emerald-600" : "text-foreground",
              )}
            >
              {capture.ripeCount}
            </span>
            <span className="mt-0.5 text-[7px] tracking-wide text-zinc-400 uppercase">
              ripe
            </span>

            {/* Smaller box pinned to the bottom: total fruits scanned */}
            <div
              className="bg-background/90 absolute bottom-1 flex items-center rounded px-1.5 py-px text-[9px] font-semibold text-zinc-500 tabular-nums shadow-sm"
              title="Total fruits scanned"
            >
              {capture.totalFruits}
            </div>
          </div>
        </HoverCardTrigger>
      </CaptureDetailDialog>
      <HoverCardContent align="center" side="top" className="w-90 p-2">
        <CaptureHoverCard capture={capture} />
      </HoverCardContent>
    </HoverCard>
  );
}

// ─── Overview stat ─────────────────────────────────────────────────────────────

function OverviewStat({
  icon: Icon,
  iconClass,
  label,
  value,
  hint,
}: {
  icon: typeof Leaf;
  iconClass: string;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-muted flex flex-col gap-1.5 rounded-xl p-3">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-lg",
            iconClass,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-muted-foreground text-[11px]">{label}</p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <p className="text-xl font-medium tabular-nums">{value}</p>
        {hint && <p className="text-xs text-zinc-400">{hint}</p>}
      </div>
    </div>
  );
}

export default function ScanningResultChart() {
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [range, setRange] = useState<DayRange>("7");
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then(setSessions)
      .catch(() => {});
  }, []);

  const data = groupByDay(sessions, Number(range));

  // ── Pick which scan session feeds the grid ──────────────────────────────────
  // Sessions arrive newest-first. Show the selected one when a scan is selected
  // in the sidebar (?session=), otherwise the latest session that has scans.
  const scanSessions = sessions.filter((s) => s.sessionType === "SCAN");
  const selectedId = searchParams.get("session");
  const selectedScan = selectedId
    ? (scanSessions.find((s) => String(s.id) === selectedId) ?? null)
    : null;
  const latestScanned =
    scanSessions.find((s) => s.captures.length > 0) ?? scanSessions[0] ?? null;
  const gridSession = selectedScan ?? latestScanned;
  const isSelected = !!selectedScan;

  const caps = gridSession?.captures ?? [];
  const totalFruits = caps.reduce((a, c) => a + c.totalFruits, 0);
  const readyCount = caps.filter(
    (c) => c.ripeCount > HARVEST_RIPE_THRESHOLD,
  ).length;

  const { rows, cols } = gridDims(gridSession);
  const capByIndex = new Map<number, Capture>();
  for (const c of caps) {
    if (c.plantIndex != null) capByIndex.set(c.plantIndex, c);
  }
  const cells = Array.from({ length: rows * cols }, (_, i) => {
    const plantNo = i + 1;
    return { plantNo, capture: capByIndex.get(plantNo) ?? null };
  });

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

        {/* ── Per-plant scan grid ─────────────────────────────────────────── */}
        <div className="mt-4 border-t px-2 pt-4">
          {gridSession ? (
            <>
              {/* Header: session title + when */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-foreground truncate text-sm font-semibold">
                      {gridSession.title || `Session #${gridSession.id}`}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold",
                        isSelected
                          ? "bg-sky-500/10 text-sky-500"
                          : "bg-emerald-500/10 text-emerald-500",
                      )}
                    >
                      {isSelected ? "Selected" : "Latest"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <CalendarClock size={11} />
                    {formatSessionDate(gridSession)}
                  </div>
                </div>
              </div>

              {/* Overview stats */}
              <div className="mb-4 grid grid-cols-3 gap-2">
                <OverviewStat
                  icon={Sprout}
                  iconClass="bg-green-100 text-green-700"
                  label="Plants Scanned"
                  value={caps.length}
                  hint="trees"
                />
                <OverviewStat
                  icon={Leaf}
                  iconClass="bg-emerald-100 text-emerald-700"
                  label="Fruits Scanned"
                  value={totalFruits}
                  hint="total"
                />
                <OverviewStat
                  icon={Sparkles}
                  iconClass="bg-yellow-100 text-yellow-700"
                  label="Ready to Harvest"
                  value={readyCount}
                  hint={`>${HARVEST_RIPE_THRESHOLD} ripe`}
                />
              </div>

              {/* Grid */}
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                }}
              >
                {cells.map((cell) => (
                  <PlantBox
                    key={cell.plantNo}
                    plantNo={cell.plantNo}
                    capture={cell.capture}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="mt-3 flex items-center justify-end gap-4 text-[10px] text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border border-emerald-500/50 bg-emerald-500/10" />
                  Ready ({">"}
                  {HARVEST_RIPE_THRESHOLD} ripe)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-background/90 rounded px-1 py-px text-[8px] font-semibold text-zinc-500 shadow-sm">
                    n
                  </span>
                  Total fruits
                </div>
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-xs text-zinc-500">
              No scan sessions yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
