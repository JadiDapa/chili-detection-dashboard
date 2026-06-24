import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export type DatasetConfigData = {
  name: string;
  description?: string | null;
  isDefault?: boolean;
  cols?: number;
  rows?: number;
  gapXMm?: number;
  gapYMm?: number;
  startXMm?: number;
  startYMm?: number;
  zMm?: number;
  speedMmSec?: number;
};

export const DatasetConfigService = {
  async list() {
    return prisma.datasetConfig.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  },

  async getById(id: number) {
    return prisma.datasetConfig.findUnique({ where: { id } });
  },

  async getDefault() {
    return prisma.datasetConfig.findFirst({ where: { isDefault: true } });
  },

  async create(data: DatasetConfigData) {
    return prisma.datasetConfig.create({
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
        zMm: data.zMm ?? 50.0,
        speedMmSec: data.speedMmSec ?? 100.0,
      },
    });
  },

  async update(id: number, data: Partial<DatasetConfigData>) {
    return prisma.datasetConfig.update({
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
        ...(data.zMm !== undefined && { zMm: data.zMm }),
        ...(data.speedMmSec !== undefined && { speedMmSec: data.speedMmSec }),
      },
    });
  },

  async delete(id: number) {
    return prisma.datasetConfig.delete({ where: { id } });
  },

  async setDefault(id: number) {
    return prisma.$transaction(async (tx) => {
      await tx.datasetConfig.updateMany({ data: { isDefault: false } });
      return tx.datasetConfig.update({ where: { id }, data: { isDefault: true } });
    });
  },

  // Build the RPi-compatible snapshot object from a DB record.
  // Uses snake_case field names to match the RPi Pydantic DatasetConfig model.
  buildSnapshot(config: {
    cols: number;
    rows: number;
    gapXMm: number;
    gapYMm: number;
    startXMm: number;
    startYMm: number;
    zMm: number;
    speedMmSec: number;
  }): Prisma.InputJsonValue {
    return {
      cols: config.cols,
      rows: config.rows,
      gap_x_mm: config.gapXMm,
      gap_y_mm: config.gapYMm,
      start_x_mm: config.startXMm,
      start_y_mm: config.startYMm,
      z_mm: config.zMm,
      speed_mm_sec: config.speedMmSec,
    } as Prisma.InputJsonValue;
  },
};
