"use client";

import { SessionType } from "@/lib/types/session";
import { cn } from "@/lib/utils";
import { format, formatDuration, intervalToDuration } from "date-fns";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Droplets,
  Leaf,
  Ruler,
  Scan,
  Sprout,
  Timer,
  Video,
  Waves,
} from "lucide-react";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  PENDING:   { label: "Pending",   dot: "bg-zinc-400",  text: "text-zinc-500",  ring: "ring-zinc-300"  },
  RUNNING:   { label: "Running",   dot: "bg-amber-400 animate-pulse", text: "text-amber-600", ring: "ring-amber-300" },
  COMPLETED: { label: "Completed", dot: "bg-emerald-500", text: "text-emerald-600", ring: "ring-emerald-300" },
  STOPPED:   { label: "Stopped",   dot: "bg-orange-400", text: "text-orange-600", ring: "ring-orange-300" },
  ERROR:     { label: "Error",     dot: "bg-red-500",   text: "text-red-600",   ring: "ring-red-300"   },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sessionDuration(start?: Date | null, end?: Date | null): string | null {
  if (!start || !end) return null;
  const dur = intervalToDuration({ start, end });
  return formatDuration(dur, { format: ["hours", "minutes", "seconds"], zero: false }) || "< 1s";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SessionCard({ session }: { session: SessionType }) {
  const isWatering = session.sessionType === "WATERING";
  const isDataset = session.sessionType === "DATA_COLLECTION";
  const status = (session.status ?? "PENDING") as keyof typeof STATUS_CFG;
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.PENDING;
  const duration = sessionDuration(session.startedAt, session.completedAt);

  return (
    <Link href={`/sessions/${session.id}`} className="group block">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-card transition-all",
          "hover:shadow-lg hover:-translate-y-0.5",
          isWatering
            ? "border-sky-200/60 dark:border-sky-900/60"
            : isDataset
              ? "border-violet-200/60 dark:border-violet-900/60"
              : "border-emerald-200/60 dark:border-emerald-900/60",
        )}
      >
        {/* Colored top stripe */}
        <div
          className={cn(
            "h-1 w-full",
            isWatering ? "bg-sky-500" : isDataset ? "bg-violet-500" : "bg-emerald-500",
          )}
        />

        <div className="p-4">
          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-2">
            {/* Type icon + title */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  isWatering
                    ? "bg-sky-500/10 text-sky-500"
                    : isDataset
                      ? "bg-violet-500/10 text-violet-500"
                      : "bg-emerald-500/10 text-emerald-500",
                )}
              >
                {isWatering ? (
                  <Waves className="h-4 w-4" />
                ) : isDataset ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <Scan className="h-4 w-4" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold leading-tight">
                    {session.title ?? `Session #${session.id}`}
                  </span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                      isWatering
                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                        : isDataset
                          ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {isWatering ? "Watering" : isDataset ? "Data Collection" : "Scan"}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {format(session.createdAt, "d MMM yyyy")}
                  {session.startedAt && (
                    <> · {format(session.startedAt, "HH:mm")}</>
                  )}
                </p>
              </div>
            </div>

            {/* Status pill */}
            <div
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1",
                cfg.text,
                cfg.ring,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
              {cfg.label}
            </div>
          </div>

          {/* Notes */}
          {session.notes && (
            <p className="mt-2.5 line-clamp-1 text-[11px] text-muted-foreground">
              {session.notes}
            </p>
          )}

          {/* ── Stats block ── */}
          <div className="mt-3">
            {isWatering ? (
              <WateringStats session={session} />
            ) : isDataset ? (
              <DatasetStats session={session} />
            ) : (
              <ScanStats session={session} />
            )}
          </div>

          {/* ── Footer ── */}
          <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {duration && (
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {duration}
                </span>
              )}
              {session.totalPlants != null && !isWatering && !isDataset && (
                <span className="flex items-center gap-1">
                  <Leaf className="h-3 w-3" />
                  {session.totalPlants} plants
                </span>
              )}
              {isDataset && session.videoDurationSec != null && (
                <span className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  {session.videoDurationSec.toFixed(0)}s video
                </span>
              )}
              {session.stopsWatered != null && isWatering && (
                <span className="flex items-center gap-1">
                  <Droplets className="h-3 w-3" />
                  {session.stopsWatered} stops
                </span>
              )}
            </div>

            <span
              className={cn(
                "flex items-center gap-1 text-[11px] font-medium transition-colors group-hover:gap-1.5",
                isWatering
                  ? "text-sky-600 dark:text-sky-400"
                  : isDataset
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              Details <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Scan stats ───────────────────────────────────────────────────────────────

function ScanStats({ session }: { session: SessionType }) {
  const captures = session.captures ?? [];

  const ripe    = session.totalRipe    ?? captures.reduce((s, c) => s + (c.ripeCount    ?? 0), 0);
  const turning = session.totalTurning ?? captures.reduce((s, c) => s + (c.turningCount ?? 0), 0);
  const unripe  = session.totalUnripe  ?? captures.reduce((s, c) => s + (c.unripeCount  ?? 0), 0);
  const damaged = session.totalDamaged ?? captures.reduce((s, c) => s + (c.brokenCount  ?? 0), 0);
  const total   = ripe + turning + unripe + damaged;

  const harvestReady =
    session.harvestReadyIds != null
      ? (JSON.parse(session.harvestReadyIds) as number[]).length
      : captures.filter((c) => (c.ripeCount ?? 0) > 3).length;

  const hasData = total > 0 || session.avgHeightCm != null;

  if (!hasData) {
    return (
      <p className="text-[11px] italic text-muted-foreground">No scan data yet</p>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Harvest-ready callout */}
      {harvestReady > 0 && (
        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/8 px-2.5 py-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {harvestReady} plant{harvestReady !== 1 ? "s" : ""} ready to harvest
        </div>
      )}

      {/* Ripeness bar */}
      {total > 0 && (
        <div className="space-y-1">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            {[
              { count: ripe,    color: "bg-emerald-500" },
              { count: turning, color: "bg-yellow-400"  },
              { count: unripe,  color: "bg-zinc-400"    },
              { count: damaged, color: "bg-red-400"     },
            ].map(({ count, color }) =>
              count > 0 ? (
                <div
                  key={color}
                  className={cn("h-full transition-all", color)}
                  style={{ width: `${(count / total) * 100}%` }}
                />
              ) : null,
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <RipenessDot color="bg-emerald-500" label={`${ripe} ripe`} />
            <RipenessDot color="bg-yellow-400"  label={`${turning} turning`} />
            <RipenessDot color="bg-zinc-400"    label={`${unripe} unripe`} />
            {damaged > 0 && (
              <RipenessDot color="bg-red-400" label={`${damaged} damaged`} />
            )}
          </div>
        </div>
      )}

      {/* Secondary metrics */}
      <div className="flex gap-3 text-[11px] text-muted-foreground">
        {session.avgHeightCm != null && (
          <span className="flex items-center gap-1">
            <Ruler className="h-3 w-3" />
            {session.avgHeightCm.toFixed(1)} cm avg
          </span>
        )}
        {session.avgMoisturePct != null && (
          <span className="flex items-center gap-1">
            <Droplets className="h-3 w-3" />
            {session.avgMoisturePct.toFixed(0)}% moisture
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Dataset stats ────────────────────────────────────────────────────────────

function DatasetStats({ session }: { session: SessionType }) {
  if (!session.videoUrl) {
    return (
      <p className="text-[11px] italic text-muted-foreground">No video yet</p>
    );
  }
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-violet-500/8 px-2.5 py-1.5 text-[11px] font-medium text-violet-600 dark:text-violet-400">
      <Video className="h-3.5 w-3.5 shrink-0" />
      Video recorded
      {session.videoDurationSec != null && (
        <span className="text-muted-foreground">
          · {session.videoDurationSec.toFixed(0)}s
        </span>
      )}
    </div>
  );
}

function RipenessDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}

// ─── Watering stats ───────────────────────────────────────────────────────────

function WateringStats({ session }: { session: SessionType }) {
  const hasData =
    session.moistureBeforeAvg != null ||
    session.moistureAfterAvg != null ||
    session.maxHeightCm != null ||
    session.fuzzyDurationSec != null;

  if (!hasData) {
    return (
      <p className="text-[11px] italic text-muted-foreground">No watering data yet</p>
    );
  }

  const before  = session.moistureBeforeAvg;
  const after   = session.moistureAfterAvg;
  const delta   = before != null && after != null ? after - before : null;

  return (
    <div className="space-y-2.5">
      {/* Moisture before → after */}
      {(before != null || after != null) && (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 flex-col items-center rounded-lg bg-muted/60 py-2">
            <span className="text-[10px] text-muted-foreground">Before</span>
            <span className="text-sm font-semibold tabular-nums">
              {before != null ? `${before.toFixed(0)}%` : "—"}
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <ArrowRight className="h-3.5 w-3.5 text-sky-500" />
            {delta != null && (
              <span
                className={cn(
                  "text-[9px] font-semibold tabular-nums",
                  delta >= 0 ? "text-emerald-500" : "text-red-400",
                )}
              >
                {delta >= 0 ? "+" : ""}
                {delta.toFixed(0)}%
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center rounded-lg bg-sky-500/8 py-2">
            <span className="text-[10px] text-sky-600 dark:text-sky-400">After</span>
            <span className="text-sm font-semibold tabular-nums text-sky-600 dark:text-sky-400">
              {after != null ? `${after.toFixed(0)}%` : "—"}
            </span>
          </div>
        </div>
      )}

      {/* Secondary: height + duration */}
      <div className="flex gap-3 text-[11px] text-muted-foreground">
        {session.maxHeightCm != null && (
          <span className="flex items-center gap-1">
            <Sprout className="h-3 w-3" />
            {session.maxHeightCm.toFixed(1)} cm max
          </span>
        )}
        {session.fuzzyDurationSec != null && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {session.fuzzyDurationSec.toFixed(0)}s valve
          </span>
        )}
      </div>
    </div>
  );
}
