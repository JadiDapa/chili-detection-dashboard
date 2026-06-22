"use server";

import { revalidatePath } from "next/cache";
import { ScheduleService, type ScheduledTaskData } from "@/server/services/schedule.service";

export async function createScheduledTaskAction(data: ScheduledTaskData) {
  const task = await ScheduleService.create(data);
  revalidatePath("/schedule");
  return { id: task.id };
}

export async function updateScheduledTaskAction(
  id: number,
  data: Partial<ScheduledTaskData>,
) {
  await ScheduleService.update(id, data);
  revalidatePath("/schedule");
}

export async function deleteScheduledTaskAction(id: number) {
  await ScheduleService.remove(id);
  revalidatePath("/schedule");
}

export async function setScheduledTaskEnabledAction(id: number, enabled: boolean) {
  await ScheduleService.setEnabled(id, enabled);
  revalidatePath("/schedule");
}
