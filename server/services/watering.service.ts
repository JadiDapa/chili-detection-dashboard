import { Prisma, SessionStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export type WateringConfigData = {
  name: string;
  description?: string | null;
  isDefault?: boolean;
  cols?: number;
  rows?: number;
  gapXMm?: number;
  gapYMm?: number;
  startXMm?: number;
  startYMm?: number;
  zMaxMm?: number;
  zWaterMm?: number;
  tofSamples?: number;
  sweepSpeedMmSec?: number;
  waterSpeedMmSec?: number;
};

export type CreateWateringStopInput = {
  stopIndex: number;
  xMm: number;
  yMm: number;
  maxHeightCm?: number | null;
  valveDurationSec: number;
};

export type WateringSessionSummaryInput = {
  max_height_cm: number;
  fuzzy_duration_sec: number;
  stops_watered: number;
  moisture_before_avg: number;
  moisture_after_avg: number;
};

export const WateringService = {
  async listConfigs() {
    return prisma.wateringConfig.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  },

  async getConfigById(id: number) {
    return prisma.wateringConfig.findUnique({ where: { id } });
  },

  async getDefault() {
    return prisma.wateringConfig.findFirst({ where: { isDefault: true } });
  },

  async createConfig(data: WateringConfigData) {
    return prisma.wateringConfig.create({
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
        zMaxMm: data.zMaxMm ?? 0.0,
        zWaterMm: data.zWaterMm ?? 50.0,
        tofSamples: data.tofSamples ?? 5,
        sweepSpeedMmSec: data.sweepSpeedMmSec ?? 150.0,
        waterSpeedMmSec: data.waterSpeedMmSec ?? 100.0,
      },
    });
  },

  async updateConfig(id: number, data: Partial<WateringConfigData>) {
    return prisma.wateringConfig.update({
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
        ...(data.zMaxMm !== undefined && { zMaxMm: data.zMaxMm }),
        ...(data.zWaterMm !== undefined && { zWaterMm: data.zWaterMm }),
        ...(data.tofSamples !== undefined && { tofSamples: data.tofSamples }),
        ...(data.sweepSpeedMmSec !== undefined && { sweepSpeedMmSec: data.sweepSpeedMmSec }),
        ...(data.waterSpeedMmSec !== undefined && { waterSpeedMmSec: data.waterSpeedMmSec }),
      },
    });
  },

  async deleteConfig(id: number) {
    return prisma.wateringConfig.delete({ where: { id } });
  },

  async setDefault(id: number) {
    return prisma.$transaction(async (tx) => {
      await tx.wateringConfig.updateMany({ data: { isDefault: false } });
      return tx.wateringConfig.update({ where: { id }, data: { isDefault: true } });
    });
  },

  buildSnapshot(config: {
    cols: number;
    rows: number;
    gapXMm: number;
    gapYMm: number;
    startXMm: number;
    startYMm: number;
    zMaxMm: number;
    zWaterMm: number;
    tofSamples: number;
    sweepSpeedMmSec: number;
    waterSpeedMmSec: number;
  }): Prisma.InputJsonValue {
    return {
      cols: config.cols,
      rows: config.rows,
      gap_x_mm: config.gapXMm,
      gap_y_mm: config.gapYMm,
      start_x_mm: config.startXMm,
      start_y_mm: config.startYMm,
      z_max_mm: config.zMaxMm,
      z_water_mm: config.zWaterMm,
      tof_samples: config.tofSamples,
      sweep_speed_mm_sec: config.sweepSpeedMmSec,
      water_speed_mm_sec: config.waterSpeedMmSec,
    } as Prisma.InputJsonValue;
  },

  async createWateringStop(sessionId: number, body: CreateWateringStopInput) {
    return prisma.wateringStop.create({
      data: {
        sessionId,
        stopIndex: body.stopIndex,
        xMm: body.xMm,
        yMm: body.yMm,
        maxHeightCm: body.maxHeightCm ?? null,
        valveDurationSec: body.valveDurationSec,
        wateredAt: new Date(),
      },
    });
  },

  async completeWateringSession(sessionId: number, summary: WateringSessionSummaryInput) {
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        completedAt: new Date(),
        maxHeightCm: summary.max_height_cm,
        fuzzyDurationSec: summary.fuzzy_duration_sec,
        stopsWatered: summary.stops_watered,
        moistureBeforeAvg: summary.moisture_before_avg,
        moistureAfterAvg: summary.moisture_after_avg,
      },
    });
  },
};
