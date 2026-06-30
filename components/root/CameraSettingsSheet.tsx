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
import { piApi, type CameraControls } from "@/lib/pi";
import { CAMERA_ASPECT_CLASS } from "@/lib/camera";
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
  zoom: number;
};

// Defaults reflect the greenhouse preference: manual exposure, low gain, fixed
// white balance, manual focus, and Full-HD-class capture kept at 4:3 (1440×1080)
// so the YOLO ROI overlay stays aligned while still giving detail for detection.
const DEFAULTS: Form = {
  frameWidth: 1440,
  frameHeight: 1080,
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
  zoom: 0,
};

// Build the camelCase DB payload from the form. Manual-only values are nulled out
// when their mode is auto, so neither the DB nor the RPi keeps a stale number.
function buildDbData(f: Form) {
  return {
    frameWidth: f.frameWidth,
    frameHeight: f.frameHeight,
    fps: f.fps,
    autoExposure: f.autoExposure,
    exposure: f.autoExposure ? null : f.exposure,
    autoWb: f.autoWb,
    wbTemperature: f.autoWb ? null : f.wbTemperature,
    autofocus: f.autofocus,
    focus: f.autofocus ? null : f.focus,
    gain: f.gain,
    brightness: f.brightness,
    contrast: f.contrast,
    saturation: f.saturation,
    sharpness: f.sharpness,
    zoom: f.zoom,
  };
}

// Map the RPi's snake_case control dict back into form state (e.g. after a reset),
// falling back to the form defaults for any control the driver reports as null.
function controlsToForm(c: CameraControls): Form {
  return {
    frameWidth: c.frame_width,
    frameHeight: c.frame_height,
    fps: c.fps,
    autoExposure: c.auto_exposure,
    exposure: c.exposure ?? DEFAULTS.exposure,
    autoWb: c.auto_wb,
    wbTemperature: c.wb_temperature ?? DEFAULTS.wbTemperature,
    autofocus: c.autofocus,
    focus: c.focus ?? DEFAULTS.focus,
    gain: c.gain ?? DEFAULTS.gain,
    brightness: c.brightness ?? DEFAULTS.brightness,
    contrast: c.contrast ?? DEFAULTS.contrast,
    saturation: c.saturation ?? DEFAULTS.saturation,
    sharpness: c.sharpness ?? DEFAULTS.sharpness,
    zoom: c.zoom ?? DEFAULTS.zoom,
  };
}

// 4:3 options keep the ROI overlay aligned (the overlay assumes a 4:3 frame, see
// lib/camera.ts). "Full HD" here means 1080 lines at 4:3 = 1440×1080, not the
// 16:9 1920×1080 — the 16:9 entries are offered but warn about ROI misalignment.
const RESOLUTIONS = [
  { label: "640 × 480 (4:3, fastest)", w: 640, h: 480 },
  { label: "1280 × 960 (4:3)", w: 1280, h: 960 },
  { label: "1440 × 1080 (Full HD, 4:3)", w: 1440, h: 1080 },
  { label: "1600 × 1200 (4:3, 2 MP)", w: 1600, h: 1200 },
  { label: "1280 × 720 (16:9)", w: 1280, h: 720 },
  { label: "1920 × 1080 (16:9)", w: 1920, h: 1080 },
];

// A frame is 4:3 when width·3 === height·4 (e.g. 1440×1080). Non-4:3 frames make
// `object-cover` crop and the percentage-based ROI box drift off the real region.
const is4by3 = (w: number, h: number) => w * 3 === h * 4;

export function CameraSettingsSheet({ bedId }: { bedId: number }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // On mobile the sheet covers the whole screen, hiding the live feed, so we show
  // a preview inside it. On desktop the sheet is a side panel and the feed stays
  // visible, so we skip the extra stream entirely (gated on isMobile, not just CSS).
  const [isMobile, setIsMobile] = useState(false);
  // Bumped after each Apply to force the preview <img> to reconnect, so it shows
  // the freshly-reopened camera rather than the pre-change stream.
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)"); // below Tailwind `lg`
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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
          zoom: row.zoom ?? DEFAULTS.zoom,
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
    const dbData = buildDbData(form);

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
        zoom: dbData.zoom,
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
    setPreviewKey((k) => k + 1); // reconnect the preview to the reopened camera
    toast.success("Camera settings applied");
  }

  // Real reset: tell the RPi to revert the camera to its factory defaults, then
  // reflect the camera's reported values in the form and persist them (so the
  // reset survives a reboot too). Needs the camera online to actually reset.
  async function resetToFactory() {
    setSaving(true);
    let state;
    try {
      state = await piApi.resetCameraSettings();
    } catch {
      setSaving(false);
      toast.error("Camera offline — can't reset to defaults");
      return;
    }
    const resetForm = controlsToForm(state.controls);
    setForm(resetForm);
    try {
      await saveCameraSettingsAction(bedId, buildDbData(resetForm));
    } catch {
      // Hardware is already reset; persistence will catch up on the next apply.
    }
    setSaving(false);
    setPreviewKey((k) => k + 1);
    toast.success("Reset to camera defaults");
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
          {/* ── Live preview (mobile only — the sheet covers the feed here) ── */}
          {isMobile && (
            <div
              className={`relative ${CAMERA_ASPECT_CLASS} w-full overflow-hidden rounded-lg bg-zinc-950`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={previewKey}
                src={`${piApi.streamUrl()}?preview=${previewKey}`}
                alt="Live camera preview"
                className="h-full w-full object-cover"
              />
              <span className="absolute top-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                Live preview
              </span>
            </div>
          )}

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
              {!is4by3(form.frameWidth, form.frameHeight) && (
                <p className="text-muted-foreground text-xs">
                  Note: this is a 16:9 resolution — it misaligns the YOLO ROI
                  overlay. For Full HD detail without that, use the 4:3 options
                  (e.g. 1440×1080). Higher resolutions also slow detection on the
                  Pi.
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

            <SettingSlider
              label="Zoom"
              hint="Camera-specific; 0 = no zoom (clamped to the camera's minimum)"
              min={0}
              max={500}
              value={form.zoom}
              onChange={(v) => set("zoom", v)}
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

        <SheetFooter className="gap-2">
          <Button className="w-full" onClick={apply} disabled={saving || loading}>
            {saving ? "Working…" : "Apply"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={resetToFactory}
            disabled={saving || loading}
            title="Revert the camera to its factory defaults"
          >
            Reset to camera defaults
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
