import { SessionStatus, Prisma } from "@/generated/prisma";
import { z } from "zod";

export type SessionType = Prisma.SessionGetPayload<{
  include: {
    captures: true;
  };
}>;

/* ================= SEARCH ================= */
export const SessionSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(50).optional(),
});

export const SessionSchema = z.object({
  title: z.string().min(1).optional(),
  notes: z.string().optional(),
  startedAt: z.date({ error: "Tanggal mulai wajib diisi" }).optional(),
  completedAt: z.date({ error: "Tanggal selesai wajib diisi" }).optional(),
  status: z.enum(SessionStatus),
});

/* ================= DTOs ================= */
export const CreateSessionSchema = SessionSchema.extend({});
export const UpdateSessionSchema = SessionSchema.partial().extend({
  status: z.enum(SessionStatus).optional(),
});
