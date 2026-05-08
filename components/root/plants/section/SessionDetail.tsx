import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Leaf,
  Ruler,
  Loader2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PI_URL, piApi, PiPlantScan, PiSession } from "@/lib/pi";
import { useState } from "react";
import { formatTime, piRipenessToClassCount } from "./SessionSidebar";
import { cn } from "@/lib/utils";
import { ClassCount } from "./LiveSession";
import Image from "next/image";

type FruitClass = "Ripe" | "Unripe" | "Turning" | "Broken";

export default function SessionDetail({
  session,
  onBack,
}: {
  session: PiSession;
  onBack: () => void;
}) {
  const [capturesOpen, setCapturesOpen] = useState(false);
  const [scans, setScans] = useState<PiPlantScan[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);

  const classes = piRipenessToClassCount(session.ripeness);
  const totalFruits = Object.values(classes).reduce((a, b) => a + b, 0);

  // Load plant scans when captures section is opened
  async function loadScans() {
    if (scans.length > 0) return; // already loaded
    setLoadingScans(true);
    try {
      const data = await piApi.getPlants(session.session_id);
      setScans(data);
    } catch {
      // non-critical — just show empty
    } finally {
      setLoadingScans(false);
    }
  }

  function handleCapturesToggle(open: boolean) {
    setCapturesOpen(open);
    if (open) loadScans();
  }

  return (
    <div className="flex flex-col gap-0 pt-4">
      <button
        onClick={onBack}
        className="hover:text-foreground flex items-center gap-2 text-[12px] text-zinc-400 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to sessions
      </button>

      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-foreground text-2xl font-semibold">
          Session {session.session_id}
        </h2>
        <p className="text-xs text-zinc-500">
          {formatTime(session.started_at)} — {formatTime(session.completed_at)}
        </p>
      </div>

      <div className="my-3 border-t" />

      <p className="mb-2.5 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
        Session Summary
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted flex flex-col gap-2 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-100">
              <Leaf className="h-3.5 w-3.5 text-green-700" />
            </div>
            <p className="text-sm">Total Fruits</p>
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-xl font-medium">{totalFruits}</p>
            <p className="text-xs text-zinc-400">
              from {session.total_plants ?? "—"} trees
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
            <p className="text-xl font-medium">
              {session.avg_height_cm ?? "—"}
            </p>
            <p className="text-xs text-zinc-400">cm</p>
          </div>
        </div>
      </div>

      {/* Moisture + water */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="bg-muted rounded-xl p-3">
          <p className="mb-1 text-[10px] text-zinc-500">Avg Moisture</p>
          <p className="text-lg font-medium">
            {session.avg_moisture_pct != null
              ? `${session.avg_moisture_pct}%`
              : "—"}
          </p>
        </div>
        <div className="bg-muted rounded-xl p-3">
          <p className="mb-1 text-[10px] text-zinc-500">Total Watered</p>
          <p className="text-lg font-medium">
            {session.total_water_sec != null
              ? `${session.total_water_sec}s`
              : "—"}
          </p>
        </div>
      </div>

      {/* Harvest ready */}
      {session.harvest_ready_ids && session.harvest_ready_ids.length > 0 && (
        <div className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
          <p className="mb-1 text-[10px] font-semibold text-emerald-400">
            Harvest Ready
          </p>
          <p className="text-[11px] text-emerald-400/80">
            Plants:{" "}
            {session.harvest_ready_ids
              .map((id) => `#${String(id).padStart(2, "0")}`)
              .join(", ")}
          </p>
        </div>
      )}

      {/* Class breakdown */}
      {totalFruits > 0 && (
        <div className="bg-muted mt-2 rounded-xl px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium">Scanned Fruit</p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-zinc-400">Total:</p>
              <p className="text-primary text-xs font-semibold">
                {totalFruits}
              </p>
            </div>
          </div>
          <ClassBarList classes={classes} total={totalFruits} />
        </div>
      )}

      <div className="my-3 border-t" />

      {/* Captures Collapsible */}
      <Collapsible open={capturesOpen} onOpenChange={handleCapturesToggle}>
        <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
              Captured Plants
            </p>
            <p className="text-[11px] text-zinc-400">
              {scans.length > 0 ? `${scans.length} images` : "Tap to load"}
            </p>
          </div>
          {capturesOpen ? (
            <ChevronUp size={14} className="text-zinc-500" />
          ) : (
            <ChevronDown size={14} className="text-zinc-500" />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 flex flex-col gap-2">
          {loadingScans && (
            <div className="flex justify-center py-4">
              <Loader2 size={16} className="animate-spin text-zinc-500" />
            </div>
          )}
          {!loadingScans && scans.length === 0 && (
            <p className="py-4 text-center text-xs text-zinc-500">
              No captures found.
            </p>
          )}
          {scans.map((scan) => (
            <CaptureCard key={scan.plant_id} scan={scan} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

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

function CaptureCard({ scan }: { scan: PiPlantScan }) {
  const classes = scanToClassCount(scan);
  const total = scan.total_fruits ?? 0;

  return (
    <div className="bg-muted flex items-start gap-1 overflow-hidden rounded-lg">
      <div className="relative h-44 w-56 shrink-0 overflow-hidden rounded-s-md bg-zinc-700">
        <div className="absolute top-1 left-1 z-10 rounded-full bg-black/50 px-2 py-0.5">
          <p className="text-[10px] font-medium text-white">
            Plant #{String(scan.plant_id).padStart(2, "0")}
          </p>
        </div>
        {scan.image_url ? (
          <Image
            src={`${PI_URL}${scan.image_url}`}
            alt={`Plant ${scan.plant_id}`}
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
        {/* Extra sensor data */}
        {scan.height_cm != null && (
          <div className="mt-1 flex items-center justify-between border-t pt-1">
            <span className="text-[10px] text-zinc-500">Height</span>
            <span className="text-[10px] text-zinc-400">
              {scan.height_cm} cm
            </span>
          </div>
        )}
        {scan.moisture_pct != null && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Moisture</span>
            <span className="text-[10px] text-zinc-400">
              {scan.moisture_pct}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

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

export function scanToClassCount(scan: PiPlantScan): ClassCount {
  return {
    Ripe: scan.ripe_count ?? 0,
    Unripe: scan.unripe_count ?? 0,
    Turning: scan.turning_count ?? 0,
    Broken: scan.broken_count ?? 0,
  };
}
