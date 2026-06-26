"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplets,
  Leaf,
  Loader2,
  Play,
  Radio,
  Ruler,
  Square,
  Video,
  WifiOff,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { piApi, PI_URL, SSEEvent, PiDetection } from "@/lib/pi";
import { Prisma } from "@/generated/prisma";
import { CaptureImage } from "./CaptureImage";

type CaptureRow = Prisma.CapturesGetPayload<Record<string, never>>;
type WateringStopRow = Prisma.WateringStopGetPayload<Record<string, never>>;

// ─── Types ────────────────────────────────────────────────────────────────────

type FruitClass = "Ripe" | "Unripe" | "Turning" | "Broken";

export interface ClassCount {
  Ripe: number;
  Unripe: number;
  Turning: number;
  Broken: number;
}

interface LiveCapture {
  plant_id: number;
  image_url: string | null;
  annotated_url: string | null;
  classes: ClassCount;
  height_cm?: number | null;
  moisture_pct?: number | null;
}

interface WateringStopEntry {
  stop_index: number;
  x_mm: number;
  y_mm: number;
  duration_sec: number;
}

type Phase = "idle" | "creating" | "running" | "complete" | "stopped" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CLASS_BAR_COLOR: Record<FruitClass, string> = {
  Ripe: "bg-emerald-500",
  Unripe: "bg-sky-500",
  Turning: "bg-amber-500",
  Broken: "bg-red-500",
};

const CLASS_DOT_COLOR: Record<FruitClass, string> = {
  Ripe: "bg-emerald-500",
  Unripe: "bg-sky-500",
  Turning: "bg-amber-500",
  Broken: "bg-red-500",
};

function detectionsToClassCount(detections: PiDetection[]): ClassCount {
  const counts: ClassCount = { Ripe: 0, Unripe: 0, Turning: 0, Broken: 0 };
  for (const d of detections) {
    if (d.cls === "ripe") counts.Ripe += d.count;
    else if (d.cls === "unripe") counts.Unripe += d.count;
    else if (d.cls === "turning") counts.Turning += d.count;
    else if (d.cls === "broken") counts.Broken += d.count;
  }
  return counts;
}

