"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { piApi } from "@/lib/pi";
import { cn } from "@/lib/utils";

type RelayState = { sol: boolean; dc: boolean };
type Limits = { l1: number; l2: number; l3: number; l4: number };

const LIMIT_LABELS: { key: keyof Limits; label: string; axis: string }[] = [
  { key: "l1", label: "X1 (GPIO 4)",  axis: "X₁" },
  { key: "l2", label: "X2 (GPIO 16)", axis: "X₂" },
  { key: "l3", label: "Y  (GPIO 17)", axis: "Y"  },
  { key: "l4", label: "Z  (GPIO 5)",  axis: "Z"  },
];

export default function HardwarePanel() {
  const [relay, setRelay] = useState<RelayState>({ sol: false, dc: false });
  const [limits, setLimits] = useState<Limits | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [toggling, setToggling] = useState<"sol" | "dc" | null>(null);

  // Poll position for session_active + limits every 1 s
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const [pos, lim] = await Promise.all([
          piApi.gantryPosition(),
          piApi.gantryLimits(),
        ]);
        if (cancelled) return;
        setSessionActive(pos.session_active);
        setLimits(lim);
      } catch {}
    }

    poll();
    const t = setInterval(poll, 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  async function toggle(channel: "sol" | "dc") {
    if (sessionActive || toggling) return;
    const next = !relay[channel];
    setToggling(channel);
    try {
      await piApi.gantryRelay(channel, next);
      setRelay((r) => ({ ...r, [channel]: next }));
    } catch {}
    setToggling(null);
  }

  // LOW (0) = triggered (INPUT_PULLUP)
  const triggered = (v: number | undefined) => v === 0;

  return (
    <Card className="flex-1">
      <CardHeader className="px-4 pt-3 pb-2">
        <CardTitle className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
          Hardware
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-4 pb-4">
        {sessionActive && (
          <p className="rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-500">
            Session running — manual control disabled
          </p>
        )}

        {/* ── Relay toggles ── */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Actuators
          </p>
          <div className="space-y-2">
            <RelayRow
              label="Solenoid Valve"
              sub="sol"
              on={relay.sol}
              loading={toggling === "sol"}
              disabled={sessionActive || toggling !== null}
              onToggle={() => toggle("sol")}
            />
            <RelayRow
              label="Water Pump"
              sub="dc"
              on={relay.dc}
              loading={toggling === "dc"}
              disabled={sessionActive || toggling !== null}
              onToggle={() => toggle("dc")}
            />
          </div>
        </div>

        {/* ── Limit switches ── */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Limit Switches
          </p>
          <div className="space-y-1.5">
            {LIMIT_LABELS.map(({ key, label, axis }) => {
              const hit = triggered(limits?.[key]);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full transition-colors duration-100",
                        limits == null
                          ? "bg-zinc-600"
                          : hit
                            ? "bg-amber-400 shadow-[0_0_5px_2px_rgba(251,191,36,0.4)]"
                            : "bg-zinc-600",
                      )}
                    />
                    <span className="text-[11px] font-mono text-zinc-400">
                      {axis}
                    </span>
                    <span className="text-[11px] text-zinc-500">{label}</span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold tabular-nums",
                      limits == null
                        ? "text-zinc-600"
                        : hit
                          ? "text-amber-400"
                          : "text-zinc-600",
                    )}
                  >
                    {limits == null ? "---" : hit ? "HIT" : "OPEN"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-1.5 text-[9px] text-zinc-600">
            LOW = triggered (INPUT_PULLUP)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Relay toggle row ─────────────────────────────────────────────────────────

function RelayRow({
  label,
  sub,
  on,
  loading,
  disabled,
  onToggle,
}: {
  label: string;
  sub: string;
  on: boolean;
  loading: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
      <div>
        <p className="text-[11px] font-medium">{label}</p>
        <p className="text-[9px] text-zinc-600 font-mono">{sub}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled || loading}
        className={cn(
          "flex h-7 w-14 items-center justify-center rounded-md text-[11px] font-bold transition-colors",
          disabled
            ? "cursor-not-allowed bg-zinc-800 text-zinc-600"
            : on
              ? "bg-green-600 text-white hover:bg-green-500"
              : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-zinc-200",
        )}
      >
        {loading ? "…" : on ? "ON" : "OFF"}
      </button>
    </div>
  );
}
