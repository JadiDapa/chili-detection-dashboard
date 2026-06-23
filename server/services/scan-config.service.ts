import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

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
  cols?: number;
  rows?: number;
  gapXMm?: number;
  gapYMm?: number;
  startXMm?: number;
  startYMm?: number;
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
        cols: data.cols ?? 8,
        rows: data.rows ?? 2,
        gapXMm: data.gapXMm ?? 750.0,
        gapYMm: data.gapYMm ?? 1000.0,
        startXMm: data.startXMm ?? 0.0,
        startYMm: data.startYMm ?? 0.0,
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
        ...(data.cols !== undefined && { cols: data.cols }),
        ...(data.rows !== undefined && { rows: data.rows }),
        ...(data.gapXMm !== undefined && { gapXMm: data.gapXMm }),
        ...(data.gapYMm !== undefined && { gapYMm: data.gapYMm }),
        ...(data.startXMm !== undefined && { startXMm: data.startXMm }),
        ...(data.startYMm !== undefined && { startYMm: data.startYMm }),
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

  // Build the RPi-compatible snapshot object from a DB record.
  // Uses snake_case field names to match the RPi Pydantic ScanConfig model.
  buildSnapshot(config: {
    cols: number;
    rows: number;
    gapXMm: number;
    gapYMm: number;
    startXMm: number;
    startYMm: number;
    roiWPct: number;
    roiHPct: number;
    captureOffsets: Prisma.JsonValue;
  }): Prisma.InputJsonValue {
    return {
      cols: config.cols,
      rows: config.rows,
      gap_x_mm: config.gapXMm,
      gap_y_mm: config.gapYMm,
      start_x_mm: config.startXMm,
      start_y_mm: config.startYMm,
      roi_w_pct: config.roiWPct,
      roi_h_pct: config.roiHPct,
      capture_offsets: config.captureOffsets,
    } as Prisma.InputJsonValue;
  },
};
