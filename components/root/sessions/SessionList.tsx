"use client";

import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Droplets,
  Loader2,
  Play,
  RefreshCw,
  Ruler,
  Scan,
  Sprout,
  Video,
  Waves,
} from "lucide-react";
import { formatTime } from "../plants/section/SessionSidebar";
import { SessionType } from "@/server/validators/session.validator";
import { formatDuration, intervalToDuration } from "date-fns";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  PENDING:   { label: "Pending",   dot: "bg-zinc-500",                   text: "text-zinc-400"   },
  RUNNING:   { label: "Running",   dot: "bg-emerald-400 animate-pulse",  text: "text-emerald-400" },
  COMPLETED: { label: "Done",      dot: "bg-sky-400",                    text: "text-sky-400"    },
  STOPPED:   { label: "Stopped",   dot: "bg-orange-400",                 text: "text-orange-400" },
  ERROR:     { label: "Error",     dot: "bg-red-500",                    text: "text-red-400"    },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function duration(start?: Date | null, end?: Date | null): string | null {
  if (!start || !end) return null;
  const dur = intervalToDuration({ start, end });
  return formatDuration(dur, { format: ["hours", "minutes", "seconds"] }) || null;
}

// ─── Scan stats ───────────────────────────────────────────────────────────────

function ScanStats({ session }: { session: SessionType }) {
  const captures = session.captures ?? [];

  const ripe    = session.totalRipe    ?? captures.reduce((s, c) => s + (c.ripeCount    ?? 0), 0);
  const turning = session.totalTurning ?? captures.reduce((s, c) => s + (c.turningCount ?? 0), 0);
  const unripe  = session.totalUnripe  ?? captures.reduce((s, c) => s + (c.unripeCount  ?? 0), 0);
  const damaged = session.totalDamaged ?? captures.reduce((s, c) => s + (c.brokenCount  ?? 0), 0);
  const total   = ripe + turning + unripe + damaged;

  const harvestReady = session.harvestReadyIds
    ? (() => { try { return (JSON.parse(session.harvestReadyIds) as number[]).length; } catch { return 0; } })()
    : captures.filter((c) => (c.ripeCount ?? 0) > 3).length;

  if (total === 0 && harvestReady === 0 && session.avgHeightCm == null) return null;

  return (
    <div className="space-y-2">
      {/* Harvest-ready callout */}
      {harvestReady > 0 && (
        <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          {harvestReady} plant{harvestReady !== 1 ? "s" : ""} ready to harvest
        </div>
      )}

      {/* Ripeness bar */}
      {total > 0 && (
        <div className="space-y-1">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            {[
              { count: ripe,    color: "bg-emerald-500" },
              { count: turning, color: "bg-yellow-400"  },
              { count: unripe,  color: "bg-zinc-500"    },
              { count: damaged, color: "bg-red-400"     },
            ].map(({ count, color }) =>
              count > 0 ? (
                <div key={color} className={color} style={{ width: `${(count / total) * 100}%` }} />
              ) : null,
            )}
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px]">
            {ripe    > 0 && <span className="text-emerald-500">{ripe} ripe</span>}
            {turning > 0 && <span className="text-yellow-400">{turning} turning</span>}
            {unripe  > 0 && <span className="text-zinc-500">{unripe} unripe</span>}
            {damaged > 0 && <span className="text-red-400">{damaged} damaged</span>}
          </div>
        </div>
      )}

      {/* Secondary: height + moisture */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-zinc-500">
        {session.avgHeightCm != null && (
          <span className="flex items-center gap-1">
            <Ruler className="h-2.5 w-2.5" />{session.avgHeightCm.toFixed(1)} cm avg
          </span>
        )}
        {session.avgMoisturePct != null && (
          <span className="flex items-center gap-1">
            <Droplets className="h-2.5 w-2.5" />{session.avgMoisturePct.toFixed(0)}% moisture
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Watering stats ───────────────────────────────────────────────────────────

function WateringStats({ session }: { session: SessionType }) {
  const before = session.moistureBeforeAvg;
  const after  = session.moistureAfterAvg;
  const delta  = before != null && after != null ? after - before : null;
  const hasAny = before != null || after != null || session.maxHeightCm != null;

  if (!hasAny) return null;

  return (
    <div className="space-y-2">
      {/* Moisture before → after */}
      {(before != null || after != null) && (
        <div className="flex items-center gap-1.5">
          <div className="flex flex-1 flex-col items-center rounded-lg bg-zinc-800/60 py-1.5">
            <span className="text-[9px] text-zinc-500">Before</span>
            <span className="text-[13px] font-bold tabular-nums text-zinc-300">
              {before != null ? `${before.toFixed(0)}%` : "—"}
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sky-500">→</span>
            {delta != null && (
              <span className={cn(
                "text-[9px] font-bold tabular-nums",
                delta >= 0 ? "text-emerald-500" : "text-red-400",
              )}>
                {delta >= 0 ? "+" : ""}{delta.toFixed(0)}%
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center rounded-lg bg-sky-500/10 py-1.5">
            <span className="text-[9px] text-sky-600">After</span>
            <span className="text-[13px] font-bold tabular-nums text-sky-400">
              {after != null ? `${after.toFixed(0)}%` : "—"}
            </span>
          </div>
        </div>
      )}

      {/* Secondary */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-zinc-500">
        {session.maxHeightCm != null && (
          <span className="flex items-center gap-1">
            <Sprout className="h-2.5 w-2.5" />{session.maxHeightCm.toFixed(1)} cm max
          </span>
        )}
        {session.stopsWatered != null && (
          <span className="flex items-center gap-1">
            <Droplets className="h-2.5 w-2.5" />{session.stopsWatered} stops watered
          </span>
        )}
        {session.fuzzyDurationSec != null && (
          <span className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />{session.fuzzyDurationSec.toFixed(0)}s valve
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionRow({ session, onSelect }: { session: SessionType; onSelect: () => void }) {
  const isWatering = session.sessionType === "WATERING";
  const isDataset  = session.sessionType === "DATA_COLLECTION";
  const statusKey  = (session.status ?? "PENDING") as keyof typeof STATUS_CFG;
  const st         = STATUS_CFG[statusKey] ?? STATUS_CFG.PENDING;
  const dur        = duration(session.startedAt, session.completedAt);
  const isRunning  = session.status === "RUNNING";
  const isDone     = session.status === "COMPLETED";
  const isBad      = session.status === "ERROR" || session.status === "STOPPED";

  return (
    <button
      onClick={onSelect}
      className="group w-full overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-px hover:shadow-lg"
      style={{
        borderColor: isWatering
          ? "rgb(14 165 233 / 0.25)"
          : isDataset
            ? "rgb(139 92 246 / 0.25)"
            : "rgb(16 185 129 / 0.25)",
        background: isWatering
          ? "rgb(14 165 233 / 0.04)"
          : isDataset
            ? "rgb(139 92 246 / 0.04)"
            : "rgb(16 185 129 / 0.04)",
      }}
    >
      {/* Colored top stripe */}
      <div className={cn("h-0.5 w-full", isWatering ? "bg-sky-500" : isDataset ? "bg-violet-500" : "bg-emerald-500")} />

      <div className="px-3 py-2.5 space-y-2.5">

        {/* ── Row 1: icon + title + time ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
              isWatering ? "bg-sky-500/15 text-sky-400" : isDataset ? "bg-violet-500/15 text-violet-400" : "bg-emerald-500/15 text-emerald-400",
            )}>
              {isWatering ? <Waves className="h-3.5 w-3.5" /> : isDataset ? <Video className="h-3.5 w-3.5" /> : <Scan className="h-3.5 w-3.5" />}
            </div>
            <span className="truncate text-[12px] font-semibold leading-tight text-zinc-100">
              {session.title ?? `Session #${session.id}`}
            </span>
          </div>
          <span className="shrink-0 text-[10px] tabular-nums text-zinc-600">
            {formatTime(session.startedAt)}
          </span>
        </div>

        {/* ── Row 2: status dot + label + type badge + duration ── */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Status */}
          <div className="flex items-center gap-1">
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", st.dot)} />
            <span className={cn("text-[10px] font-semibold", st.text)}>{st.label}</span>
          </div>

          {/* Type badge */}
          <span className={cn(
            "rounded px-1.5 py-0.5 text-[9px] font-semibold",
            isWatering ? "bg-sky-500/10 text-sky-400" : isDataset ? "bg-violet-500/10 text-violet-400" : "bg-emerald-500/10 text-emerald-400",
          )}>
            {isWatering ? "Watering" : isDataset ? "Data Collection" : "Scan"}
          </span>

          {/* Plant count */}
          {session.totalPlants != null && !isWatering && !isDataset && (
            <span className="text-[9px] text-zinc-600">{session.totalPlants} plants</span>
          )}

          {/* Duration */}
          {dur && (
            <span className="ml-auto flex items-center gap-1 text-[9px] text-zinc-600">
              <Clock className="h-2.5 w-2.5" />{dur}
            </span>
          )}
        </div>

        {/* ── Running indicator ── */}
        {isRunning && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/8 px-2 py-1.5">
            <Loader2 className="h-3 w-3 shrink-0 animate-spin text-emerald-400" />
            <span className="text-[10px] font-medium text-emerald-400">Session in progress…</span>
          </div>
        )}

        {/* ── Error / stopped ── */}
        {isBad && (
          <div className="flex items-center gap-1.5 rounded-lg bg-red-500/8 px-2 py-1 text-[10px] text-red-400">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {session.status === "ERROR" ? "Session ended with an error" : "Session was stopped early"}
          </div>
        )}

        {/* ── Stats (completed, or partial data from a stopped/errored run) ── */}
        {(isDone || isBad) && !isDataset && (
          isWatering ? <WateringStats session={session} /> : <ScanStats session={session} />
        )}

        {/* ── Data collection: video indicator ── */}
        {(isDone || isBad) && isDataset && session.videoUrl && (
          <div className="flex items-center gap-1.5 rounded-lg bg-violet-500/8 px-2 py-1 text-[10px] text-violet-400">
            <Video className="h-3 w-3 shrink-0" />
            Video recorded
          </div>
        )}

        {/* ── Notes ── */}
        {session.notes && (
          <p className="line-clamp-1 text-[10px] italic text-zinc-600">{session.notes}</p>
        )}
      </div>
    </button>
  );
}

// ─── Main list ────────────────────────────────────────────────────────────────

export default function SessionList({
  sessions,
  loading,
  onSelectSession,
  onStartSession,
  onRefresh,
  disableStart,
}: {
  sessions: SessionType[];
  loading: boolean;
  onSelectSession: (id: string) => void;
  onStartSession: () => void;
  onRefresh: () => void;
  disableStart: boolean;
}) {
  return (
    <div className="mt-2 space-y-2 p-1">
      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={18} className="animate-spin text-zinc-500" />
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="px-3 py-8 text-center">
          <p className="text-xs text-zinc-500">No sessions for this day.</p>
          <button
            onClick={onRefresh}
            className="mx-auto mt-2 flex items-center gap-1 text-[11px] text-zinc-500 transition-colors hover:text-zinc-200"
          >
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
      )}

      {!loading && sessions.map((session) => (
        <SessionRow
          key={session.id}
          session={session}
          onSelect={() => onSelectSession(String(session.id))}
        />
      ))}

      {/* Divider */}
      {!loading && (
        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-zinc-800" />
          <span className="text-[10px] text-zinc-700">or</span>
          <span className="h-px flex-1 bg-zinc-800" />
        </div>
      )}

      {/* Start session */}
      <button
        onClick={onStartSession}
        disabled={disableStart}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-zinc-800 px-4 py-3 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800/40",
          disableStart && "cursor-not-allowed opacity-40",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
          <Play size={13} fill="currentColor" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-foreground">Start Session</p>
          <p className="text-[11px] text-zinc-500">Scan or watering</p>
        </div>
      </button>
    </div>
  );
}
