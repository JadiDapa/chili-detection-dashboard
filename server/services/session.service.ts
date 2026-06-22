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
  annotatedImageUrl?: string | null;
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

// Aggregate whatever captures were persisted so far into the session summary
// fields. Used when a session ends WITHOUT a normal completion (stopped/error)
// so the detail view can still show "what it got" instead of a blank summary.
async function buildPartialSummary(sessionId: number) {
  const captures = await prisma.captures.findMany({ where: { sessionId } });
  if (captures.length === 0) return null;

  const sum = (pick: (c: (typeof captures)[number]) => number) =>
    captures.reduce((acc, c) => acc + pick(c), 0);
  const avg = (vals: number[]) =>
    vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

  const heights = captures
    .map((c) => c.heightCm)
    .filter((h): h is number => h != null);
  const moistures = captures
    .map((c) => c.moisturePct)
    .filter((m): m is number => m != null);
  const harvestReadyIds = captures
    .filter((c) => c.ripeCount > 3)
    .map((c) => c.plantIndex)
    .filter((p): p is number => p != null);

  return {
    totalPlants: captures.length,
    totalRipe: sum((c) => c.ripeCount),
    totalTurning: sum((c) => c.turningCount),
    totalUnripe: sum((c) => c.unripeCount),
    totalDamaged: sum((c) => c.brokenCount),
    avgHeightCm: avg(heights),
    avgMoisturePct: avg(moistures),
    harvestReadyIds: JSON.stringify(harvestReadyIds),
  };
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
    const data: Prisma.SessionUpdateInput = { status: statusMap[status] };
    if (status === "running") data.startedAt = new Date();
    if (status === "stopped" || status === "error") {
      data.completedAt = new Date();
      // Surface whatever data was collected before the early end.
      const partial = await buildPartialSummary(sessionId);
      if (partial) Object.assign(data, partial);
    }
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
        // RPi already POSTed the annotated frame through the image route, so this
        // is a dashboard-hosted /api/uploads URL (or null in stub/no-render runs).
        annotatedImageUrl: body.annotatedImageUrl ?? null,
        annotatedImageLocal: true,
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
    const data: Prisma.SessionUpdateInput = {
      status: SessionStatus.ERROR,
      completedAt: new Date(),
    };
    // Keep the partial scan results captured before the failure.
    const partial = await buildPartialSummary(sessionId);
    if (partial) Object.assign(data, partial);
    return prisma.session.update({ where: { id: sessionId }, data });
  },

  // Upsert a completed session POSTed by the RPi after a scan ends.
  // Idempotent: posting the same session_id twice replaces captures and
  // updates summary fields without creating duplicates.
  async syncFromPi(payload: PiSyncPayload) {
    // The RPi holds the Next.js integer Session id (passed to it at /start) and
    // the live per-plant routes already update that row by id. So reconcile the
    // end-of-session sync by that same primary id — NOT by externalId, which the
    // live flow never sets (matching by externalId would create a duplicate row).
    // externalId is still stored for traceability.
    const sessionId = parseInt(payload.session_id, 10);
    if (isNaN(sessionId)) throw new Error(`Invalid session_id: ${payload.session_id}`);

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
    // Store RELATIVE URLs so they resolve against whatever origin serves the
    // dashboard (see captures image route for rationale).
    const fetchImage = async (
      url: string | null,
      plantId: number,
      label: string,
    ): Promise<{ url: string | null; local: boolean }> => {
      if (!url) return { url: null, local: false };
      try {
        const filename = await fileUploadFromUrl(url, "uploads");
        return { url: `/api/uploads/${filename}`, local: true };
      } catch (err) {
        console.warn(
          `[sync] ${label} image fetch failed for plant ${plantId}, falling back to RPi URL:`,
          err,
        );
        return { url, local: false };
      }
    };

    const resolvedImages = await Promise.all(
      payload.plant_scans.map(async (scan) => {
        const [raw, annotated] = await Promise.all([
          fetchImage(scan.image_url, scan.plant_id, "raw"),
          fetchImage(scan.annotated_image_url, scan.plant_id, "annotated"),
        ]);
        return {
          imageUrl: raw.url ?? "",
          imageLocal: raw.local,
          annotatedImageUrl: annotated.url,
          annotatedImageLocal: annotated.local,
        };
      }),
    );

    return prisma.$transaction(async (tx) => {
      const session = await tx.session.upsert({
        where: { id: sessionId },
        create: { id: sessionId, externalId: payload.session_id, ...sessionData },
        update: { externalId: payload.session_id, ...sessionData },
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
            annotatedImageUrl: resolvedImages[i].annotatedImageUrl,
            annotatedImageLocal: resolvedImages[i].annotatedImageLocal,
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
