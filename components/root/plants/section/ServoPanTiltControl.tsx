"use client";

import { useEffect, useState, useRef } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { piApi } from "@/lib/pi";
import { cn } from "@/lib/utils";

const STEP = 10;
const clamp = (v: number) => Math.max(0, Math.min(180, v));

export default function ServoPanTiltControl() {
  const [pan, setPan] = useState(90);
  const [tilt, setTilt] = useState(90);
  const [panInput, setPanInput] = useState("90");
  const [tiltInput, setTiltInput] = useState("90");
  const [busy, setBusy] = useState(false);

  // Use refs to avoid stale closure issues in debounced send
  const panRef = useRef(pan);
  const tiltRef = useRef(tilt);

  useEffect(() => {
    panRef.current = pan;
    tiltRef.current = tilt;
  }, [pan, tilt]);

  useEffect(() => {
    piApi
      .getServoAngles()
      .then(({ pan: p, tilt: t }) => {
        setPan(p);
        setTilt(t);
        setPanInput(String(p));
        setTiltInput(String(t));
      })
      .catch(() => {});
  }, []);

  async function send(newPan: number, newTilt: number) {
    const p = clamp(newPan);
    const t = clamp(newTilt);
    setPan(p);
    setTilt(t);
    setPanInput(String(p));
    setTiltInput(String(t));
    setBusy(true);
    try {
      await piApi.setServoAngles(p, t);
    } catch {}
    setBusy(false);
  }

  function commitPanInput() {
    const v = parseInt(panInput, 10);
    if (!isNaN(v)) send(v, tiltRef.current);
    else setPanInput(String(panRef.current));
  }

  function commitTiltInput() {
    const v = parseInt(tiltInput, 10);
    if (!isNaN(v)) send(panRef.current, v);
    else setTiltInput(String(tiltRef.current));
  }

  return (
    <Card className="flex-1">
      <CardHeader className="px-4 pt-3 pb-2">
        <CardTitle className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
          Servo Pan / Tilt
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-4 pb-4">
        {/* D-pad */}
        <div className="flex flex-col items-center gap-1">
          {/* Up (tilt up = smaller angle) */}
          <Button
            size="icon"
            variant="outline"
            className="size-12"
            disabled={busy}
            onClick={() => send(pan, tilt - STEP)}
            title="Tilt up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {/* Pan left */}
            <Button
              size="icon"
              variant="outline"
              className="size-12"
              disabled={busy}
              onClick={() => send(pan - STEP, tilt)}
              title="Pan left"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Center indicator */}
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                busy
                  ? "border-primary/60 bg-primary/10"
                  : "border-zinc-300 dark:border-zinc-600",
              )}
            >
              <Crosshair
                className={cn(
                  "h-4 w-4 transition-colors",
                  busy ? "text-primary animate-pulse" : "text-zinc-400",
                )}
              />
            </div>

            {/* Pan right */}
            <Button
              size="icon"
              variant="outline"
              className="size-12"
              disabled={busy}
              onClick={() => send(pan + STEP, tilt)}
              title="Pan right"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Down (tilt down = larger angle) */}
          <Button
            size="icon"
            variant="outline"
            className="size-12"
            disabled={busy}
            onClick={() => send(pan, tilt + STEP)}
            title="Tilt down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Current angle display */}
        <div className="flex justify-center gap-6 text-[11px] text-zinc-500">
          <span>
            Pan:{" "}
            <span className="font-semibold text-zinc-300 tabular-nums">
              {pan}°
            </span>
          </span>
          <span>
            Tilt:{" "}
            <span className="font-semibold text-zinc-300 tabular-nums">
              {tilt}°
            </span>
          </span>
        </div>

        {/* Numeric inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-500">
              Pan °&nbsp;(0–180)
            </label>
            <Input
              type="number"
              min={0}
              max={180}
              className="h-7 text-xs"
              value={panInput}
              onChange={(e) => setPanInput(e.target.value)}
              onBlur={commitPanInput}
              onKeyDown={(e) => e.key === "Enter" && commitPanInput()}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-500">
              Tilt °&nbsp;(0–180)
            </label>
            <Input
              type="number"
              min={0}
              max={180}
              className="h-7 text-xs"
              value={tiltInput}
              onChange={(e) => setTiltInput(e.target.value)}
              onBlur={commitTiltInput}
              onKeyDown={(e) => e.key === "Enter" && commitTiltInput()}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
