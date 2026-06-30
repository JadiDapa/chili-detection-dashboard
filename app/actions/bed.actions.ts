"use server";

import { revalidatePath } from "next/cache";
import { BedService, type BedGridInput } from "@/server/services/bed.service";

// Load this bed's grid layout for the Grid Layout sheet.
export async function getBedAction(bedId: number) {
  return BedService.getById(bedId);
}

// Save the bed grid and regenerate plant positions. Revalidate the surfaces that
// render the planter bed / plant details so the new layout shows immediately.
export async function updateBedGridAction(bedId: number, grid: BedGridInput) {
  const bed = await BedService.updateGrid(bedId, grid);
  revalidatePath("/plants");
  revalidatePath("/dashboard");
  return bed;
}
