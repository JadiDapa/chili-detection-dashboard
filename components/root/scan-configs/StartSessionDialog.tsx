"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { PlantsCam } from "@/components/root/plants/PlantsCam";
import { piApi } from "@/lib/pi";

// ─── Types ────────────────────────────────────────────────────────────────────

type CaptureOffsetData = {
  z_mm: number;
  x_offset_mm: number;
  y_offset_mm: number;
  servo_pan: number;
  servo_tilt: number;
};

export interface ScanConfigSummary {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  cols: number;
  rows: number;
  gapXMm: number;
  gapYMm: number;
  startXMm: number;
  startYMm: number;
  roiWPct: number;
  roiHPct: number;
  captureOffsets: CaptureOffsetData[];
}

export interface WateringConfigSummary {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  cols: number;
  rows: number;
  gapXMm: number;
  gapYMm: number;
  startXMm: number;
  startYMm: number;
  zMaxMm: number;
  zWaterMm: number;
  tofSamples: number;
  sweepSpeedMmSec: number;
  waterSpeedMmSec: number;
}

export interface DatasetConfigSummary {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  cols: number;
  rows: number;
  gapXMm: number;
  gapYMm: number;
  startXMm: number;
  startYMm: number;
  zMm: number;
  speedMmSec: number;
}

type SessionTypeOpt = "SCAN" | "WATERING" | "DATA_COLLECTION";
type AnyConfigSummary =
  | ScanConfigSummary
  | WateringConfigSummary
  | DatasetConfigSummary;

// Discriminate a config summary by a field unique to its kind.
function isWateringConfig(c: AnyConfigSummary): c is WateringConfigSummary {
  return "zMaxMm" in c;
}
function isDatasetConfig(c: AnyConfigSummary): c is DatasetConfigSummary {
  return "speedMmSec" in c;
}

const TYPE_LABEL: Record<SessionTypeOpt, string> = {
  SCAN: "Ripeness Scan",
  WATERING: "Watering",
  DATA_COLLECTION: "Data Collection",
};

interface StartSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sessionType: SessionTypeOpt, configId: number | null) => void;
  isPending: boolean;
}

// ─── Create form state ────────────────────────────────────────────────────────

type OffsetRow = CaptureOffsetData & { _key: string };

type CreateForm = {
  name: string;
  description: string;
  cols: string;
  rows: string;
  gapXMm: string;
  gapYMm: string;
  startXMm: string;
  startYMm: string;
  roiWPct: string;
  roiHPct: string;
  scanZMm: string;
  captureOffsets: OffsetRow[];
  zMaxMm: string;
  zWaterMm: string;
  tofSamples: string;
  sweepSpeedMmSec: string;
  waterSpeedMmSec: string;
  // DATA_COLLECTION
  zMm: string;
  speedMmSec: string;
};

