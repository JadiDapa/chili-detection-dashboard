"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { piApi } from "@/lib/pi";
import { cn } from "@/lib/utils";

type GantryStatus = "idle" | "moving" | "homing" | "error" | "session";

type Pos = { x: number; y: number; z: number };

export default function GantryControl() {
  const [pos, setPos] = useState<Pos | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [status, setStatus] = useState<GantryStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [xIn, setXIn] = useState("0");
  const [yIn, setYIn] = useState("0");
  const [zIn, setZIn] = useState("0");
  const [speedIn, setSpeedIn] = useState("500");

  // Poll position every 2 s when idle
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const state = await piApi.gantryPosition();
        if (!cancelled) {
          setPos({ x: state.x, y: state.y, z: state.z });
          setSessionActive(state.session_active);
        }
      } catch {}
    }

    poll();
    const t = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  function syncInputsFromPos(p: Pos) {
    setXIn(String(p.x));
    setYIn(String(p.y));
    setZIn(String(p.z));
    setPos(p);
  }

  async function handleMove() {
    const x = parseFloat(xIn);
    const y = parseFloat(yIn);
    const z = parseFloat(zIn);
    const speed = parseInt(speedIn) || 500;

    if (isNaN(x) || isNaN(y) || isNaN(z)) return;

    setStatus("moving");
    setErrorMsg(null);
    try {
      const res = await piApi.gantryMove(x, y, z, speed);
      syncInputsFromPos(res.position);
      setStatus("idle");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Move failed");
      setStatus("error");
    }
  }

  async function handleHome() {
    setStatus("homing");
    setErrorMsg(null);
    try {
      const res = await piApi.gantryHome();
      syncInputsFromPos(res.position);
      setStatus("idle");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Homing failed");
      setStatus("error");
    }
  }

  async function handleStop() {
    try {
      const res = await piApi.gantryStop();
      if (res.position) setPos(res.position);
    } catch {}
    setStatus("idle");
    setErrorMsg(null);
  }

  const busy = status === "moving" || status === "homing" || sessionActive;

  return (
    <Card className="flex-1">
      <CardHeader className="px-4 pt-3 pb-2">
        <CardTitle className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
          Gantry Control
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4 pb-4">
        {/* Current position + status */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3 font-mono text-[11px] text-zinc-500">
            {(["x", "y", "z"] as const).map((ax) => (
              <span key={ax}>
                {ax.toUpperCase()}:{" "}
                <span className="font-semibold tabular-nums text-zinc-300">
                  {pos ? pos[ax].toFixed(1) : "---"}
                </span>
              </span>
            ))}
          </div>
          <StatusDot status={sessionActive ? "session" : status} />
        </div>

        {/* Axis inputs */}
        <div className="grid grid-cols-2 gap-2">
          <AxisInput
            label="X (mm)"
            hint="0–6000"
            value={xIn}
            onChange={setXIn}
            min={0}
            max={6000}
            disabled={busy}
          />
          <AxisInput
            label="Y (mm)"
            hint="0–2000"
            value={yIn}
            onChange={setYIn}
            min={0}
            max={2000}
            disabled={busy}
          />
          <AxisInput
            label="Z (mm)"
            hint="0–200"
            value={zIn}
            onChange={setZIn}
            min={0}
            max={200}
            disabled={busy}
          />
          <AxisInput
            label="Speed (mm/min)"
            hint="1–5000"
            value={speedIn}
            onChange={setSpeedIn}
            min={1}
            max={5000}
            disabled={busy}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60"
            disabled={busy}
            onClick={handleMove}
          >
            {status === "moving" ? <Spinner className="h-3.5 w-3.5" /> : "Move"}
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
            disabled={busy}
            onClick={handleHome}
          >
            {status === "homing" ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              "Home All"
            )}
          </Button>
        </div>

        {/* Emergency stop */}
        <Button
          size="sm"
          className="w-full bg-red-600 font-semibold hover:bg-red-500"
          onClick={handleStop}
        >
          ⏹ Stop
        </Button>

        {/* Error message */}
        {status === "error" && errorMsg && (
          <p className="text-[11px] text-red-400">{errorMsg}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }: { status: GantryStatus }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn("h-2 w-2 rounded-full transition-colors", {
          "bg-green-500": status === "idle",
          "bg-amber-400 animate-pulse": status === "moving" || status === "homing",
          "bg-red-500": status === "error",
          "bg-zinc-500": status === "session",
        })}
      />
      <span className="text-[10px] text-zinc-500 capitalize">{status}</span>
    </div>
  );
}

function AxisInput({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  disabled,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <label className="text-[10px] text-zinc-500">{label}</label>
        <span className="text-[9px] text-zinc-600">{hint}</span>
      </div>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-7 text-xs"
      />
    </div>
  );
}
