"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Droplets, ScanLine } from "lucide-react";

// Single-bed deployment (matches the /schedule page and SessionSidebar).
const BED_ID = 1;

type Run = {
  scheduledFor: string;
  status: "DISPATCHED" | "SKIPPED";
  skipReason: string | null;
  session: { id: number; status: string } | null;
};

type Task = {
  id: number;
  name: string | null;
  sessionType: "SCAN" | "WATERING";
  timeOfDay: string;
  daysOfWeek: number[];
  timezone: string;
  enabled: boolean;
  scanConfig: { name: string } | null;
  wateringConfig: { name: string } | null;
  runs: Run[];
};

type PillVariant = "green" | "orange" | "blue" | "red" | "gray";

// ─── tz helpers (Intl-based, match schedule.service.ts) ─────────────────────────

const DOW: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function localYMD(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // YYYY-MM-DD
}

function localDow(d: Date, tz: string): number {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(d);
  return DOW[wd] ?? 0;
}

function runsToday(task: Task, now: Date): boolean {
  if (task.daysOfWeek.length === 0) return true;
  return task.daysOfWeek.includes(localDow(now, task.timezone));
}

// What to show for today's slot: the run if one exists today, else "upcoming".
function statusFor(task: Task, now: Date): { label: string; variant: PillVariant; title?: string } {
  if (!task.enabled) return { label: "Off", variant: "gray" };

  const today = localYMD(now, task.timezone);
  const run = task.runs.find((r) => localYMD(new Date(r.scheduledFor), task.timezone) === today);

  if (!run) return { label: "Upcoming", variant: "gray" };
  if (run.status === "SKIPPED")
    return { label: "Skipped", variant: "orange", title: run.skipReason ?? undefined };

  const s = run.session?.status;
  switch (s) {
    case "COMPLETED":
      return { label: "Done", variant: "green" };
    case "RUNNING":
      return { label: "Running", variant: "blue" };
    case "ERROR":
      return { label: "Error", variant: "red" };
    case "STOPPED":
      return { label: "Stopped", variant: "orange" };
    default:
      return { label: "Queued", variant: "blue" };
  }
}

// ─── component ──────────────────────────────────────────────────────────────────

export default function ScheduleReminder() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const now = new Date();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/schedules?bedId=${BED_ID}`)
      .then((r) => r.json())
      .then((data: Task[]) => {
        if (!cancelled) setTasks(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const today = (tasks ?? [])
    .filter((t) => runsToday(t, now))
    .sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));

  return (
    <Card className="border-none p-4 shadow-none">
      <div className="flex gap-3">
        {/* Left: title + date */}
        <span className="bg-foreground mt-2 inline-block size-2 rounded-xs" />

        <div className="flex h-full flex-1 flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-semibold">Schedule</p>
            </div>
            <Link
              href="/schedule"
              className="text-muted-foreground text-xs hover:underline"
            >
              Today&apos;s Field Activities
            </Link>
          </div>

          <div className="flex items-end">
            <p className="text-5xl leading-none tracking-tighter">
              {new Date().getDate().toString().padStart(2, "0")}{" "}
            </p>
            <p className="text-muted-foreground text-sm">
              {new Date().toLocaleString("en-GB", { month: "long" })}
            </p>
          </div>
        </div>

        {/* Right: real task list */}
        <div className="flex max-h-44 flex-1 flex-col gap-2 overflow-y-auto">
          {tasks === null ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : today.length === 0 ? (
            <div className="bg-muted/50 flex h-20 items-center justify-center rounded-xl px-2.5 text-center">
              <p className="text-muted-foreground text-[11px]">
                No activities scheduled today.{" "}
                <Link href="/schedule" className="text-primary hover:underline">
                  Plan one
                </Link>
              </p>
            </div>
          ) : (
            today.map((t) => {
              const status = statusFor(t, now);
              const isWatering = t.sessionType === "WATERING";
              const label =
                t.name ?? (isWatering ? "Watering session" : "Ripeness scan");
              const config =
                (isWatering ? t.wateringConfig?.name : t.scanConfig?.name) ??
                "Default config";
              return (
                <div key={t.id} className="bg-muted/50 rounded-xl px-2.5 py-2">
                  <div className="mb-0.5 flex items-start justify-between gap-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      {isWatering ? (
                        <Droplets className="size-3.5 shrink-0 text-sky-500" />
                      ) : (
                        <ScanLine className="size-3.5 shrink-0 text-emerald-500" />
                      )}
                      <p className="truncate leading-tight font-semibold">{label}</p>
                    </div>
                    <StatusPill label={status.label} variant={status.variant} title={status.title} />
                  </div>
                  <p className="text-muted-foreground text-[10px]">
                    <span className="tabular-nums font-medium">{t.timeOfDay}</span> &middot;{" "}
                    {config}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}

function SkeletonRow() {
  return <div className="bg-muted/50 h-20 animate-pulse rounded-xl" />;
}

function StatusPill({
  label,
  variant = "green",
  title,
}: {
  label: string;
  variant?: PillVariant;
  title?: string;
}) {
  const cls = {
    green: "bg-green-600 text-green-100 dark:bg-green-900/40 dark:text-green-400",
    orange: "bg-orange-600 text-orange-100 dark:bg-orange-900/40 dark:text-orange-400",
    blue: "bg-sky-600 text-sky-100 dark:bg-sky-900/40 dark:text-sky-400",
    red: "bg-red-600 text-red-100 dark:bg-red-900/40 dark:text-red-400",
    gray: "bg-zinc-500/80 text-zinc-100 dark:bg-zinc-800 dark:text-zinc-300",
  }[variant];
  return (
    <span
      title={title}
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}
