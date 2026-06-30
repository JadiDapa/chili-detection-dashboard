"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { piApi } from "@/lib/pi";
import { getBedAction } from "@/app/actions/bed.actions";

type Grid = {
  rows: number;
  cols: number;
  gapXMm: number;
  gapYMm: number;
  startXMm: number;
  startYMm: number;
};

// Travel speed (mm/min) used when jogging to a plant. Z is always dropped to 0
// (raised) so the gantry clears the canopy while it moves.
const TRAVEL_SPEED = 1500;

// A tap-to-move plant grid: shows the bed's plant layout and, on click, moves the
// gantry to that plant's X/Y (computed from the bed's first-plant + gaps), Z=0.
// Mirrors the ScanningResultChart grid but for manual positioning. Disabled while
// a session is running (the gantry is busy).
export default function GantryPlantGrid({ bedId = 1 }: { bedId?: number }) {
  const [grid, setGrid] = useState<Grid | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [movingPlant, setMovingPlant] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBedAction(bedId)
      .then((bed) => {
        if (bed)
          setGrid({
            rows: bed.rows,
            cols: bed.cols,
            gapXMm: bed.gapXMm,
            gapYMm: bed.gapYMm,
            startXMm: bed.startXMm,
            startYMm: bed.startYMm,
          });
      })
      .catch(() => setError("Failed to load grid"))
      .finally(() => setLoading(false));
  }, [bedId]);

  // Poll only to know whether a session is active (so we can disable jogging).
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const state = await piApi.gantryPosition();
        if (!cancelled) setSessionActive(state.session_active);
      } catch {}
    }
    poll();
    const t = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  async function moveToPlant(plantNo: number, row: number, col: number) {
    if (!grid || sessionActive || movingPlant != null) return;
    const x = grid.startXMm + col * grid.gapXMm;
    const y = grid.startYMm + row * grid.gapYMm;
    setMovingPlant(plantNo);
    setError(null);
    try {
      await piApi.gantryMove(x, y, 0, TRAVEL_SPEED);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Move failed");
    } finally {
      setMovingPlant(null);
    }
  }

  return (
    <Card className="flex-1">
      <CardHeader className="px-4 pt-3 pb-2">
        <CardTitle className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
          Move to Plant
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : !grid ? (
          <p className="py-4 text-center text-[11px] text-zinc-500">
            No grid configured for this bed.
          </p>
        ) : (
          <>
            <p className="text-[11px] text-zinc-500">
              Tap a plant to move the gantry there (Z raised to 0).
              {sessionActive && (
                <span className="text-amber-500"> Disabled — session running.</span>
              )}
            </p>
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: grid.rows * grid.cols }, (_, i) => {
                const row = Math.floor(i / grid.cols);
                const col = i % grid.cols;
                const plantNo = i + 1;
                const isMoving = movingPlant === plantNo;
                const x = grid.startXMm + col * grid.gapXMm;
                const y = grid.startYMm + row * grid.gapYMm;
                return (
                  <button
                    key={plantNo}
                    type="button"
                    disabled={sessionActive || movingPlant != null}
                    onClick={() => moveToPlant(plantNo, row, col)}
                    title={`Plant ${plantNo} → X ${x}, Y ${y} mm`}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center rounded-md border text-[11px] font-semibold tabular-nums transition-colors",
                      "border-border/60 bg-muted hover:bg-primary/10 hover:border-primary/50",
                      "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-muted",
                      isMoving && "border-primary bg-primary/15",
                    )}
                  >
                    {isMoving ? (
                      <Spinner className="h-3.5 w-3.5" />
                    ) : (
                      String(plantNo).padStart(2, "0")
                    )}
                  </button>
                );
              })}
            </div>

            {error && <p className="text-[11px] text-red-400">{error}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
