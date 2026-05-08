"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Leaf,
  Loader2,
  Play,
  Radio,
  Ruler,
  Square,
  WifiOff,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { piApi, PI_URL, SSEEvent, PiDetection } from "@/lib/pi";
import Image from "next/image";

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
  classes: ClassCount;
  height_cm?: number | null; // ← add
  moisture_pct?: number | null; // ← add
}

// Phase:
//  idle      → waiting for user to press Start
//  creating  → POST /sessions + POST /sessions/{id}/start in flight
//  running   → SSE connected, scanning in progress
//  complete  → session_complete event received
//  stopped   → user pressed Stop
//  error     → any fetch/SSE failure
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
      <div className="relative h-44 w-56 shrink-0 overflow-hidden rounded-s-md bg-zinc-700">
        <div className="absolute top-1 left-1 z-10 rounded-full bg-black/50 px-2 py-0.5">
          <p className="text-[10px] font-medium text-white">
            Plant #{String(cap.plant_id).padStart(2, "0")}
          </p>
        </div>
        {cap.image_url ? (
          <Image
            src={`${PI_URL}${cap.image_url}`}
            alt={`Plant ${cap.plant_id}`}
            unoptimized
            className="object-cover object-center"
            fill
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-[10px] text-zinc-500">No image</span>
          </div>
        )}
      </div>
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
        {/* Extra sensor data */}
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
  sessionId: string; // ← pass in from parent
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LiveSession({
  onBack,
  sessionId: initialSessionId,
}: LiveSessionProps) {
  const [sessionId, setSessionId] = useState<string>(initialSessionId);

  const TOTAL_PLANTS = 16;

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const [scanCount, setScanCount] = useState(0);
  const [currentPlantId, setCurrentPlantId] = useState<number | null>(null);
  const [avgHeight, setAvgHeight] = useState<number | null>(null);
  const [captures, setCaptures] = useState<LiveCapture[]>([]);
  const [capturesOpen, setCapturesOpen] = useState(true);

  const esRef = useRef<EventSource | null>(null);
  const capturesRef = useRef<LiveCapture[]>([]);
  const [startTime, setStartTime] = useState<string | null>(null);

  // Keep ref in sync for use inside SSE closure
  useEffect(() => {
    capturesRef.current = captures;
  }, [captures]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      esRef.current?.close();
    };
  }, []);

  function handleEvent(event: SSEEvent) {
    switch (event.type) {
      case "gantry_moved":
        setCurrentPlantId(event.plant_id);
        break;

      case "plant_scanned":
        setCaptures((prev) => {
          const entry: LiveCapture = {
            plant_id: event.plant_id,
            image_url: event.image_url,
            classes: detectionsToClassCount(event.detections),
            height_cm: event.height_cm ?? null, // ← add
            moisture_pct: event.moisture_pct ?? null, // ← add
          };
          const exists = prev.find((c) => c.plant_id === event.plant_id);
          return exists
            ? prev.map((c) => (c.plant_id === event.plant_id ? entry : c))
            : [...prev, entry];
        });
        break;

      case "sensor_read":
        setAvgHeight((prev) => {
          const n = capturesRef.current.length + 1;
          if (prev === null) return event.height_cm;
          return Math.round(((prev * (n - 1) + event.height_cm) / n) * 10) / 10;
        });
        break;

      case "plant_watered":
        setScanCount((c) => c + 1);
        setCurrentPlantId(null);
        break;

      case "session_complete":
        setPhase("complete");
        setCurrentPlantId(null);
        esRef.current?.close();
        break;

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

    try {
      await piApi.startSession(sessionId);

      const existingScans = await piApi.getPlants(sessionId);
      if (existingScans.length > 0) {
        const hydratedCaptures: LiveCapture[] = existingScans.map((scan) => ({
          plant_id: scan.plant_id,
          image_url: scan.image_url,
          classes: {
            Ripe: scan.ripe_count ?? 0,
            Unripe: scan.unripe_count ?? 0,
            Turning: scan.turning_count ?? 0,
            Broken: scan.broken_count ?? 0,
          },
          height_cm: scan.height_cm ?? null,
          moisture_pct: scan.moisture_pct ?? null,
        }));
        setCaptures(hydratedCaptures);
        setScanCount(existingScans.length);

        const heights = existingScans
          .map((s) => s.height_cm)
          .filter((h): h is number => h != null);
        if (heights.length > 0) {
          setAvgHeight(
            Math.round(
              (heights.reduce((a, b) => a + b, 0) / heights.length) * 10,
            ) / 10,
          );
        }
      } else {
        setScanCount(0);
        setAvgHeight(null);
        setCaptures([]);
      }

      // 2. Connect SSE — new events append on top of hydrated data
      const es = piApi.connectEvents(sessionId, handleEvent, () => {
        setPhase("error");
        setError(
          `Lost connection to Pi. Check that it is online at ${PI_URL}.`,
        );
      });
      esRef.current = es;
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

  // ── SSE handler ─────────────────────────────────────────────────────────────

  // ── Stop ────────────────────────────────────────────────────────────────────
  async function handleStop() {
    if (!sessionId) return;
    try {
      esRef.current?.close();
      await piApi.stopSession(sessionId);
      setPhase("stopped");
      setCurrentPlantId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop session");
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const isComplete = phase === "complete";
  const isEnded =
    phase === "stopped" || phase === "error" || phase === "complete";
  const pct = Math.round((scanCount / TOTAL_PLANTS) * 100);
  const liveClasses = sumClasses(captures);
  const liveTotalFruits = Object.values(liveClasses).reduce((a, b) => a + b, 0);

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
          <h2 className="text-foreground text-xl font-semibold">New Session</h2>
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
              <Play
                size={22}
                className="text-primary ml-0.5"
                fill="currentColor"
              />
            </div>
            <p className="text-foreground text-sm font-semibold">
              Ready to scan
            </p>
            <p className="text-muted-foreground mt-1 text-[11px]">
              The gantry will home, then scan all {TOTAL_PLANTS} plants in
              sequence.
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
          {/* Progress */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                Scanning Progress
              </p>
              <span className="text-[11px] text-zinc-400">
                {scanCount} / {TOTAL_PLANTS} Tree
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
              {currentPlantId && !isEnded
                ? `Scanning Plant #${String(currentPlantId).padStart(2, "0")}…`
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
                <p className="text-sm">Avg Height</p>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-xl font-medium tabular-nums">
                  {avgHeight ?? "—"}
                </p>
                <p className="text-xs text-zinc-400">cm</p>
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

          <div className="my-3 border-t" />
        </>
      )}

      {/* ── Action buttons ── */}
      <div className="flex flex-col gap-2 pb-4">
        {phase === "running" && (
          <button
            onClick={handleStop}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 py-2.5 text-[12px] font-semibold text-red-500 transition-colors hover:bg-red-500/20"
          >
            <Square size={12} fill="currentColor" />
            Stop Session
          </button>
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
