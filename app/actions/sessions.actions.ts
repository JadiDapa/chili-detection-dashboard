"use server";

import { revalidatePath } from "next/cache";
import z from "zod";
import { CreateSessionSchema } from "@/server/validators/session.validator";

import { SessionService } from "@/server/services/leave.service";

export async function createSession({
  session,
}: {
  session: z.input<typeof CreateSessionSchema>;
}) {
  const data = CreateSessionSchema.parse(session);

  const created = await SessionService.create(data);

  revalidatePath("/session");

  return created;
}
