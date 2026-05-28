import { SessionStatus, SessionType, Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { PiPlantScan } from "@/lib/pi";
import { fileUploadFromUrl } from "@/lib/file-upload";
import { ScanConfigService } from "@/server/services/scan-config.service";
import { WateringService } from "@/server/services/watering.service";

export type PiSyncPayload = {
  session_id: string;
  status: "complete" | "stopped" | "error";
  bed_id: string;
  started_at: string;
  completed_at: string;
  notes?: string | null;
  plant_scans: PiPlantScan[];
  summary: {
    total_plants: number;
    avg_height_cm: number;
    avg_moisture_pct: number;
    total_water_sec: number;
    ripeness: { ripe: number; turning: number; unripe: number; broken: number };
    harvest_ready_ids: number[];
  };
};

export type CreateCaptureInput = {
  row: number;
  col: number;
  imageUrl: string;
  totalFruits: number;
  ripeCount: number;
  turningCount: number;
  unripeCount: number;
  brokenCount: number;
};

export type UpdateSensorsInput = {
  heightCm: number | null;
  moisturePct: number | null;
  valveDurationSec: number | null;
  wateringReason: string | null;
};

export type SessionSummaryInput = {
  totalPlants: number;
  avgHeightCm: number;
  avgMoisturePct: number;
  totalWaterSec: number;
  ripeness: { ripe: number; turning: number; unripe: number; broken: number };
  harvestReadyIds: number[];
};

function mapStatus(s: PiSyncPayload["status"]): SessionStatus {
  if (s === "complete") return SessionStatus.COMPLETED;
  if (s === "stopped") return SessionStatus.STOPPED;
  return SessionStatus.ERROR;
}

export const SessionService = {
  async list() {
    return prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        captures: { orderBy: { plantIndex: "asc" } },
        wateringStops: { orderBy: { stopIndex: "asc" } },
      },
    });
  },

  async getById(id: number) {
    return prisma.session.findUnique({
      where: { id },
      include: {
        captures: { orderBy: { plantIndex: "asc" } },
        wateringStops: { orderBy: { stopIndex: "asc" } },
      },
    });
  },

  async create(
    bedId: number,
    notes?: string | null,
    scanConfigId?: number | null,
    sessionType?: "SCAN" | "WATERING",
    wateringConfigId?: number | null,
  ) {
    const type: SessionType = sessionType === "WATERING" ? SessionType.WATERING : SessionType.SCAN;

    let resolvedScanConfigId: number | null = null;
    let scanConfigSnapshot: Prisma.InputJsonValue | undefined;

    let resolvedWateringConfigId: number | null = null;
    let wateringConfigSnapshot: Prisma.InputJsonValue | undefined;

    if (type === SessionType.SCAN) {
      // Resolve scan config: explicit id → fallback to default → none
      resolvedScanConfigId = scanConfigId ?? null;
      if (resolvedScanConfigId == null) {
        const def = await prisma.scanConfig.findFirst({ where: { isDefault: true } });
        if (def) resolvedScanConfigId = def.id;
      }
      if (resolvedScanConfigId != null) {
        const config = await prisma.scanConfig.findUnique({ where: { id: resolvedScanConfigId } });
        if (config) scanConfigSnapshot = ScanConfigService.buildSnapshot(config);
      }
    } else {
      // Resolve watering config: explicit id → fallback to default → none
      resolvedWateringConfigId = wateringConfigId ?? null;
      if (resolvedWateringConfigId == null) {
        const def = await prisma.wateringConfig.findFirst({ where: { isDefault: true } });
        if (def) resolvedWateringConfigId = def.id;
      }
      if (resolvedWateringConfigId != null) {
        const config = await prisma.wateringConfig.findUnique({ where: { id: resolvedWateringConfigId } });
        if (config) wateringConfigSnapshot = WateringService.buildSnapshot(config);
      }
    }

    return prisma.session.create({
      data: {
        bedId,
        notes: notes ?? null,
        sessionType: type,
        scanConfigId: resolvedScanConfigId,
        ...(scanConfigSnapshot !== undefined && { scanConfigSnapshot }),
        wateringConfigId: resolvedWateringConfigId,
        ...(wateringConfigSnapshot !== undefined && { wateringConfigSnapshot }),
      },
    });
  },

  async patchStatus(sessionId: number, status: "running" | "stopped" | "error") {
    const statusMap = {
      running: SessionStatus.RUNNING,
      stopped: SessionStatus.STOPPED,
      error: SessionStatus.ERROR,
    };
    const data: { status: SessionStatus; startedAt?: Date; completedAt?: Date } = {
      status: statusMap[status],
    };
    if (status === "running") data.startedAt = new Date();
    if (status === "stopped" || status === "error") data.completedAt = new Date();
    return prisma.session.update({ where: { id: sessionId }, data });
  },

  async createCapture(sessionId: number, plantIndex: number, body: CreateCaptureInput) {
    const session = await prisma.session.findUniqueOrThrow({
      where: { id: sessionId },
      select: { bedId: true },
    });
    const plant = await prisma.plant.findFirst({
      where: { bedId: session.bedId, row: body.row, col: body.col },
      select: { id: true },
    });
    return prisma.captures.create({
      data: {
        sessionId,
        plantIndex,
        plantId: plant?.id ?? null,
        row: body.row,
        col: body.col,
        imageUrl: body.imageUrl,
        imageLocal: true,
        totalFruits: body.totalFruits,
        ripeCount: body.ripeCount,
        turningCount: body.turningCount,
        unripeCount: body.unripeCount,
        brokenCount: body.brokenCount,
        scannedAt: new Date(),
      },
    });
  },

  async updateCaptureSensors(sessionId: number, plantIndex: number, body: UpdateSensorsInput) {
    await prisma.captures.updateMany({
      where: { sessionId, plantIndex },
      data: {
        heightCm: body.heightCm,
        moisturePct: body.moisturePct,
        valveDurationSec: body.valveDurationSec,
        wateringReason: body.wateringReason,
      },
    });
  },

  async completeSession(sessionId: number, summary: SessionSummaryInput) {
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        completedAt: new Date(),
        totalPlants: summary.totalPlants,
        avgHeightCm: summary.avgHeightCm,
        avgMoisturePct: summary.avgMoisturePct,
        totalWaterSec: summary.totalWaterSec,
        totalRipe: summary.ripeness.ripe,
        totalTurning: summary.ripeness.turning,
        totalUnripe: summary.ripeness.unripe,
        totalDamaged: summary.ripeness.broken,
        harvestReadyIds: JSON.stringify(summary.harvestReadyIds),
      },
    });
  },

  async errorSession(sessionId: number) {
    return prisma.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.ERROR, completedAt: new Date() },
    });
  },

  // Upsert a completed session POSTed by the RPi after a scan ends.
  // Idempotent: posting the same session_id twice replaces captures and
  // updates summary fields without creating duplicates.
  async syncFromPi(payload: PiSyncPayload) {
    const bedId = parseInt(payload.bed_id, 10);
    if (isNaN(bedId)) throw new Error(`Invalid bed_id: ${payload.bed_id}`);

    const status = mapStatus(payload.status);
    const { summary } = payload;

    const sessionData = {
      bedId,
      status,
      startedAt: new Date(payload.started_at),
      completedAt: new Date(payload.completed_at),
      notes: payload.notes ?? null,
      totalPlants: summary.total_plants,
      avgHeightCm: summary.avg_height_cm,
      avgMoisturePct: summary.avg_moisture_pct,
      totalWaterSec: summary.total_water_sec,
      totalRipe: summary.ripeness.ripe,
      totalTurning: summary.ripeness.turning,
      totalUnripe: summary.ripeness.unripe,
      totalDamaged: summary.ripeness.broken,
      harvestReadyIds: JSON.stringify(summary.harvest_ready_ids),
    };

    // Fetch and save images before opening the DB transaction.
    // Network I/O must not live inside a transaction.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    const resolvedImages = await Promise.all(
      payload.plant_scans.map(async (scan) => {
        if (!scan.image_url) return { imageUrl: "", imageLocal: false };
        try {
          const filename = await fileUploadFromUrl(scan.image_url, "uploads");
          return {
            imageUrl: `${baseUrl}/api/uploads/${filename}`,
            imageLocal: true,
          };
        } catch (err) {
          console.warn(
            `[sync] image fetch failed for plant ${scan.plant_id}, falling back to RPi URL:`,
            err,
          );
          return { imageUrl: scan.image_url, imageLocal: false };
        }
      }),
    );

    return prisma.$transaction(async (tx) => {
      const session = await tx.session.upsert({
        where: { externalId: payload.session_id },
        create: { externalId: payload.session_id, ...sessionData },
        update: sessionData,
      });

      // Replace captures atomically — safe because Captures are leaf nodes
      await tx.captures.deleteMany({ where: { sessionId: session.id } });

      if (payload.plant_scans.length > 0) {
        // Build (row, col) → DB plantId lookup for this bed
        const plants = await tx.plant.findMany({
          where: { bedId },
          select: { id: true, row: true, col: true },
        });
        const plantMap = new Map(
          plants.map((p) => [`${p.row}:${p.col}`, p.id]),
        );

        await tx.captures.createMany({
          data: payload.plant_scans.map((scan, i) => ({
            sessionId: session.id,
            plantId: plantMap.get(`${scan.row}:${scan.col}`) ?? null,
            plantIndex: scan.plant_id,
            row: scan.row,
            col: scan.col,
            imageUrl: resolvedImages[i].imageUrl,
            imageLocal: resolvedImages[i].imageLocal,
            totalFruits: scan.total_fruits ?? 0,
            ripeCount: scan.ripe_count ?? 0,
            turningCount: scan.turning_count ?? 0,
            unripeCount: scan.unripe_count ?? 0,
            brokenCount: scan.broken_count ?? 0,
            heightCm: scan.height_cm ?? null,
            moisturePct: scan.moisture_pct ?? null,
            valveDurationSec: scan.valve_duration_sec ?? null,
            wateringReason: scan.watering_reason ?? null,
            scannedAt: scan.scanned_at ? new Date(scan.scanned_at) : new Date(),
            lateSynced: false,
          })),
        });
      }

      return session;
    });
  },
};