const EMPTY_FORM: CreateForm = {
  name: "",
  description: "",
  cols: "8",
  rows: "2",
  gapXMm: "750",
  gapYMm: "1000",
  startXMm: "0",
  startYMm: "0",
  roiWPct: "100",
  roiHPct: "100",
  scanZMm: "50",
  captureOffsets: [],
  zMaxMm: "0",
  zWaterMm: "50",
  tofSamples: "5",
  sweepSpeedMmSec: "150",
  waterSpeedMmSec: "100",
  zMm: "50",
  speedMmSec: "100",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function configToForm(config: AnyConfigSummary): CreateForm {
  const watering = isWateringConfig(config);
  const dataset = isDatasetConfig(config);
  const scan = !watering && !dataset;
  return {
    name: config.name,
    description: config.description ?? "",
    cols: String(config.cols),
    rows: String(config.rows),
    gapXMm: String(config.gapXMm),
    gapYMm: String(config.gapYMm),
    startXMm: String(config.startXMm),
    startYMm: String(config.startYMm),
    roiWPct: scan ? String((config as ScanConfigSummary).roiWPct ?? 100) : "100",
    roiHPct: scan ? String((config as ScanConfigSummary).roiHPct ?? 100) : "100",
    scanZMm: scan
      ? String((config as ScanConfigSummary).captureOffsets?.[0]?.z_mm ?? 50)
      : "50",
    captureOffsets: scan
      ? ((config as ScanConfigSummary).captureOffsets ?? []).map((o) => ({
          ...o,
          _key: crypto.randomUUID(),
        }))
      : [],
    zMaxMm: watering ? String((config as WateringConfigSummary).zMaxMm) : "0",
    zWaterMm: watering
      ? String((config as WateringConfigSummary).zWaterMm)
      : "50",
    tofSamples: watering
      ? String((config as WateringConfigSummary).tofSamples)
      : "5",
    sweepSpeedMmSec: watering
      ? String((config as WateringConfigSummary).sweepSpeedMmSec)
      : "150",
    waterSpeedMmSec: watering
      ? String((config as WateringConfigSummary).waterSpeedMmSec)
      : "100",
    zMm: dataset ? String((config as DatasetConfigSummary).zMm) : "50",
    speedMmSec: dataset
      ? String((config as DatasetConfigSummary).speedMmSec)
      : "100",
  };
}

function configApiBase(type: SessionTypeOpt): string {
  if (type === "WATERING") return "/api/watering-configs";
  if (type === "DATA_COLLECTION") return "/api/dataset-configs";
  return "/api/scan-configs";
}

// Build the per-type request body from the shared grid fields + the form.
function buildConfigBody(
  type: SessionTypeOpt,
  form: CreateForm,
  shared: Record<string, unknown>,
): Record<string, unknown> {
  if (type === "WATERING") {
    return {
      ...shared,
      zMaxMm: parseFloat(form.zMaxMm) || 0,
      zWaterMm: parseFloat(form.zWaterMm) || 50,
      tofSamples: parseInt(form.tofSamples) || 5,
      sweepSpeedMmSec: parseFloat(form.sweepSpeedMmSec) || 150,
      waterSpeedMmSec: parseFloat(form.waterSpeedMmSec) || 100,
    };
  }
  if (type === "DATA_COLLECTION") {
    return {
      ...shared,
      zMm: parseFloat(form.zMm) || 50,
      speedMmSec: parseFloat(form.speedMmSec) || 100,
    };
  }
  // Advanced per-shot offsets take over when present; otherwise synthesize a
  // single offset from the simple Capture Z so every scan has a defined height.
  const captureOffsets =
    form.captureOffsets.length > 0
      ? form.captureOffsets.map(({ _key: _, ...rest }) => rest)
      : [
          {
            z_mm: parseFloat(form.scanZMm) || 50,
            x_offset_mm: 0,
            y_offset_mm: 0,
            servo_pan: 90,
            servo_tilt: 90,
          },
        ];
  return {
    ...shared,
    roiWPct: parseFloat(form.roiWPct) || 100,
    roiHPct: parseFloat(form.roiHPct) || 100,
    captureOffsets,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StartSessionDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: StartSessionDialogProps) {
  const [step, setStep] = useState<"select" | "create" | "edit">("select");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sessionType, setSessionType] = useState<SessionTypeOpt>("SCAN");
  const [scanConfigs, setScanConfigs] = useState<ScanConfigSummary[]>([]);
  const [wateringConfigs, setWateringConfigs] = useState<WateringConfigSummary[]>([]);
  const [datasetConfigs, setDatasetConfigs] = useState<DatasetConfigSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);

  useEffect(() => {
    if (!open || sessionType !== "SCAN") return;
    setLoading(true);
    fetch("/api/scan-configs")
      .then((r) => r.json())
      .then((data: ScanConfigSummary[]) => {
        setScanConfigs(data);
        setSelectedId((prev) => {
          if (prev != null) return prev;
          const def = data.find((c) => c.isDefault) ?? data[0] ?? null;
          return def?.id ?? null;
        });
      })
      .catch(() => setScanConfigs([]))
      .finally(() => setLoading(false));
  }, [open, sessionType]);

  useEffect(() => {
    if (!open || sessionType !== "WATERING") return;
    setLoading(true);
    fetch("/api/watering-configs")
      .then((r) => r.json())
      .then((data: WateringConfigSummary[]) => {
        setWateringConfigs(data);
        setSelectedId((prev) => {
          if (prev != null) return prev;
          const def = data.find((c) => c.isDefault) ?? data[0] ?? null;
          return def?.id ?? null;
        });
      })
      .catch(() => setWateringConfigs([]))
      .finally(() => setLoading(false));
  }, [open, sessionType]);

  useEffect(() => {
    if (!open || sessionType !== "DATA_COLLECTION") return;
    setLoading(true);
    fetch("/api/dataset-configs")
      .then((r) => r.json())
      .then((data: DatasetConfigSummary[]) => {
        setDatasetConfigs(data);
        setSelectedId((prev) => {
          if (prev != null) return prev;
          const def = data.find((c) => c.isDefault) ?? data[0] ?? null;
          return def?.id ?? null;
        });
      })
      .catch(() => setDatasetConfigs([]))
      .finally(() => setLoading(false));
  }, [open, sessionType]);

  useEffect(() => {
    if (!open) {
      setStep("select");
      setForm(EMPTY_FORM);
    }
  }, [open]);

  function handleTypeChange(type: SessionTypeOpt) {
    setSessionType(type);
    setSelectedId(null);
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setSaveError(null);
    setStep("create");
  }

  function openEdit(config: AnyConfigSummary) {
    setForm(configToForm(config));
    setEditingId(config.id);
    setSaveError(null);
    setStep("edit");
  }

  function setField<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addOffset() {
    setForm((f) => ({
      ...f,
      captureOffsets: [
        ...f.captureOffsets,
        {
          _key: crypto.randomUUID(),
          z_mm: 0,
          x_offset_mm: 0,
          y_offset_mm: 0,
          servo_pan: 90,
          servo_tilt: 90,
        },
      ],
    }));
  }

  function removeOffset(key: string) {
    setForm((f) => ({
      ...f,
      captureOffsets: f.captureOffsets.filter((o) => o._key !== key),
    }));
  }

  function updateOffset(key: string, field: keyof CaptureOffsetData, raw: string) {
    const value = parseFloat(raw) || 0;
    setForm((f) => ({
      ...f,
      captureOffsets: f.captureOffsets.map((o) =>
        o._key === key ? { ...o, [field]: value } : o,
      ),
    }));
  }

  async function handleUpdateConfig() {
    if (!form.name.trim() || editingId == null) return;
    setSaving(true);
    setSaveError(null);
    try {
      const shared = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        cols: parseInt(form.cols) || 8,
        rows: parseInt(form.rows) || 2,
        gapXMm: parseFloat(form.gapXMm) || 750,
        gapYMm: parseFloat(form.gapYMm) || 1000,
        startXMm: parseFloat(form.startXMm) || 0,
        startYMm: parseFloat(form.startYMm) || 0,
      };
      const body = buildConfigBody(sessionType, form, shared);

      const url = `${configApiBase(sessionType)}/${editingId}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? `Server error ${res.status}`);
      }
      const updated = await res.json();

      if (sessionType === "SCAN") {
        setScanConfigs((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c)),
        );
      } else if (sessionType === "WATERING") {
        setWateringConfigs((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c)),
        );
      } else {
        setDatasetConfigs((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c)),
        );
      }
      setStep("select");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveConfig() {
    if (!form.name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const shared = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        cols: parseInt(form.cols) || 8,
        rows: parseInt(form.rows) || 2,
        gapXMm: parseFloat(form.gapXMm) || 750,
        gapYMm: parseFloat(form.gapYMm) || 1000,
        startXMm: parseFloat(form.startXMm) || 0,
        startYMm: parseFloat(form.startYMm) || 0,
      };

      const body = buildConfigBody(sessionType, form, shared);

      const url = configApiBase(sessionType);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? `Server error ${res.status}`);
      }
      const created = await res.json();

      if (sessionType === "SCAN") {
        setScanConfigs((prev) => [created, ...prev]);
      } else if (sessionType === "WATERING") {
        setWateringConfigs((prev) => [created, ...prev]);
      } else {
        setDatasetConfigs((prev) => [created, ...prev]);
      }
      setSelectedId(created.id);
      setStep("select");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const configs: AnyConfigSummary[] =
    sessionType === "SCAN"
      ? scanConfigs
      : sessionType === "WATERING"
        ? wateringConfigs
        : datasetConfigs;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "transition-all duration-200",
          step !== "select" ? "max-w-lg" : "max-w-sm",
        )}
      >
        {step === "select" ? (
          <SelectStep
            sessionType={sessionType}
            configs={configs}
            selectedId={selectedId}
            loading={loading}
            isPending={isPending}
            onTypeChange={handleTypeChange}
            onSelect={setSelectedId}
            onEdit={openEdit}
            onCreateNew={openCreate}
            onCancel={() => onOpenChange(false)}
            onConfirm={() => onConfirm(sessionType, selectedId)}
          />
        ) : (
          <CreateStep
            mode={step === "edit" ? "edit" : "create"}
            sessionType={sessionType}
            form={form}
            saving={saving}
            error={saveError}
            onBack={() => setStep("select")}
            onField={setField}
            onAddOffset={addOffset}
            onRemoveOffset={removeOffset}
            onUpdateOffset={updateOffset}
            onSave={step === "edit" ? handleUpdateConfig : handleSaveConfig}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Select step ─────────────────────────────────────────────────────────────

function SelectStep({
  sessionType,
  configs,
  selectedId,
  loading,
  isPending,
  onTypeChange,
  onSelect,
  onEdit,
  onCreateNew,
  onCancel,
  onConfirm,
}: {
  sessionType: SessionTypeOpt;
  configs: AnyConfigSummary[];
  selectedId: number | null;
  loading: boolean;
  isPending: boolean;
  onTypeChange: (t: SessionTypeOpt) => void;
  onSelect: (id: number) => void;
  onEdit: (config: AnyConfigSummary) => void;
  onCreateNew: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Start Session</DialogTitle>
        <p className="text-muted-foreground -mt-1 text-sm">
          Choose a session type and configuration
        </p>
      </DialogHeader>

      {/* Type toggle */}
      <div className="mt-2 flex rounded-lg border p-1">
        {(["SCAN", "WATERING", "DATA_COLLECTION"] as const).map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(t)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-[11px] font-semibold transition-colors",
              sessionType === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="mt-2 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Spinner />
          </div>
        )}

        {!loading && configs.length === 0 && (
          <p className="py-2 text-center text-sm text-zinc-500">
            No saved configurations — create one below or start with built-in
            defaults.
          </p>
        )}

        {!loading &&
          configs.map((config) => {
            const isSelected = selectedId === config.id;
            const isWatering = isWateringConfig(config);
            const isDataset = isDatasetConfig(config);
            return (
              <button
                key={config.id}
                onClick={() => onSelect(config.id)}
                className={cn(
                  "group w-full rounded-lg border p-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted",
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Radio dot */}
                  <div className="mt-0.5 shrink-0">
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full border-2",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-zinc-400",
                      )}
                    >
                      {isSelected && (
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{config.name}</span>
                      {config.isDefault && (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500">
                          Default
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(config);
                        }}
                        className="ml-auto shrink-0 rounded p-0.5 text-zinc-400 opacity-0 transition-opacity hover:text-zinc-200 group-hover:opacity-100"
                        title="Edit config"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                    {config.description && (
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {config.description}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {config.rows}×{config.cols} grid &middot;{" "}
                      {config.gapXMm / 10} cm × {config.gapYMm / 10} cm spacing
                    </p>
                  </div>
                </div>

                {/* Expanded detail when selected */}
                {isSelected && (
                  <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-border/60 pt-3">
                    <Detail
                      label="First plant"
                      value={`${config.startXMm} × ${config.startYMm} mm`}
                    />
                    {isWatering ? (
                      <>
                        <Detail
                          label="Z Max / Water"
                          value={`${(config as WateringConfigSummary).zMaxMm} / ${(config as WateringConfigSummary).zWaterMm} mm`}
                        />
                        <Detail
                          label="TOF Samples"
                          value={String(
                            (config as WateringConfigSummary).tofSamples,
                          )}
                        />
                        <Detail
                          label="Sweep / Water speed"
                          value={`${(config as WateringConfigSummary).sweepSpeedMmSec} / ${(config as WateringConfigSummary).waterSpeedMmSec} mm/s`}
                        />
                      </>
                    ) : isDataset ? (
                      <>
                        <Detail
                          label="Sweep speed"
                          value={`${(config as DatasetConfigSummary).speedMmSec} mm/s`}
                        />
                        <Detail
                          label="Capture Z"
                          value={`${(config as DatasetConfigSummary).zMm} mm`}
                        />
                      </>
                    ) : (
                      <>
                        <Detail
                          label="Capture Z"
                          value={`${(config as ScanConfigSummary).captureOffsets?.[0]?.z_mm ?? 50} mm`}
                        />
                        <Detail
                          label="Capture offsets"
                          value={`${((config as ScanConfigSummary).captureOffsets as unknown[])?.length ?? 0} shot(s)`}
                        />
                        <Detail
                          label="Counting region"
                          value={`${(config as ScanConfigSummary).roiWPct ?? 100}% × ${(config as ScanConfigSummary).roiHPct ?? 100}%`}
                        />
                      </>
                    )}
                  </div>
                )}
              </button>
            );
          })}

        {/* Create new card */}
        {!loading && (
          <button
            onClick={onCreateNew}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 transition-colors hover:border-primary hover:text-primary dark:border-zinc-700"
          >
            <Plus className="h-4 w-4" />
            Create new configuration
          </button>
        )}
      </div>

      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={isPending}>
          {isPending ? <Spinner /> : "Start Session"}
        </Button>
      </DialogFooter>
    </>
  );
}

// ─── Create step ─────────────────────────────────────────────────────────────

function CreateStep({
  mode = "create",
  sessionType,
  form,
  saving,
  error,
  onBack,
  onField,
  onAddOffset,
  onRemoveOffset,
  onUpdateOffset,
  onSave,
}: {
  mode?: "create" | "edit";
  sessionType: SessionTypeOpt;
  form: CreateForm;
  saving: boolean;
  error: string | null;
  onBack: () => void;
  onField: <K extends keyof CreateForm>(key: K, value: CreateForm[K]) => void;
  onAddOffset: () => void;
  onRemoveOffset: (key: string) => void;
  onUpdateOffset: (key: string, field: keyof CaptureOffsetData, value: string) => void;
  onSave: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <DialogTitle>
            {mode === "edit" ? "Edit" : "Create"} {TYPE_LABEL[sessionType]} Config
          </DialogTitle>
        </div>
      </DialogHeader>

      <ScrollArea className="mt-2 max-h-[62vh] pr-3">
        <div className="space-y-5 pb-1">
          {/* Basic info */}
          <section className="space-y-3">
            <FormField label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => onField("name", e.target.value)}
                placeholder="e.g. West bed offset"
                className="h-8 text-sm"
              />
            </FormField>
            <FormField label="Description">
              <Input
                value={form.description}
                onChange={(e) => onField("description", e.target.value)}
                placeholder="Optional"
                className="h-8 text-sm"
              />
            </FormField>
          </section>

          {/* Grid layout */}
          <section>
            <SectionLabel>Grid Layout</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <NumField
                label="Columns"
                value={form.cols}
                onChange={(v) => onField("cols", v)}
              />
              <NumField
                label="Rows"
                value={form.rows}
                onChange={(v) => onField("rows", v)}
              />
              <NumField
                label="Gap X (mm)"
                value={form.gapXMm}
                onChange={(v) => onField("gapXMm", v)}
              />
              <NumField
                label="Gap Y (mm)"
                value={form.gapYMm}
                onChange={(v) => onField("gapYMm", v)}
              />
              <NumField
                label="First plant X (mm)"
                value={form.startXMm}
                onChange={(v) => onField("startXMm", v)}
              />
              <NumField
                label="First plant Y (mm)"
                value={form.startYMm}
                onChange={(v) => onField("startYMm", v)}
              />
            </div>
          </section>

          {/* SCAN: capture height */}
          {sessionType === "SCAN" && (
            <section>
              <SectionLabel>Capture Height</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  label="Capture Z (mm)"
                  value={form.scanZMm}
                  onChange={(v) => onField("scanZMm", v)}
                />
              </div>
              <p className="mt-1.5 text-[11px] italic text-zinc-500">
                Z height the camera is lowered to at each plant. Used unless you
                add per-shot Capture Offsets below (each offset sets its own Z).
              </p>
            </section>
          )}

          {/* SCAN: counting region (ROI) */}
          {sessionType === "SCAN" && (
            <section>
              <SectionLabel>
                Counting Region{" "}
                <span className="font-normal normal-case text-zinc-500">
                  (% of frame, centered)
                </span>
              </SectionLabel>
              {/* Live preview — tune the box against the actual feed */}
              <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg bg-zinc-900">
                <PlantsCam
                  label="ROI preview"
                  streamUrl={piApi.streamUrl()}
                  showLiveIndicator={false}
                  roiWPct={parseFloat(form.roiWPct) || 100}
                  roiHPct={parseFloat(form.roiHPct) || 100}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  label="ROI Width %"
                  value={form.roiWPct}
                  onChange={(v) => onField("roiWPct", v)}
                />
                <NumField
                  label="ROI Height %"
                  value={form.roiHPct}
                  onChange={(v) => onField("roiHPct", v)}
                />
              </div>
              <p className="mt-1.5 text-[11px] italic text-zinc-500">
                Fruit detected outside this centered box is ignored, so
                neighboring plants don&apos;t inflate the count. 100×100 = whole
                frame.
              </p>
            </section>
          )}

          {/* SCAN: capture offsets */}
          {sessionType === "SCAN" && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <SectionLabel className="mb-0">
                  Capture Offsets{" "}
                  <span className="font-normal normal-case text-zinc-500">
                    (optional)
                  </span>
                </SectionLabel>
                <button
                  type="button"
                  onClick={onAddOffset}
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>

              {form.captureOffsets.length === 0 ? (
                <p className="text-[11px] italic text-zinc-500">
                  No offsets — each plant is captured once at the Capture Z
                  above. Add offsets only for multi-shot or servo aiming.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {/* Header row */}
                  <div className="flex items-center gap-1.5 pl-5">
                    {["z (mm)", "x off", "y off", "pan", "tilt"].map((h) => (
                      <p
                        key={h}
                        className="w-14 text-center text-[9px] text-zinc-400"
                      >
                        {h}
                      </p>
                    ))}
                  </div>

                  {form.captureOffsets.map((row, i) => (
                    <div key={row._key} className="flex items-center gap-1.5">
                      <span className="w-4 shrink-0 text-right text-[10px] text-zinc-400">
                        {i + 1}
                      </span>
                      {(
                        [
                          "z_mm",
                          "x_offset_mm",
                          "y_offset_mm",
                          "servo_pan",
                          "servo_tilt",
                        ] as (keyof CaptureOffsetData)[]
                      ).map((field) => (
                        <Input
                          key={field}
                          type="number"
                          value={String(row[field])}
                          onChange={(e) =>
                            onUpdateOffset(row._key, field, e.target.value)
                          }
                          className="h-7 w-14 px-1 text-center text-[11px]"
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => onRemoveOffset(row._key)}
                        className="text-zinc-400 transition-colors hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* WATERING: extra params */}
          {sessionType === "WATERING" && (
            <>
              <section>
                <SectionLabel>Z Heights</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  <NumField
                    label="Z Max (mm)"
                    value={form.zMaxMm}
                    onChange={(v) => onField("zMaxMm", v)}
                  />
                  <NumField
                    label="Z Water (mm)"
                    value={form.zWaterMm}
                    onChange={(v) => onField("zWaterMm", v)}
                  />
                </div>
              </section>

              <section>
                <SectionLabel>Motion</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  <NumField
                    label="TOF Samples"
                    value={form.tofSamples}
                    onChange={(v) => onField("tofSamples", v)}
                  />
                  <NumField
                    label="Sweep Speed (mm/s)"
                    value={form.sweepSpeedMmSec}
                    onChange={(v) => onField("sweepSpeedMmSec", v)}
                  />
                  <NumField
                    label="Water Speed (mm/s)"
                    value={form.waterSpeedMmSec}
                    onChange={(v) => onField("waterSpeedMmSec", v)}
                  />
                </div>
              </section>
            </>
          )}

          {/* DATA_COLLECTION: sweep params */}
          {sessionType === "DATA_COLLECTION" && (
            <section>
              <SectionLabel>Sweep</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  label="Speed (mm/s)"
                  value={form.speedMmSec}
                  onChange={(v) => onField("speedMmSec", v)}
                />
                <NumField
                  label="Capture Z (mm)"
                  value={form.zMm}
                  onChange={(v) => onField("zMm", v)}
                />
              </div>
              <p className="mt-1.5 text-[11px] italic text-zinc-500">
                The gantry sweeps every row continuously (no per-plant stops) at
                this speed, holding the camera at this Z height, while recording a
                single video.
              </p>
            </section>
          )}
        </div>
      </ScrollArea>

      {error && (
        <p className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
          {error}
        </p>
      )}

      <DialogFooter className="mt-3">
        <Button variant="outline" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button onClick={onSave} disabled={saving || !form.name.trim()}>
          {saving ? (
            <Spinner />
          ) : mode === "edit" ? (
            "Save Changes"
          ) : (
            "Save & Select"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-zinc-400">{label}</p>
      <p className="text-[11px] font-medium">{value}</p>
    </div>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400",
        className,
      )}
    >
      {children}
    </p>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
}
