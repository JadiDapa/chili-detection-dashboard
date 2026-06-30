"use server";

import { revalidatePath } from "next/cache";
import {
  CameraSettingService,
  type CameraSettingData,
} from "@/server/services/camera-setting.service";

// Load this bed's saved camera controls for the settings sheet (null if none yet,
// in which case the UI falls back to its defaults).
export async function getCameraSettingsAction(bedId: number) {
  return CameraSettingService.getByBed(bedId);
}

// Persist the chosen controls. The browser separately pushes them straight to the
// RPi (lib/pi.ts) for an immediate live effect; this call is the durable record
// the RPi re-reads on its next reboot.
export async function saveCameraSettingsAction(
  bedId: number,
  data: CameraSettingData,
) {
  const saved = await CameraSettingService.upsert(bedId, data);
  revalidatePath("/");
  revalidatePath("/dashboard");
  return saved;
}
