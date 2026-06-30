import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

// Grid layout now lives on the Bed (single source of truth). Session configs no
// longer carry it; the snapshot merges it in at session-start. This is the shape
// buildSnapshot pulls from the bed for the RPi-compatible snapshot.
export type BedGrid = {
  cols: number;
  rows: number;
  gapXMm: number;
  gapYMm: number;
  startXMm: number;
  startYMm: number;
};

export type CaptureOffsetData = {
  z_mm: number;
  x_offset_mm: number;
  y_offset_mm: number;
  servo_pan: number;
  servo_tilt: number;
};

export type ScanConfigData = {
  name: string;
  description?: string | null;
  isDefault?: boolean;
  roiWPct?: number;
  roiHPct?: number;
  captureOffsets: CaptureOffsetData[];
};

export const ScanConfigService = {
  async list() {
    return prisma.scanConfig.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  },

  async getById(id: number) {
    return prisma.scanConfig.findUnique({ where: { id } });
  },

  async getDefault() {
    return prisma.scanConfig.findFirst({ where: { isDefault: true } });
  },

  async create(data: ScanConfigData) {
    return prisma.scanConfig.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        isDefault: data.isDefault ?? false,
        roiWPct: data.roiWPct ?? 100.0,
        roiHPct: data.roiHPct ?? 100.0,
        captureOffsets: data.captureOffsets as Prisma.InputJsonValue,
      },
    });
  },

  async update(id: number, data: Partial<ScanConfigData>) {
    return prisma.scanConfig.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.roiWPct !== undefined && { roiWPct: data.roiWPct }),
        ...(data.roiHPct !== undefined && { roiHPct: data.roiHPct }),
        ...(data.captureOffsets !== undefined && {
          captureOffsets: data.captureOffsets as Prisma.InputJsonValue,
        }),
      },
    });
  },

  async delete(id: number) {
    return prisma.scanConfig.delete({ where: { id } });
  },

  async setDefault(id: number) {
    return prisma.$transaction(async (tx) => {
      await tx.scanConfig.updateMany({ data: { isDefault: false } });
      return tx.scanConfig.update({ where: { id }, data: { isDefault: true } });
    });
  },

  // Build the RPi-compatible snapshot object from a DB record. Grid fields are
  // merged from the bed (single source of truth) so the RPi snapshot shape is
  // unchanged. Uses snake_case to match the RPi Pydantic ScanConfig model.
  buildSnapshot(
    config: {
      roiWPct: number;
      roiHPct: number;
      captureOffsets: Prisma.JsonValue;
    },
    grid: BedGrid,
  ): Prisma.InputJsonValue {
    return {
      cols: grid.cols,
      rows: grid.rows,
      gap_x_mm: grid.gapXMm,
      gap_y_mm: grid.gapYMm,
      start_x_mm: grid.startXMm,
      start_y_mm: grid.startYMm,
      roi_w_pct: config.roiWPct,
      roi_h_pct: config.roiHPct,
      capture_offsets: config.captureOffsets,
    } as Prisma.InputJsonValue;
  },
};
