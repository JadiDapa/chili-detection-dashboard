import { Prisma } from "@/generated/prisma";
import { z } from "zod";

export type CapturesType = Prisma.CapturesGetPayload<{
  include: {
    session: true;
  };
}>;

/* ================= SEARCH ================= */
export const CapturesSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(50).optional(),
});

export const CapturesSchema = z.object({
  title: z.string().min(1),
  imageUrl: z.string().min(1),
  timestamp: z.date({ error: "Tanggal mulai wajib diisi" }),
  detected: z.number().int().min(1).optional(),
  ripe: z.number().int().min(1).optional(),
  unripe: z.number().int().min(1).optional(),
  damaged: z.number().int().min(1).optional(),
  sessionId: z.number().int().min(1).optional(),
  session: z.number().int().min(1).optional(),
});

export const CreateCapturesSchema = CapturesSchema.extend({});
export const UpdateCapturesSchema = CapturesSchema.partial().extend({});
