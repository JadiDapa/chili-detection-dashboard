import { prisma } from "@/lib/prisma";

// Mirrors the CameraSetting model's editable fields. Nullable manual values mean
// "leave the camera driver at its default". The RPi understands the snake_case
// shape produced by `buildPayload` below.
export type CameraSettingData = {
  frameWidth?: number;
  frameHeight?: number;
  fps?: number;
  autoExposure?: boolean;
  exposure?: number | null;
  gain?: number | null;
  autoWb?: boolean;
  wbTemperature?: number | null;
  autofocus?: boolean;
  focus?: number | null;
  brightness?: number | null;
  contrast?: number | null;
  saturation?: number | null;
  sharpness?: number | null;
};

export const CameraSettingService = {
  async getByBed(bedId: number) {
    return prisma.cameraSetting.findUnique({ where: { bedId } });
  },

  // Create-or-update this bed's single camera-settings row.
  async upsert(bedId: number, data: CameraSettingData) {
    return prisma.cameraSetting.upsert({
      where: { bedId },
      update: data,
      create: { bedId, ...data },
    });
  },

  // Snake_case payload the RPi camera service consumes (POST /camera/settings
  // and the startup fetch). Field names match the cv2 control keys exactly.
  buildPayload(c: {
    frameWidth: number;
    frameHeight: number;
    fps: number;
    autoExposure: boolean;
    exposure: number | null;
    gain: number | null;
    autoWb: boolean;
    wbTemperature: number | null;
    autofocus: boolean;
    focus: number | null;
    brightness: number | null;
    contrast: number | null;
    saturation: number | null;
    sharpness: number | null;
  }) {
    return {
      frame_width: c.frameWidth,
      frame_height: c.frameHeight,
      fps: c.fps,
      auto_exposure: c.autoExposure,
      exposure: c.exposure,
      gain: c.gain,
      auto_wb: c.autoWb,
      wb_temperature: c.wbTemperature,
      autofocus: c.autofocus,
      focus: c.focus,
      brightness: c.brightness,
      contrast: c.contrast,
      saturation: c.saturation,
      sharpness: c.sharpness,
    };
  },
};
