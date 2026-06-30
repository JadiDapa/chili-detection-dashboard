"use client";

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { piApi } from "@/lib/pi";
import {
  getCameraSettingsAction,
  saveCameraSettingsAction,
} from "@/app/actions/camera-setting.action";

// Local form state — camelCase like the Prisma row. Mapped to the RPi's
// snake_case control payload on apply. Manual values are always concrete here;
// the auto* toggles decide whether the RPi actually uses them.
type Form = {
  frameWidth: number;
  frameHeight: number;
  fps: number;
  autoExposure: boolean;
  exposure: number;
  autoWb: boolean;
  wbTemperature: number;
  autofocus: boolean;
  focus: number;
  gain: number;
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
};

// Defaults reflect the greenhouse preference: manual exposure, low gain, fixed
// white balance, manual focus. Resolution stays at the YOLO-aligned 640×480 (the
// ROI overlay assumes 4:3); 1080p is available but see the note in the sheet.
const DEFAULTS: Form = {
  frameWidth: 640,
  frameHeight: 480,
  fps: 15,
  autoExposure: false,
  exposure: 156,
  autoWb: false,
  wbTemperature: 4600,
  autofocus: false,
  focus: 0,
  gain: 0,
  brightness: 0,
  contrast: 32,
  saturation: 64,
  sharpness: 2,
};

const RESOLUTIONS = [
  { label: "640 × 480 (4:3, recommended)", w: 640, h: 480 },
  { label: "1280 × 720 (16:9)", w: 1280, h: 720 },
  { label: "1920 × 1080 (16:9)", w: 1920, h: 1080 },
];