function sumClasses(captures: LiveCapture[]): ClassCount {
  return captures.reduce(
    (acc, c) => ({
      Ripe: acc.Ripe + c.classes.Ripe,
      Unripe: acc.Unripe + c.classes.Unripe,
      Turning: acc.Turning + c.classes.Turning,
      Broken: acc.Broken + c.classes.Broken,
    }),
    { Ripe: 0, Unripe: 0, Turning: 0, Broken: 0 },
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ClassBarList({
  classes,
  total,
}: {
  classes: ClassCount;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {(Object.entries(classes) as [FruitClass, number][]).map(
        ([label, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={label} className="flex items-center gap-2">
              <span className="w-12 text-[10px] text-zinc-400">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-300 dark:bg-zinc-700">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    CLASS_BAR_COLOR[label],
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right text-[10px] text-zinc-400">
                {count}
              </span>
            </div>
          );
        },
      )}
    </div>
  );
}

function CaptureCard({ cap }: { cap: LiveCapture }) {
  const total = Object.values(cap.classes).reduce((a, b) => a + b, 0);
  return (
    <div className="bg-muted flex items-start gap-1 overflow-hidden rounded-lg">
      <CaptureImage
        plantId={cap.plant_id}
        rawUrl={cap.image_url}
        annotatedUrl={cap.annotated_url}
      />
      <div className="flex w-full flex-col gap-1 p-2">
        <div className="flex w-full items-center justify-between border-b pb-1">
          <span className="text-xs text-zinc-500">Total</span>
          <span className="text-primary text-sm font-bold">{total}</span>
        </div>
        {(Object.entries(cap.classes) as [FruitClass, number][]).map(
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
        {cap.height_cm != null && (
          <div className="mt-1 flex items-center justify-between border-t pt-1">
            <span className="text-[10px] text-zinc-500">Height</span>
            <span className="text-[10px] text-zinc-400">
              {cap.height_cm} cm
            </span>
          </div>
        )}
        {cap.moisture_pct != null && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Moisture</span>
            <span className="text-[10px] text-zinc-400">
              {cap.moisture_pct}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LiveSessionProps {
  onBack: () => void;
  sessionId: string;
  sessionType?: "SCAN" | "WATERING" | "DATA_COLLECTION";
  scanConfig?: Record<string, unknown> | null;
  wateringConfig?: Record<string, unknown> | null;
  datasetConfig?: Record<string, unknown> | null;
  /** DB status of the session — drives auto-reconnect for RUNNING sessions. */
  status?: string;
  /** Captures already persisted (used to seed the live view on reconnect). */
  initialCaptures?: CaptureRow[];
  /** Watering stops already persisted (used to seed the live view on reconnect). */
  initialStops?: WateringStopRow[];
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LiveSession({
  onBack,
  sessionId: initialSessionId,
  sessionType = "SCAN",
  scanConfig,
  wateringConfig,
  datasetConfig,
  status,
  initialCaptures,
  initialStops,
}: LiveSessionProps) {
  const sessionId = initialSessionId;
  const isWatering = sessionType === "WATERING";
  const isDataset = sessionType === "DATA_COLLECTION";

  const TOTAL_SCAN_PLANTS = 16;
  const TOTAL_WATER_COLS = 8;

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  // SCAN state
  const [scanCount, setScanCount] = useState(0);
  const [currentPlantId, setCurrentPlantId] = useState<number | null>(null);
  // Gantry position relative to the current plant: "moving" while in transit,
  // "at" once it has arrived (set by gantry_moving / gantry_moved events).
  const [gantryStatus, setGantryStatus] = useState<"moving" | "at" | null>(
    null,
  );
  const [captures, setCaptures] = useState<LiveCapture[]>([]);
  const [capturesOpen, setCapturesOpen] = useState(true);

  // DATA_COLLECTION state
  const [recording, setRecording] = useState(false);
  const [rowsSwept, setRowsSwept] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // WATERING state
  const [tofProgress, setTofProgress] = useState({ done: 0, total: 0 });
  const [maxHeightCm, setMaxHeightCm] = useState<number | null>(null);
  const [moistureBefore, setMoistureBefore] = useState<number[] | null>(null);
  const [fuzzyDuration, setFuzzyDuration] = useState<number | null>(null);
  const [wateringStops, setWateringStops] = useState<WateringStopEntry[]>([]);
  const [moistureAfter, setMoistureAfter] = useState<number[] | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const capturesRef = useRef<LiveCapture[]>([]);
  const [startTime, setStartTime] = useState<string | null>(null);

  useEffect(() => {
    capturesRef.current = captures;
  }, [captures]);

  useEffect(() => {
    return () => {
      esRef.current?.close();
    };
  }, []);

  // Reconnect to a session the RPi is already running: stream live events
  // without re-issuing a start. Seed the panels from data persisted so far so
  // prior plant cards / progress appear immediately, then SSE appends new ones.
  useEffect(() => {
    if (status !== "RUNNING") return;
    seedFromInitial();
    connect();
    setPhase("running");
    setStartTime(
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seed live state from already-persisted captures / watering stops.
  function seedFromInitial() {
    if (!isWatering && initialCaptures && initialCaptures.length > 0) {
      const seeded: LiveCapture[] = initialCaptures
        .slice()
        .sort((a, b) => (a.plantIndex ?? 0) - (b.plantIndex ?? 0))
        .map((c) => ({
          plant_id: c.plantIndex ?? 0,
          image_url: c.imageUrl || null,
          annotated_url: c.annotatedImageUrl || null,
          classes: {
            Ripe: c.ripeCount,
            Unripe: c.unripeCount,
            Turning: c.turningCount,
            Broken: c.brokenCount,
          },
          height_cm: c.heightCm,
          moisture_pct: c.moisturePct,
        }));
      setCaptures(seeded);
      setScanCount(seeded.length);
    }
    if (isWatering && initialStops && initialStops.length > 0) {
      setWateringStops(
        initialStops
          .slice()
          .sort((a, b) => a.stopIndex - b.stopIndex)
          .map((s) => ({
            stop_index: s.stopIndex,
            x_mm: s.xMm,
            y_mm: s.yMm,
            duration_sec: s.valveDurationSec,
          })),
      );
      setScanCount(initialStops.length);
    }
  }

  // Open the SSE stream for this session and route events into handleEvent.
  function connect() {
    const es = piApi.connectEvents(sessionId, handleEvent, () => {
      setPhase("error");
      setError(`Lost connection to Pi. Check that it is online at ${PI_URL}.`);
    });
    esRef.current = es;
  }

  function handleEvent(event: SSEEvent) {
    switch (event.type) {
      // ── SCAN events ────────────────────────────────────────────────────────
      case "gantry_moving":
        setCurrentPlantId(event.plant_id);
        setGantryStatus("moving");
        break;

      case "gantry_moved":
        setCurrentPlantId(event.plant_id);
        setGantryStatus("at");
        break;

      case "plant_scanned": {
        const entry: LiveCapture = {
          plant_id: event.plant_id,
          image_url: event.image_url,
          annotated_url: event.annotated_image_url,
          classes: detectionsToClassCount(event.detections),
        };
        setCaptures((prev) => {
          const exists = prev.find((c) => c.plant_id === event.plant_id);
          return exists
            ? prev.map((c) => (c.plant_id === event.plant_id ? entry : c))
            : [...prev, entry];
        });
        setScanCount((c) => c + 1);
        break;
      }

      // ── WATERING events ────────────────────────────────────────────────────
      case "tof_sweep_started":
        setTofProgress({ done: 0, total: event.total_positions });
        break;

      case "tof_position_scanned":
        setTofProgress({ done: event.position, total: event.total });
        break;

      case "tof_sweep_complete":
        setMaxHeightCm(event.max_height_cm);
        break;

      case "moisture_read_before":
        setMoistureBefore(Array.from(event.sensors));
        break;

      case "fuzzy_computed":
        setFuzzyDuration(event.duration_sec);
        break;

      case "watering_stop":
        setScanCount((c) => c + 1);
        setWateringStops((prev) => [
          ...prev,
          {
            stop_index: event.stop_index,
            x_mm: event.x_mm,
            y_mm: event.y_mm,
            duration_sec: event.duration_sec,
          },
        ]);
        break;

      case "moisture_read_after":
        setMoistureAfter(Array.from(event.sensors));
        break;

      // ── DATA_COLLECTION events ─────────────────────────────────────────────
      case "recording_started":
        setRecording(true);
        setTotalRows(event.total_rows);
        break;

      case "pass_progress":
        setRowsSwept(event.rows_swept);
        setTotalRows(event.total_rows);
        break;

      // ── Shared terminal events ─────────────────────────────────────────────
      case "session_complete": {
        setPhase("complete");
        setCurrentPlantId(null);
        setGantryStatus(null);
        setRecording(false);
        const summaryUrl = (event.summary as { video_url?: string } | undefined)
          ?.video_url;
        if (summaryUrl) setVideoUrl(summaryUrl);
        esRef.current?.close();
        break;
      }

      case "session_error":
        setPhase("error");
        setError(event.message);
        esRef.current?.close();
        break;
    }
  }

  // ── Start ───────────────────────────────────────────────────────────────────
  async function handleStart() {
    setPhase("creating");
    setError(null);
    setCurrentPlantId(null);
    setGantryStatus(null);
    setScanCount(0);
    setCaptures([]);
    setTofProgress({ done: 0, total: 0 });
    setMaxHeightCm(null);
    setMoistureBefore(null);
    setFuzzyDuration(null);
    setWateringStops([]);
    setMoistureAfter(null);
    setRecording(false);
    setRowsSwept(0);
    setVideoUrl(null);

    try {
      await piApi.startSession(
        sessionId,
        sessionType,
        isWatering ? wateringConfig : isDataset ? datasetConfig : scanConfig,
      );

      connect();
      setPhase("running");
      setStartTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch (e) {
      setPhase("error");
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    }
  }

  // ── Stop ────────────────────────────────────────────────────────────────────
  async function handleStop() {
    if (!sessionId) return;
    try {
      esRef.current?.close();
      await piApi.stopSession(sessionId);
      setPhase("stopped");
      setCurrentPlantId(null);
      setGantryStatus(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop session");
    }
  }

  // ── Force stop & reset ────────────────────────────────────────────────────
  // Recovery for a session stuck in RUNNING (e.g. the RPi task died without
  // emitting a terminal event). Halts the gantry best-effort and marks the
  // dashboard session STOPPED so it stops blocking new sessions and its
  // collected data becomes viewable in the detail view.
  async function handleForceReset() {
    esRef.current?.close();
    try {
      await piApi.gantryStop();
    } catch {
      // RPi may be unreachable — clear dashboard state regardless.
    }
    try {
      await fetch(`/api/sessions/${sessionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "stopped" }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset session");
      return;
    }
    setPhase("stopped");
    setCurrentPlantId(null);
    setGantryStatus(null);
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const isComplete = phase === "complete";
  const isEnded =
    phase === "stopped" || phase === "error" || phase === "complete";
  const totalSteps = isWatering ? TOTAL_WATER_COLS : TOTAL_SCAN_PLANTS;
  const pct = Math.round((scanCount / totalSteps) * 100);
  const liveClasses = sumClasses(captures);
  const liveTotalFruits = Object.values(liveClasses).reduce((a, b) => a + b, 0);
  const tofPct =
    tofProgress.total > 0
      ? Math.round((tofProgress.done / tofProgress.total) * 100)
      : 0;

  const idleDescription = isWatering
    ? `The gantry will home, sweep ${TOTAL_SCAN_PLANTS} positions for height, then water ${TOTAL_WATER_COLS} column zones.`
    : isDataset
      ? `The gantry will home, then sweep every row continuously while recording a single video for dataset collection.`
      : `The gantry will home, then scan all ${TOTAL_SCAN_PLANTS} plants in sequence.`;

  return (
    <div className="flex flex-col gap-0 pt-4">
      {/* Back */}
      <button
        onClick={onBack}
        className="hover:text-foreground flex items-center gap-2 text-[12px] text-zinc-400 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to sessions
      </button>

      {/* Header */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-foreground text-xl font-semibold">
              New Session
            </h2>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                isWatering
                  ? "bg-sky-500/10 text-sky-500"
                  : isDataset
                    ? "bg-violet-500/10 text-violet-500"
                    : "bg-emerald-500/10 text-emerald-500",
              )}
            >
              {isWatering
                ? "Watering"
                : isDataset
                  ? "Data Collection"
                  : "Scan"}
            </span>
          </div>
          <p className="text-muted-foreground text-[11px]">
            {startTime
              ? `${startTime} — ${isEnded ? "ended" : "ongoing"}`
              : "Ready to start"}
          </p>
          {sessionId && (
            <p className="font-mono text-[10px] text-zinc-500">{sessionId}</p>
          )}
        </div>

        {phase === "idle" && (
          <span className="rounded-full bg-zinc-700 px-2.5 py-1 text-[10px] font-semibold text-zinc-300">
            Idle
          </span>
        )}
        {phase === "creating" && (
          <span className="flex items-center gap-1.5 rounded-full bg-zinc-600 px-2.5 py-1 text-[10px] font-semibold text-zinc-100">
            <Loader2 size={10} className="animate-spin" />
            Starting…
          </span>
        )}
        {phase === "running" && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-emerald-100">
            <Radio size={10} className="animate-pulse" />
            Live
          </span>
        )}
        {phase === "complete" && (
          <span className="flex items-center gap-1.5 rounded-full bg-sky-600 px-2.5 py-1 text-[10px] font-semibold text-sky-100">
            <CheckCircle2 size={10} />
            Complete
          </span>
        )}
        {phase === "stopped" && (
          <span className="rounded-full bg-zinc-600 px-2.5 py-1 text-[10px] font-semibold text-zinc-100">
            Stopped
          </span>
        )}
        {phase === "error" && (
          <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-red-100">
            <WifiOff size={10} />
            Error
          </span>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-3 space-y-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
          <p className="text-[11px] font-semibold text-red-400">
            Connection failed
          </p>
          <p className="text-[11px] whitespace-pre-line text-red-400/80">
            {error}
          </p>
          <p className="font-mono text-[10px] text-zinc-500">URL: {PI_URL}</p>
        </div>
      )}

      <div className="my-3 border-t" />

      {/* ── IDLE: start card ── */}
      {phase === "idle" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="bg-muted w-full rounded-2xl p-6 text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
              {isWatering ? (
                <Droplets size={22} className="text-primary" />
              ) : isDataset ? (
                <Video size={22} className="text-primary" />
              ) : (
                <Play
                  size={22}
                  className="text-primary ml-0.5"
                  fill="currentColor"
                />
              )}
            </div>
            <p className="text-foreground text-sm font-semibold">
              {isWatering
                ? "Ready to water"
                : isDataset
                  ? "Ready to record"
                  : "Ready to scan"}
            </p>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {idleDescription}
            </p>
            <p className="mt-2 font-mono text-[10px] text-zinc-500">{PI_URL}</p>
          </div>
          <button
            onClick={handleStart}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-colors"
          >
            <Play size={13} fill="currentColor" />
            Start Session
          </button>
        </div>
      )}

      {/* ── CREATING: spinner ── */}
      {phase === "creating" && (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 size={28} className="text-primary animate-spin" />
          <p className="text-sm text-zinc-400">Connecting to Pi…</p>
          <p className="font-mono text-[10px] text-zinc-500">{PI_URL}</p>
        </div>
      )}

      {/* ── RUNNING / COMPLETE / STOPPED: live data ── */}
      {(phase === "running" || phase === "complete" || phase === "stopped") && (
        <>
          {isWatering ? (
            /* ── WATERING live panel ─────────────────────────────────────── */
            <div className="flex flex-col gap-3">
              {/* TOF sweep progress */}
              {tofProgress.total > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                      TOF Height Sweep
                    </p>
                    <span className="text-[11px] text-zinc-400">
                      {tofProgress.done} / {tofProgress.total} positions
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        maxHeightCm !== null ? "bg-sky-500" : "bg-amber-500",
                      )}
                      style={{ width: `${tofPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Watering column progress */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                    Watering Progress
                  </p>
                  <span className="text-[11px] text-zinc-400">
                    {scanCount} / {TOTAL_WATER_COLS} columns
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isComplete ? "bg-sky-500" : "bg-emerald-500",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted flex flex-col gap-2 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-yellow-100">
                      <Ruler className="h-3.5 w-3.5 text-yellow-700" />
                    </div>
                    <p className="text-sm">Max Height</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-xl font-medium tabular-nums">
                      {maxHeightCm ?? "—"}
                    </p>
                    <p className="text-xs text-zinc-400">cm</p>
                  </div>
                </div>

                <div className="bg-muted flex flex-col gap-2 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100">
                      <Droplets className="h-3.5 w-3.5 text-sky-700" />
                    </div>
                    <p className="text-sm">Valve Open</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-xl font-medium tabular-nums">
                      {fuzzyDuration !== null ? fuzzyDuration.toFixed(1) : "—"}
                    </p>
                    <p className="text-xs text-zinc-400">sec</p>
                  </div>
                </div>
              </div>

              {/* Moisture before / after */}
              {(moistureBefore || moistureAfter) && (
                <div className="bg-muted rounded-xl px-3 py-3">
                  <p className="mb-2 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                    Soil Moisture
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="mb-1 text-[10px] text-zinc-500">Before</p>
                      {moistureBefore ? (
                        moistureBefore.map((v, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                          >
                            <span className="text-[10px] text-zinc-400">
                              S{i}
                            </span>
                            <span className="text-[10px] font-medium">
                              {v.toFixed(1)}%
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-zinc-500">—</p>
                      )}
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] text-zinc-500">After</p>
                      {moistureAfter ? (
                        moistureAfter.map((v, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                          >
                            <span className="text-[10px] text-zinc-400">
                              S{i}
                            </span>
                            <span className="text-[10px] font-medium">
                              {v.toFixed(1)}%
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-zinc-500">
                          {isComplete ? "—" : "Pending…"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Watering stops list */}
              {wateringStops.length > 0 && (
                <div className="bg-muted rounded-xl px-3 py-3">
                  <p className="mb-2 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                    Column Stops
                  </p>
                  <div className="flex flex-col gap-1">
                    {wateringStops.map((stop) => (
                      <div
                        key={stop.stop_index}
                        className="flex items-center justify-between rounded px-2 py-1 odd:bg-zinc-100 dark:odd:bg-zinc-800"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            size={10}
                            className="text-emerald-500"
                          />
                          <span className="text-[10px] text-zinc-500">
                            Col {stop.stop_index}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-400">
                            x={stop.x_mm.toFixed(0)}mm
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold">
                          {stop.duration_sec.toFixed(1)}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : isDataset ? (
            /* ── DATA_COLLECTION live panel ──────────────────────────────── */
            <div className="flex flex-col gap-3">
              {/* Recording status */}
              <div className="bg-muted flex items-center justify-between rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      recording ? "bg-red-100" : "bg-zinc-200 dark:bg-zinc-700",
                    )}
                  >
                    <Video
                      className={cn(
                        "h-4 w-4",
                        recording ? "text-red-600" : "text-zinc-500",
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {recording
                        ? "Recording…"
                        : isComplete
                          ? "Recording finished"
                          : "Standby"}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Continuous serpentine sweep
                    </p>
                  </div>
                </div>
                {recording && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-red-100">
                    <Radio size={10} className="animate-pulse" />
                    REC
                  </span>
                )}
              </div>

              {/* Row sweep progress */}
              {totalRows > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                      Sweep Progress
                    </p>
                    <span className="text-[11px] text-zinc-400">
                      {rowsSwept} / {totalRows} rows
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isComplete ? "bg-violet-500" : "bg-emerald-500",
                      )}
                      style={{
                        width: `${totalRows > 0 ? Math.round((rowsSwept / totalRows) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Video player (once uploaded) */}
              {videoUrl && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                    Recorded Video
                  </p>
                  <video
                    controls
                    src={videoUrl}
                    className="w-full rounded-xl bg-black"
                  />
                  <a
                    href={videoUrl}
                    download
                    className="text-primary mt-2 inline-flex items-center gap-1.5 text-[11px] hover:underline"
                  >
                    <Video size={12} />
                    Download video
                  </a>
                </div>
              )}

              {isComplete && !videoUrl && (
                <p className="py-2 text-center text-[11px] text-zinc-500">
                  Processing video…
                </p>
              )}
            </div>
          ) : (
            /* ── SCAN live panel ─────────────────────────────────────────── */
            <>
              {/* Progress */}
              <div className="mb-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                    Scanning Progress
                  </p>
                  <span className="text-[11px] text-zinc-400">
                    {scanCount} / {TOTAL_SCAN_PLANTS} Tree
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isComplete ? "bg-sky-500" : "bg-emerald-500",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-[10px] text-zinc-500">
                  {currentPlantId && !isEnded && gantryStatus
                    ? gantryStatus === "moving"
                      ? `Moving to Plant #${String(currentPlantId).padStart(2, "0")}…`
                      : `At Plant #${String(currentPlantId).padStart(2, "0")}`
                    : `${pct}%`}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted flex flex-col gap-2 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-100">
                      <Leaf className="h-3.5 w-3.5 text-green-700" />
                    </div>
                    <p className="text-sm">Total Fruits</p>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-xl font-medium tabular-nums">
                      {liveTotalFruits}
                    </p>
                    <p className="text-xs text-zinc-400">
                      from {scanCount} tree{scanCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="bg-muted flex flex-col gap-2 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-yellow-100">
                      <Ruler className="h-3.5 w-3.5 text-yellow-700" />
                    </div>
                    <p className="text-sm">Scanned</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-xl font-medium tabular-nums">
                      {scanCount}
                    </p>
                    <p className="text-xs text-zinc-400">plants</p>
                  </div>
                </div>
              </div>

              {/* Fruit breakdown */}
              <div className="bg-muted mt-2 rounded-xl px-3 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">Scanned Fruit</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-zinc-400">Total:</p>
                    <p className="text-primary text-xs font-semibold tabular-nums">
                      {liveTotalFruits}
                    </p>
                  </div>
                </div>
                <ClassBarList classes={liveClasses} total={liveTotalFruits} />
              </div>

              <div className="my-3 border-t" />

              {/* Captures */}
              <Collapsible open={capturesOpen} onOpenChange={setCapturesOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                      Captured Plants
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {captures.length} scanned
                    </p>
                  </div>
                  {capturesOpen ? (
                    <ChevronUp size={14} className="text-zinc-500" />
                  ) : (
                    <ChevronDown size={14} className="text-zinc-500" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 flex flex-col gap-2">
                  {captures.length === 0 && (
                    <p className="py-4 text-center text-xs text-zinc-500">
                      Waiting for first scan…
                    </p>
                  )}
                  {captures.map((cap) => (
                    <CaptureCard key={cap.plant_id} cap={cap} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </>
          )}

          <div className="my-3 border-t" />
        </>
      )}

      {/* ── Action buttons ── */}
      <div className="flex flex-col gap-2 pb-4">
        {phase === "running" && (
          <>
            <button
              onClick={handleStop}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 py-2.5 text-[12px] font-semibold text-red-500 transition-colors hover:bg-red-500/20"
            >
              <Square size={12} fill="currentColor" />
              Stop Session
            </button>
            <button
              onClick={handleForceReset}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:text-red-500"
              title="Halt the gantry and force this session to stop (use if it's stuck)"
            >
              Force stop &amp; reset
            </button>
          </>
        )}

        {(phase === "complete" || phase === "stopped") && (
          <button
            onClick={onBack}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500/10 py-2.5 text-[12px] font-semibold text-sky-400 transition-colors hover:bg-sky-500/20"
          >
            <CheckCircle2 size={12} />
            Done
          </button>
        )}

        {phase === "error" && (
          <>
            <button
              onClick={handleStart}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500/10 py-2.5 text-[12px] font-semibold text-emerald-500 transition-colors hover:bg-emerald-500/20"
            >
              <Play size={12} fill="currentColor" />
              Retry
            </button>
            <button
              onClick={handleForceReset}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 py-2.5 text-[12px] font-semibold text-red-500 transition-colors hover:bg-red-500/20"
              title="Halt the gantry and force this session to stop (use if it's stuck in RUNNING)"
            >
              <Square size={12} fill="currentColor" />
              Force stop &amp; reset
            </button>
            <button
              onClick={onBack}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 py-2.5 text-[12px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
