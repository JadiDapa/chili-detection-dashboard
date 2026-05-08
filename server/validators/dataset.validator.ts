import { CaptureType, DatasetSessionStatus, Prisma } from "@/generated/prisma";
import { z } from "zod";

export type DatasetType = Prisma.DatasetGetPayload<{
  include: {
    captures: true;
  };
}>;

/* ================= SEARCH ================= */
export const DatasetSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(50).optional(),
});

export const DatasetSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  startedAt: z.coerce.date({ error: "Tanggal mulai wajib diisi" }),
  endedAt: z.coerce.date({ error: "Tanggal selesai wajib diisi" }),
  status: z.enum(DatasetSessionStatus),
  captureType: z.enum(CaptureType),
  location: z.string().min(1).optional(),
});

/* ================= DTOs ================= */
export const CreateDatasetSchema = DatasetSchema.extend({});
export const UpdateDatasetSchema = DatasetSchema.partial();
