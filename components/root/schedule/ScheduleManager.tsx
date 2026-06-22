"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarClock, Droplets, Pencil, Plus, ScanLine, Trash2 } from "lucide-react";
import {
  createScheduledTaskAction,
  deleteScheduledTaskAction,
  setScheduledTaskEnabledAction,
  updateScheduledTaskAction,
} from "@/app/actions/schedule.actions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScheduleRunView = {
  id: number;
  scheduledFor: string;
  status: "DISPATCHED" | "SKIPPED";
  skipReason: string | null;
  sessionId: number | null;
  sessionStatus: string | null;
};

export type ScheduleTaskView = {
  id: number;
  name: string | null;
  sessionType: "SCAN" | "WATERING";
  scanConfigId: number | null;
  wateringConfigId: number | null;
  configName: string | null;
  timeOfDay: string;
  daysOfWeek: number[];
  timezone: string;
  enabled: boolean;
  nextRunAt: string | null;
  runs: ScheduleRunView[];
};

type ConfigOption = { id: number; name: string; isDefault: boolean };

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Manager ──────────────────────────────────────────────────────────────────

export default function ScheduleManager({
  bedId,
  tasks,
}: {
  bedId: number;
  tasks: ScheduleTaskView[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleTaskView | null>(null);
  const [, startTransition] = useTransition();

  const watering = tasks.filter((t) => t.sessionType === "WATERING");
  const scans = tasks.filter((t) => t.sessionType === "SCAN");

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(task: ScheduleTaskView) {
    setEditing(task);
    setDialogOpen(true);
  }

  function toggleEnabled(task: ScheduleTaskView, enabled: boolean) {
    startTransition(async () => {
      await setScheduledTaskEnabledAction(task.id, enabled);
      router.refresh();
    });
  }

  function remove(task: ScheduleTaskView) {
    if (!confirm(`Delete this ${task.sessionType.toLowerCase()} schedule?`)) return;
    startTransition(async () => {
      await deleteScheduledTaskAction(task.id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Add schedule
        </Button>
      </div>

      {tasks.length === 0 && (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No schedules yet. Add a watering or scan task to run the gantry automatically.
        </div>
      )}

      <ScheduleGroup
        title="Watering"
        icon={<Droplets className="h-4 w-4 text-sky-500" />}
        tasks={watering}
        onEdit={openEdit}
        onToggle={toggleEnabled}
        onDelete={remove}
      />
      <ScheduleGroup
        title="Scanning"
        icon={<ScanLine className="h-4 w-4 text-emerald-500" />}
        tasks={scans}
        onEdit={openEdit}
        onToggle={toggleEnabled}
        onDelete={remove}
      />

      <ScheduleTaskDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bedId={bedId}
        editing={editing}
        onSaved={() => {
          setDialogOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

function ScheduleGroup({
  title,
  icon,
  tasks,
  onEdit,
  onToggle,
  onDelete,
}: {
  title: string;
  icon: React.ReactNode;
  tasks: ScheduleTaskView[];
  onEdit: (t: ScheduleTaskView) => void;
  onToggle: (t: ScheduleTaskView, enabled: boolean) => void;
  onDelete: (t: ScheduleTaskView) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onEdit={() => onEdit(t)}
            onToggle={(v) => onToggle(t, v)}
            onDelete={() => onDelete(t)}
          />
        ))}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  onEdit,
  onToggle,
  onDelete,
}: {
  task: ScheduleTaskView;
  onEdit: () => void;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}) {
  const days =
    task.daysOfWeek.length === 0
      ? "Every day"
      : task.daysOfWeek.map((d) => DAY_NAMES[d]).join(", ");

  return (
    <div className={cn("rounded-2xl border p-4", !task.enabled && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold tabular-nums">{task.timeOfDay}</span>
            <span className="text-xs text-muted-foreground">{task.timezone}</span>
          </div>
          <p className="mt-0.5 truncate text-sm font-medium">
            {task.name ?? `${task.sessionType === "WATERING" ? "Watering" : "Scan"} session`}
          </p>
          <p className="text-xs text-muted-foreground">
            {days} &middot; {task.configName ?? "Default config"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Switch checked={task.enabled} onCheckedChange={onToggle} />
          <button
            onClick={onEdit}
            className="rounded p-1.5 text-muted-foreground hover:text-foreground"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1.5 text-muted-foreground hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5" />
        {task.enabled && task.nextRunAt ? (
          <>Next run {formatInTz(task.nextRunAt, task.timezone)}</>
        ) : (
          <>Disabled</>
        )}
      </div>

      {task.runs.length > 0 && (
        <ul className="mt-2 space-y-1">
          {task.runs.slice(0, 3).map((r) => (
            <li key={r.id} className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                {formatInTz(r.scheduledFor, task.timezone)}
              </span>
              <RunStatus run={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RunStatus({ run }: { run: ScheduleRunView }) {
  if (run.status === "SKIPPED") {
    return (
      <span className="font-medium text-amber-500" title={run.skipReason ?? undefined}>
        Skipped
      </span>
    );
  }
  const s = run.sessionStatus;
  const label = s === "COMPLETED" ? "Completed" : s === "ERROR" ? "Error" : s === "RUNNING" ? "Running" : s === "STOPPED" ? "Stopped" : "Queued";
  const color =
    s === "COMPLETED"
      ? "text-emerald-500"
      : s === "ERROR"
        ? "text-red-500"
        : s === "RUNNING"
          ? "text-sky-500"
          : "text-muted-foreground";
  return <span className={cn("font-medium", color)} title={run.skipReason ?? undefined}>{label}</span>;
}

function formatInTz(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

// ─── Create / edit dialog ──────────────────────────────────────────────────────

function ScheduleTaskDialog({
  open,
  onOpenChange,
  bedId,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bedId: number;
  editing: ScheduleTaskView | null;
  onSaved: () => void;
}) {
  const [sessionType, setSessionType] = useState<"SCAN" | "WATERING">(
    editing?.sessionType ?? "WATERING",
  );
  const [name, setName] = useState(editing?.name ?? "");
  const [timeOfDay, setTimeOfDay] = useState(editing?.timeOfDay ?? "06:00");
  const [days, setDays] = useState<number[]>(editing?.daysOfWeek ?? []);
  const [configId, setConfigId] = useState<number | null>(
    editing?.scanConfigId ?? editing?.wateringConfigId ?? null,
  );
  const [configs, setConfigs] = useState<ConfigOption[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load presets for the selected type.
  useEffect(() => {
    if (!open) return;
    setLoadingConfigs(true);
    const url = sessionType === "SCAN" ? "/api/scan-configs" : "/api/watering-configs";
    fetch(url)
      .then((r) => r.json())
      .then((data: ConfigOption[]) => setConfigs(Array.isArray(data) ? data : []))
      .catch(() => setConfigs([]))
      .finally(() => setLoadingConfigs(false));
  }, [open, sessionType]);

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function handleSave() {
    if (!/^\d{2}:\d{2}$/.test(timeOfDay)) {
      setError("Pick a valid time");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      bedId,
      name: name.trim() || null,
      sessionType,
      scanConfigId: sessionType === "SCAN" ? configId : null,
      wateringConfigId: sessionType === "WATERING" ? configId : null,
      timeOfDay,
      daysOfWeek: days,
    };
    try {
      if (editing) {
        await updateScheduledTaskAction(editing.id, payload);
      } else {
        await createScheduledTaskAction(payload);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit schedule" : "Add schedule"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-lg border p-1">
            {(["WATERING", "SCAN"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSessionType(t);
                  setConfigId(null);
                }}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors",
                  sessionType === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t === "WATERING" ? "Watering" : "Ripeness Scan"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Time</Label>
              <Input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Name (optional)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning watering"
                className="h-9"
              />
            </div>
          </div>

          {/* Days of week */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Days <span className="text-muted-foreground">(none = every day)</span>
            </Label>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((lbl, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    days.includes(i)
                      ? "bg-primary text-primary-foreground"
                      : "border text-muted-foreground hover:bg-muted",
                  )}
                  title={DAY_NAMES[i]}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Config preset */}
          <div className="space-y-1.5">
            <Label className="text-xs">Configuration</Label>
            <Select
              value={configId != null ? String(configId) : "default"}
              onValueChange={(v) => setConfigId(v === "default" ? null : Number(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Default config" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Use default config</SelectItem>
                {configs.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                    {c.isDefault ? " (default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingConfigs && (
              <p className="text-[11px] text-muted-foreground">Loading presets…</p>
            )}
          </div>

          {error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Spinner /> : editing ? "Save changes" : "Add schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