export function CameraSettingsSheet({ bedId }: { bedId: number }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load this bed's saved controls when the sheet opens (fall back to defaults).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    getCameraSettingsAction(bedId)
      .then((row) => {
        if (cancelled || !row) return;
        setForm({
          frameWidth: row.frameWidth,
          frameHeight: row.frameHeight,
          fps: row.fps,
          autoExposure: row.autoExposure,
          exposure: row.exposure ?? DEFAULTS.exposure,
          autoWb: row.autoWb,
          wbTemperature: row.wbTemperature ?? DEFAULTS.wbTemperature,
          autofocus: row.autofocus,
          focus: row.focus ?? DEFAULTS.focus,
          gain: row.gain ?? DEFAULTS.gain,
          brightness: row.brightness ?? DEFAULTS.brightness,
          contrast: row.contrast ?? DEFAULTS.contrast,
          saturation: row.saturation ?? DEFAULTS.saturation,
          sharpness: row.sharpness ?? DEFAULTS.sharpness,
        });
      })
      .catch(() => toast.error("Couldn't load saved camera settings"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, bedId]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function apply() {
    setSaving(true);

    // Manual-only values are nulled out when their mode is auto, so the DB record
    // and the RPi both treat them as "driver default" rather than a stale number.
    const dbData = {
      frameWidth: form.frameWidth,
      frameHeight: form.frameHeight,
      fps: form.fps,
      autoExposure: form.autoExposure,
      exposure: form.autoExposure ? null : form.exposure,
      autoWb: form.autoWb,
      wbTemperature: form.autoWb ? null : form.wbTemperature,
      autofocus: form.autofocus,
      focus: form.autofocus ? null : form.focus,
      gain: form.gain,
      brightness: form.brightness,
      contrast: form.contrast,
      saturation: form.saturation,
      sharpness: form.sharpness,
    };

    // Persist (durable; RPi re-reads on reboot) and push live to the RPi.
    // Independent: the RPi may be offline while we still want the value saved.
    const [persisted, pushed] = await Promise.allSettled([
      saveCameraSettingsAction(bedId, dbData),
      piApi.setCameraSettings({
        frame_width: dbData.frameWidth,
        frame_height: dbData.frameHeight,
        fps: dbData.fps,
        auto_exposure: dbData.autoExposure,
        exposure: dbData.exposure,
        gain: dbData.gain,
        auto_wb: dbData.autoWb,
        wb_temperature: dbData.wbTemperature,
        autofocus: dbData.autofocus,
        focus: dbData.focus,
        brightness: dbData.brightness,
        contrast: dbData.contrast,
        saturation: dbData.saturation,
        sharpness: dbData.sharpness,
      }),
    ]);

    setSaving(false);

    if (persisted.status === "rejected") {
      toast.error("Failed to save settings");
      return;
    }
    if (pushed.status === "rejected") {
      toast.warning("Saved, but the camera is offline — it'll apply on reconnect");
      return;
    }
    toast.success("Camera settings applied");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Camera settings"
          className="bg-green/40 hover:bg-green/60 rounded-full bg-white/25 p-2 text-white/80 backdrop-blur-sm transition-colors"
        >
          <Settings2 className="size-5" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>Camera Settings</SheetTitle>
          <SheetDescription>
            Adjust the live camera. Changes apply to the RPi immediately and are
            saved so they survive a reboot.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-4">
          {/* ── Resolution & FPS ── */}
          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold">Resolution & frame rate</h3>

            <div className="flex flex-col gap-2">
              <Label>Resolution</Label>
              <Select
                value={`${form.frameWidth}x${form.frameHeight}`}
                onValueChange={(v) => {
                  const r = RESOLUTIONS.find((o) => `${o.w}x${o.h}` === v);
                  if (r) {
                    set("frameWidth", r.w);
                    set("frameHeight", r.h);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTIONS.map((r) => (
                    <SelectItem key={r.label} value={`${r.w}x${r.h}`}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.frameWidth !== 640 && (
                <p className="text-muted-foreground text-xs">
                  Note: non-4:3 resolutions misalign the YOLO ROI overlay and slow
                  detection on the Pi. Prefer 640×480 for scanning.
                </p>
              )}
            </div>

            <SettingSlider
              label="Frame rate"
              unit="fps"
              min={5}
              max={30}
              value={form.fps}
              onChange={(v) => set("fps", v)}
            />
          </section>

          {/* ── Exposure ── */}
          <section className="flex flex-col gap-4">
            <ModeRow
              title="Exposure"
              autoLabel="Auto exposure"
              auto={form.autoExposure}
              onAuto={(v) => set("autoExposure", v)}
            />
            {!form.autoExposure && (
              <SettingSlider
                label="Exposure"
                min={1}
                max={2000}
                value={form.exposure}
                onChange={(v) => set("exposure", v)}
              />
            )}
            <SettingSlider
              label="Gain"
              hint="Keep as low as possible to reduce noise"
              min={0}
              max={255}
              value={form.gain}
              onChange={(v) => set("gain", v)}
            />
          </section>

          {/* ── White balance ── */}
          <section className="flex flex-col gap-4">
            <ModeRow
              title="White balance"
              autoLabel="Auto white balance"
              auto={form.autoWb}
              onAuto={(v) => set("autoWb", v)}
            />
            {!form.autoWb && (
              <SettingSlider
                label="Temperature"
                unit="K"
                min={2800}
                max={6500}
                step={100}
                value={form.wbTemperature}
                onChange={(v) => set("wbTemperature", v)}
              />
            )}
          </section>

          {/* ── Focus ── */}
          <section className="flex flex-col gap-4">
            <ModeRow
              title="Focus"
              autoLabel="Autofocus"
              auto={form.autofocus}
              onAuto={(v) => set("autofocus", v)}
            />
            {!form.autofocus && (
              <SettingSlider
                label="Focus"
                min={0}
                max={255}
                value={form.focus}
                onChange={(v) => set("focus", v)}
              />
            )}
          </section>

          {/* ── Image ── */}
          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold">Image</h3>
            <SettingSlider
              label="Brightness"
              min={-64}
              max={64}
              value={form.brightness}
              onChange={(v) => set("brightness", v)}
            />
            <SettingSlider
              label="Contrast"
              min={0}
              max={64}
              value={form.contrast}
              onChange={(v) => set("contrast", v)}
            />
            <SettingSlider
              label="Saturation"
              min={0}
              max={128}
              value={form.saturation}
              onChange={(v) => set("saturation", v)}
            />
            <SettingSlider
              label="Sharpness"
              min={0}
              max={7}
              value={form.sharpness}
              onChange={(v) => set("sharpness", v)}
            />
          </section>
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setForm(DEFAULTS)}
            disabled={saving || loading}
          >
            Reset
          </Button>
          <Button className="flex-1" onClick={apply} disabled={saving || loading}>
            {saving ? "Applying…" : "Apply"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── small building blocks ──────────────────────────────────────────────────

function ModeRow({
  title,
  autoLabel,
  auto,
  onAuto,
}: {
  title: string;
  autoLabel: string;
  auto: boolean;
  onAuto: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold">{title}</h3>
      <label className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">{autoLabel}</span>
        <Switch checked={auto} onCheckedChange={onAuto} />
      </label>
    </div>
  );
}

function SettingSlider({
  label,
  hint,
  unit,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-muted-foreground text-xs tabular-nums">
          {value}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}
