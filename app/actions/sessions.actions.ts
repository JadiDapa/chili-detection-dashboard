"use server";

import { revalidatePath } from "next/cache";
import { SessionService } from "@/server/services/session.service";

export async function createSessionAction(
  bedId: number,
  notes?: string | null,
  scanConfigId?: number | null,
) {
  const session = await SessionService.create(bedId, notes, scanConfigId);
  revalidatePath("/plants");
  return { id: session.id };
}
