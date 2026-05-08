"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const DEFAULT_ESP32 = "http://172.26.188.28";

type LogItem = {
  ts: number;
  path: string;
  status?: number;
  ok?: boolean;
  ms?: number;
  text?: string;
  error?: string;
};

type Limits = { l1: number; l2: number; l3: number; l4: number };

type Pos = {
  x: number;
  y: number;
  z: number;
  x1s?: number;
  x2s?: number;
  ys?: number;
  zs?: number;
};

type HomeResult = { ok: boolean; x: boolean; y: boolean; z: boolean };

// NEW
type TofReading = {
  ok: boolean;
  mm: number | null;
  status: "valid" | "error" | "no_data";
  range_status?: number;
  error?: string;
};

function cx(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

function Pill({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
        good === undefined
          ? "border-border bg-muted/30"
          : good
            ? "border-green-500/40 bg-green-500/10 text-green-700"
            : "border-red-500/40 bg-red-500/10 text-red-700",
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function SensorLight({
  label,
  triggered,
}: {
  label: string;
  triggered: boolean;
}) {
  return (
    <div className="bg-background flex items-center justify-between rounded-xl border p-3">
      <div className="text-sm">{label}</div>
      <div className="flex items-center gap-2">
        <span
          className={cx(
            "h-2.5 w-2.5 rounded-full transition-colors duration-150",
            triggered
              ? "bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.5)]"
              : "bg-slate-400",
          )}
        />
        <span
          className={cx(
            "font-mono text-xs",
            triggered
              ? "font-semibold text-amber-500"
              : "text-muted-foreground",
          )}
        >
          {triggered ? "TRIGGERED" : "OPEN"}
        </span>
      </div>
    </div>
  );
}

function HomingStatus({ result }: { result: HomeResult | null }) {
  if (!result) return null;
  const axes = [
    { label: "X", ok: result.x },
    { label: "Y", ok: result.y },
    { label: "Z", ok: result.z },
  ];
  return (
    <div
      className={cx(
        "mt-3 rounded-xl border p-3 text-xs",
        result.ok
          ? "border-green-500/30 bg-green-500/10"
          : "border-red-500/30 bg-red-500/10",
      )}
    >
      <div className="mb-1 font-semibold">
        {result.ok ? "✓ Homing complete" : "✗ Homing failed"}
      </div>
      <div className="flex gap-3">
        {axes.map((a) => (
          <span key={a.label} className="flex items-center gap-1">
            <span
              className={cx(
                "h-2 w-2 rounded-full",
                a.ok ? "bg-green-500" : "bg-red-500",
              )}
            />
            <span className="font-mono">{a.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// NEW: TOF display card
function TofCard({
  tof,
  onRefresh,
}: {
  tof: TofReading | null;
  onRefresh: () => void;
}) {
  const isValid = tof?.status === "valid";
  const mm = tof?.mm ?? null;

  // Simple bar: VL53L1X long-range goes up to ~4000 mm
  const MAX_MM = 4000;
  const barPct = mm != null && isValid ? Math.min((mm / MAX_MM) * 100, 100) : 0;

  return (
    <div className="bg-card rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-muted-foreground text-xs tracking-wider uppercase">
          TOF Distance (VL53L1X)
        </div>
        <Button onClick={onRefresh}>Refresh</Button>
      </div>

      {/* Big reading */}
      <div className="flex items-end gap-2">
        <span
          className={cx(
            "font-mono text-4xl font-bold tabular-nums",
            !tof
              ? "text-muted-foreground"
              : isValid
                ? "text-cyan-500"
                : "text-red-500",
          )}
        >
          {!tof
            ? "---"
            : mm == null
              ? "---"
              : isValid
                ? mm.toLocaleString()
                : "ERR"}
        </span>
        <span className="text-muted-foreground mb-1 text-sm">mm</span>
        {mm != null && isValid && (
          <span className="text-muted-foreground mb-1 font-mono text-xs">
            ({(mm / 10).toFixed(1)} cm)
          </span>
        )}
      </div>

      {/* Distance bar */}
      <div className="bg-muted mt-3 h-2 w-full overflow-hidden rounded-full">
        <div
          className={cx(
            "h-full rounded-full transition-all duration-200",
            isValid ? "bg-cyan-500" : "bg-slate-500",
          )}
          style={{ width: `${barPct}%` }}
        />
      </div>
      <div className="text-muted-foreground mt-1 flex justify-between font-mono text-[10px]">
        <span>0</span>
        <span>4000 mm</span>
      </div>

      {/* Status row */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={cx(
            "h-2 w-2 rounded-full",
            !tof
              ? "bg-slate-400"
              : isValid
                ? "bg-green-500"
                : tof.status === "no_data"
                  ? "bg-amber-400"
                  : "bg-red-500",
          )}
        />
        <span className="font-mono text-xs">
          {!tof
            ? "no reading"
            : tof.error
              ? tof.error
              : tof.status === "no_data"
                ? "waiting for data…"
                : isValid
                  ? `valid  (range_status: ${tof.range_status ?? 0})`
                  : `error  (range_status: ${tof.range_status ?? "?"})`}
        </span>
      </div>
    </div>
  );
}

export default function ESP32Console() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_ESP32);

  // status
  const [last, setLast] = useState<LogItem | null>(null);
  const [history, setHistory] = useState<LogItem[]>([]);
  const [lastSeen, setLastSeen] = useState<number | null>(null);

  // controls state
  const [driversEnabled, setDriversEnabled] = useState<boolean>(false);
  const [relaySol, setRelaySol] = useState(false);
  const [relayDc, setRelayDc] = useState(false);

  // stepper panel
  const [speed, setSpeed] = useState(150);
  const [accel, setAccel] = useState(300);
  const [pos, setPos] = useState<Pos | null>(null);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [z, setZ] = useState(0);

  // homing
  const [homing, setHoming] = useState(false);
  const [homeResult, setHomeResult] = useState<HomeResult | null>(null);

  // stop flash
  const [stopped, setStopped] = useState(false);

  // sensors
  const [limits, setLimits] = useState<Limits | null>(null);
  const [autoPoll, setAutoPoll] = useState(true);

  // NEW: TOF
  const [tof, setTof] = useState<TofReading | null>(null);

  async function call(path: string) {
    const start = performance.now();
    try {
      const res = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
      const text = await res.text();
      const ms = Math.round(performance.now() - start);
      const item: LogItem = {
        ts: Date.now(),
        path,
        status: res.status,
        ok: res.ok,
        ms,
        text,
      };
      setLast(item);
      setLastSeen(Date.now());
      setHistory((h) => [item, ...h].slice(0, 30));
      return item;
    } catch (e: any) {
      const ms = Math.round(performance.now() - start);
      const item: LogItem = {
        ts: Date.now(),
        path,
        ms,
        ok: false,
        error: e?.message ?? "Unknown error",
      };
      setLast(item);
      setHistory((h) => [item, ...h].slice(0, 30));
      throw e;
    }
  }

  async function ping() {
    const item = await call("/health");
    return item.ok;
  }

  async function setDrivers(on: boolean) {
    await call(`/en?on=${on ? 1 : 0}`);
    setDriversEnabled(on);
  }

  async function setRelay(ch: "sol" | "dc", on: boolean) {
    await call(`/relay?ch=${ch}&on=${on ? 1 : 0}`);
    if (ch === "sol") setRelaySol(on);
    if (ch === "dc") setRelayDc(on);
  }

  async function readLimits() {
    const item = await call("/limits");
    try {
      const data = JSON.parse(item.text ?? "{}");
      if (typeof data.l1 === "number") {
        setLimits({
          l1: data.l1,
          l2: data.l2,
          l3: data.l3,
          l4: data.l4 ?? 1,
        });
      }
    } catch {}
  }

  async function readPos() {
    const item = await call("/pos");
    try {
      const data = JSON.parse(item.text ?? "{}");
      if (
        typeof data.x === "number" &&
        typeof data.y === "number" &&
        typeof data.z === "number"
      ) {
        setPos(data);
      }
    } catch {}
  }

  // NEW: read TOF
  async function readTof() {
    try {
      const item = await call("/tof");
      const data = JSON.parse(item.text ?? "{}");
      setTof(data as TofReading);
    } catch {}
  }

  async function moveAbs() {
    await call(`/move?x=${x}&y=${y}&z=${z}&speed=${speed}&accel=${accel}`);
  }

  async function emergencyStop() {
    try {
      await call("/stop");
    } catch {}
    setStopped(true);
    setTimeout(() => setStopped(false), 1500);
  }

  async function homeAxis(axis: "x" | "y" | "z" | "all") {
    setHoming(true);
    setHomeResult(null);
    try {
      const path = axis === "all" ? "/home" : `/home?axis=${axis}`;
      const item = await call(path);
      const data = JSON.parse(item.text ?? "{}");
      setHomeResult({
        ok: data.ok === true,
        x: data.x !== false,
        y: data.y !== false,
        z: data.z !== false,
      });
      await readPos();
    } catch {
      setHomeResult({ ok: false, x: false, y: false, z: false });
    } finally {
      setHoming(false);
    }
  }

  // NEW: poll TOF at 250 ms alongside limits + pos
  useEffect(() => {
    if (!autoPoll) return;
    const t = setInterval(() => {
      readLimits().catch(() => {});
      readPos().catch(() => {});
      readTof().catch(() => {});
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPoll, baseUrl]);

  const connected = useMemo(() => {
    if (!lastSeen) return false;
    return Date.now() - lastSeen < 5000;
  }, [lastSeen]);

  const lTriggered = (v: number | undefined) => v === 0;

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Top bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              ESP32 Control Panel
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Pill label="Target" value={baseUrl} />
              <Pill
                label="Link"
                value={connected ? "ONLINE" : "OFFLINE"}
                good={connected}
              />
              <Pill
                label="Last"
                value={last?.ms != null ? `${last.ms} ms` : "-"}
                good={last?.ok}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={ping}>Ping</Button>
            <Button
              onClick={emergencyStop}
              className={cx(
                "font-bold transition-all duration-150",
                stopped
                  ? "scale-95 bg-orange-500 hover:bg-orange-400"
                  : "bg-red-600 hover:bg-red-500",
              )}
            >
              {stopped ? "⛔ STOPPED" : "EMERGENCY STOP"}
            </Button>
          </div>
        </div>

        {/* Connection card */}
        <div className="bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground text-xs tracking-wider uppercase">
            Connection
          </div>
          <div className="mt-3 flex flex-col gap-3 md:flex-row">
            <input
              className="bg-background flex-1 rounded-lg border px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-cyan-500"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://<esp32-ip>"
            />
            <div className="flex gap-2">
              <Button onClick={() => ping()}>Health</Button>
              <Button
                onClick={() => setAutoPoll((v) => !v)}
                className={cx(
                  autoPoll
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-slate-700 hover:bg-slate-600",
                )}
              >
                {autoPoll ? "Auto Poll: ON" : "Auto Poll: OFF"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT: Drivers + Actuators */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-card rounded-2xl border p-4">
              <div className="text-muted-foreground text-xs tracking-wider uppercase">
                Drivers
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">DRV8825 Enable</div>
                  <div className="text-muted-foreground text-xs">
                    Enables all steppers (shared EN)
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setDrivers(true)}
                    className="bg-green-600 hover:bg-green-500"
                  >
                    ON
                  </Button>
                  <Button
                    onClick={() => setDrivers(false)}
                    className="bg-slate-700 hover:bg-slate-600"
                  >
                    OFF
                  </Button>
                </div>
              </div>
              <div className="text-muted-foreground mt-3 font-mono text-xs">
                state: {driversEnabled ? "ENABLED" : "DISABLED"}
              </div>
            </div>

            <div className="bg-card rounded-2xl border p-4">
              <div className="text-muted-foreground text-xs tracking-wider uppercase">
                Actuators
              </div>
              <div className="mt-3 space-y-3">
                <div className="bg-background flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <div className="text-sm font-medium">Solenoid Valve</div>
                    <div className="text-muted-foreground text-xs">GPIO18</div>
                  </div>
                  <Button
                    onClick={() => setRelay("sol", !relaySol)}
                    className={cx(
                      relaySol
                        ? "bg-green-600 hover:bg-green-500"
                        : "bg-slate-700 hover:bg-slate-600",
                    )}
                  >
                    {relaySol ? "ON" : "OFF"}
                  </Button>
                </div>

                <div className="bg-background flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <div className="text-sm font-medium">Water Pump</div>
                    <div className="text-muted-foreground text-xs">GPIO19</div>
                  </div>
                  <Button
                    onClick={() => setRelay("dc", !relayDc)}
                    className={cx(
                      relayDc
                        ? "bg-green-600 hover:bg-green-500"
                        : "bg-slate-700 hover:bg-slate-600",
                    )}
                  >
                    {relayDc ? "ON" : "OFF"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE: Motion + Homing */}
          <div className="space-y-6 lg:col-span-1">
            {/* Move XYZ */}
            <div className="bg-card rounded-2xl border p-4">
              <div className="text-muted-foreground mb-3 text-xs tracking-wider uppercase">
                Move XYZ (Absolute)
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Pill label="X" value={pos ? `${pos.x.toFixed(2)} mm` : "-"} />
                <Pill label="Y" value={pos ? `${pos.y.toFixed(2)} mm` : "-"} />
                <Pill label="Z" value={pos ? `${pos.z.toFixed(2)} mm` : "-"} />
              </div>

              <div className="grid gap-3">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "X (mm)", val: x, set: setX },
                    { label: "Y (mm)", val: y, set: setY },
                    { label: "Z (mm)", val: z, set: setZ },
                  ].map(({ label, val, set }) => (
                    <div
                      key={label}
                      className="bg-background rounded-xl border p-3"
                    >
                      <div className="text-muted-foreground text-xs">
                        {label}
                      </div>
                      <input
                        type="number"
                        className="bg-card mt-1 w-full rounded-lg border px-2 py-1.5 font-mono text-sm"
                        value={val}
                        onChange={(e) => set(Number(e.target.value))}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background rounded-xl border p-3">
                    <div className="text-muted-foreground text-xs">
                      Speed (mm/s)
                    </div>
                    <input
                      type="number"
                      className="bg-card mt-1 w-full rounded-lg border px-2 py-1.5 font-mono text-sm"
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                      min={1}
                      max={5000}
                    />
                  </div>
                  <div className="bg-background rounded-xl border p-3">
                    <div className="text-muted-foreground text-xs">
                      Accel (mm/s²)
                    </div>
                    <input
                      type="number"
                      className="bg-card mt-1 w-full rounded-lg border px-2 py-1.5 font-mono text-sm"
                      value={accel}
                      onChange={(e) => setAccel(Number(e.target.value))}
                      min={1}
                      max={20000}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={moveAbs}
                    className="bg-cyan-600 hover:bg-cyan-500"
                  >
                    MOVE
                  </Button>
                  <Button
                    onClick={readPos}
                    className="bg-slate-700 hover:bg-slate-600"
                  >
                    Refresh Pos
                  </Button>
                </div>
              </div>
            </div>

            {/* Homing */}
            <div className="bg-card rounded-2xl border p-4">
              <div className="text-muted-foreground mb-3 text-xs tracking-wider uppercase">
                Homing
              </div>

              <div className="text-muted-foreground mb-3 text-xs">
                Moves each axis toward its limit switch, backs off, then zeroes
                position. Order: <span className="font-mono">Z → Y → X</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => homeAxis("all")}
                  disabled={homing}
                  className={cx(
                    "col-span-2 font-semibold",
                    homing
                      ? "animate-pulse bg-amber-600 hover:bg-amber-500"
                      : "bg-indigo-600 hover:bg-indigo-500",
                  )}
                >
                  {homing ? "⏳ Homing…" : "HOME ALL AXES"}
                </Button>

                {(["x", "y", "z"] as const).map((ax) => (
                  <Button
                    key={ax}
                    onClick={() => homeAxis(ax)}
                    disabled={homing}
                    className="bg-slate-700 font-mono hover:bg-slate-600"
                  >
                    Home {ax.toUpperCase()}
                  </Button>
                ))}
              </div>

              <HomingStatus result={homeResult} />
            </div>
          </div>

          {/* RIGHT: TOF + Limit Switches + Log */}
          <div className="space-y-6 lg:col-span-1">
            {/* NEW: TOF card */}
            <TofCard tof={tof} onRefresh={readTof} />

            <div className="bg-card rounded-2xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-muted-foreground text-xs tracking-wider uppercase">
                  Limit Switches
                </div>
                <Button onClick={readLimits}>Refresh</Button>
              </div>

              <div className="space-y-2">
                <SensorLight
                  label="LS 1 — X1 (GPIO 4)"
                  triggered={lTriggered(limits?.l1)}
                />
                <SensorLight
                  label="LS 2 — X2 (GPIO 16)"
                  triggered={lTriggered(limits?.l2)}
                />
                <SensorLight
                  label="LS 3 — Y  (GPIO 17)"
                  triggered={lTriggered(limits?.l3)}
                />
                <SensorLight
                  label="LS 4 — Z  (GPIO 5)"
                  triggered={lTriggered(limits?.l4)}
                />
              </div>

              <div className="text-muted-foreground mt-3 text-xs">
                Triggered = LOW (switch pressed, INPUT_PULLUP)
              </div>
            </div>

            <div className="bg-card rounded-2xl border p-4">
              <div className="text-muted-foreground mb-3 text-xs tracking-wider uppercase">
                Event Log
              </div>

              <div className="space-y-2">
                {history.slice(0, 10).map((h, i) => (
                  <div
                    key={i}
                    className="bg-background rounded-xl border p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="max-w-[140px] truncate font-mono">
                        {h.path}
                      </span>
                      <span
                        className={cx(
                          "shrink-0 font-mono",
                          h.ok ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {h.ok ? "OK" : "ERR"} {h.ms ?? "-"}ms
                      </span>
                    </div>
                    {(h.error || h.text) && (
                      <div className="text-muted-foreground mt-2 line-clamp-2 font-mono text-[11px] whitespace-pre-wrap">
                        {h.error ?? h.text}
                      </div>
                    )}
                  </div>
                ))}

                {history.length === 0 && (
                  <div className="text-muted-foreground text-sm">
                    No activity yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
