"use server";

import { revalidatePath } from "next/cache";
import { SessionService } from "@/server/services/session.service";

export async function createSessionAction(
  bedId: number,
  notes?: string | null,
  scanConfigId?: number | null,
  sessionType?: "SCAN" | "WATERING",
  wateringConfigId?: number | null,
) {
  const session = await SessionService.create(
    bedId,
    notes,
    scanConfigId,
    sessionType,
    wateringConfigId,
  );
  revalidatePath("/plants");
  revalidatePath("/sessions");
  return { id: session.id, sessionType: session.sessionType };
}
