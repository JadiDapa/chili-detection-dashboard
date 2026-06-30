import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import type { BedGrid } from "@/server/services/scan-config.service";

export type DatasetConfigData = {
  name: string;
  description?: string | null;
  isDefault?: boolean;
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
  buildSnapshot(
    config: {
      zMm: number;
      speedMmSec: number;
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
      z_mm: config.zMm,
      speed_mm_sec: config.speedMmSec,
    } as Prisma.InputJsonValue;
  },
};
