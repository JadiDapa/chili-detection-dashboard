import { SessionStatus, SessionType } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

// Plants with at least this many ripe fruits in their last scan are considered
// ready to pick. Matches the dashboard's partial-summary threshold
// (session.service.ts buildPartialSummary uses ripeCount > 3).
const HARVEST_READY_RIPE = 3;

export type DashboardOverview = {
  bed: { id: number; name: string; rows: number; cols: number } | null;
  plantCount: number;
  bedCount: number;
  harvestReady: number;
  ripeness: {
    ripe: number;
    turning: number;
    unripe: number;
    broken: number;
  } | null;
  lastScanAt: string | null;
  avgHeightCm: number | null;
  avgMoisturePct: number | null;
  water: {
    lastWaterSec: number | null;
    moistureBeforeAvg: number | null;
    moistureAfterAvg: number | null;
    stopsWatered: number | null;
    lastWateredAt: string | null;
    sessionCount: number;
  };
  // Ripe fruits detected per ISO week from completed scan sessions (oldest → newest).
  weeklyRipe: { week: string; value: number }[];
};

export type PlantsOverview = {
  totalPlants: number;
  totalBeds: number;
  // Cumulative ripe fruits detected across every completed scan.
  totalRipeAllTime: number;
  harvestReady: number;
  // Ripe vs unripe fruit per month (last 6 months with data, oldest → newest).
  monthly: { month: string; ripe: number; unripe: number }[];
  beds: {
    id: number;
    name: string;
    streamUrl: string;
    status: "idle" | "scanning" | "error" | "offline";
    lastScanAt: string | null;
    soilMoisture: number | null;
    lastHarvest: { count: number; date: string | null };
    scanResult: {
      unripe: number;
      turning: number;
      ripe: number;
      broken: number;
    };
  }[];
};

// ISO-8601 week number (1–53). Used to bucket scan sessions into weekly bars.
function isoWeek(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7; // Mon=1 … Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - day); // shift to Thursday of this week
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { year: date.getUTCFullYear(), week };
}

const avg = (vals: number[]) =>
  vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

const round1 = (n: number | null) =>
  n == null ? null : Math.round(n * 10) / 10;

export const DashboardService = {
  async getOverview(bedId: number): Promise<DashboardOverview> {
    const [
      bed,
      plants,
      bedCount,
      lastScan,
      lastWatering,
      scanSessions,
      wateringCount,
    ] = await Promise.all([
      prisma.bed.findUnique({ where: { id: bedId } }),
      prisma.plant.findMany({ where: { bedId } }),
      prisma.bed.count(),
      prisma.session.findFirst({
        where: {
          bedId,
          sessionType: SessionType.SCAN,
          status: SessionStatus.COMPLETED,
        },
        orderBy: { completedAt: "desc" },
      }),
      prisma.session.findFirst({
        where: {
          bedId,
          sessionType: SessionType.WATERING,
          status: SessionStatus.COMPLETED,
        },
        orderBy: { completedAt: "desc" },
      }),
      prisma.session.findMany({
        where: {
          bedId,
          sessionType: SessionType.SCAN,
          status: SessionStatus.COMPLETED,
        },
        orderBy: { completedAt: "asc" },
        select: { completedAt: true, startedAt: true, totalRipe: true },
      }),
      prisma.session.count({
        where: {
          bedId,
          sessionType: SessionType.WATERING,
          status: SessionStatus.COMPLETED,
        },
      }),
    ]);

    // ── Ripeness (latest completed scan, else fall back to cached plant state) ──
    const ripeness =
      lastScan &&
      (lastScan.totalRipe != null ||
        lastScan.totalTurning != null ||
        lastScan.totalUnripe != null ||
        lastScan.totalDamaged != null)
        ? {
            ripe: lastScan.totalRipe ?? 0,
            turning: lastScan.totalTurning ?? 0,
            unripe: lastScan.totalUnripe ?? 0,
            broken: lastScan.totalDamaged ?? 0,
          }
        : plants.length
          ? {
              ripe: plants.reduce((a, p) => a + (p.lastRipe ?? 0), 0),
              turning: plants.reduce((a, p) => a + (p.lastTurning ?? 0), 0),
              unripe: plants.reduce((a, p) => a + (p.lastUnripe ?? 0), 0),
              broken: plants.reduce((a, p) => a + (p.lastDamaged ?? 0), 0),
            }
          : null;

    // ── Harvest-ready: prefer the latest scan's explicit list, else cached state ──
    let harvestReady = 0;
    if (lastScan?.harvestReadyIds) {
      try {
        const ids = JSON.parse(lastScan.harvestReadyIds) as number[];
        harvestReady = Array.isArray(ids) ? ids.length : 0;
      } catch {
        harvestReady = 0;
      }
    } else {
      harvestReady = plants.filter(
        (p) => (p.lastRipe ?? 0) > HARVEST_READY_RIPE,
      ).length;
    }

    // ── Heights / moisture: cached plant state (set by watering sweeps) ──
    const heights = plants
      .map((p) => p.lastHeightCm)
      .filter((h): h is number => h != null);
    const moistures = plants
      .map((p) => p.lastMoisturePct)
      .filter((m): m is number => m != null);
    const avgHeightCm = round1(
      avg(heights) ?? lastWatering?.avgHeightCm ?? null,
    );
    const avgMoisturePct = round1(
      avg(moistures) ??
        lastWatering?.moistureAfterAvg ??
        lastWatering?.avgMoisturePct ??
        null,
    );

    // ── Weekly ripe-fruit trend (last 9 completed scan weeks) ──
    const weekBuckets = new Map<
      string,
      { order: number; week: number; value: number }
    >();
    for (const s of scanSessions) {
      const when = s.completedAt ?? s.startedAt;
      if (!when) continue;
      const { year, week } = isoWeek(when);
      const key = `${year}-${String(week).padStart(2, "0")}`;
      const existing = weekBuckets.get(key);
      const value = s.totalRipe ?? 0;
      if (existing) existing.value += value;
      else weekBuckets.set(key, { order: year * 100 + week, week, value });
    }
    const weeklyRipe = [...weekBuckets.values()]
      .sort((a, b) => a.order - b.order)
      .slice(-9)
      .map((b) => ({ week: `W${b.week}`, value: b.value }));

    return {
      bed: bed
        ? { id: bed.id, name: bed.name, rows: bed.rows, cols: bed.cols }
        : null,
      plantCount: plants.length,
      bedCount,
      harvestReady,
      ripeness,
      lastScanAt:
        (lastScan?.completedAt ?? lastScan?.startedAt)?.toISOString() ?? null,
      avgHeightCm,
      avgMoisturePct,
      water: {
        lastWaterSec: round1(
          lastWatering?.totalWaterSec ?? lastWatering?.fuzzyDurationSec ?? null,
        ),
        moistureBeforeAvg: round1(lastWatering?.moistureBeforeAvg ?? null),
        moistureAfterAvg: round1(lastWatering?.moistureAfterAvg ?? null),
        stopsWatered: lastWatering?.stopsWatered ?? null,
        lastWateredAt:
          (
            lastWatering?.completedAt ?? lastWatering?.startedAt
          )?.toISOString() ?? null,
        sessionCount: wateringCount,
      },
      weeklyRipe,
    };
  },

  async getPlantsOverview(): Promise<PlantsOverview> {
    const [beds, completedScans, runningSessions, latestPerBed] =
      await Promise.all([
        prisma.bed.findMany({
          orderBy: { id: "asc" },
          include: {
            plants: { select: { lastRipe: true, lastMoisturePct: true } },
          },
        }),
        prisma.session.findMany({
          where: {
            sessionType: SessionType.SCAN,
            status: SessionStatus.COMPLETED,
          },
          orderBy: { completedAt: "desc" },
          select: {
            bedId: true,
            completedAt: true,
            startedAt: true,
            totalRipe: true,
            totalTurning: true,
            totalUnripe: true,
            totalDamaged: true,
          },
        }),
        prisma.session.findMany({
          where: { status: SessionStatus.RUNNING },
          select: { bedId: true },
        }),
        // Latest session of any type per bed — used only to surface an error state.
        prisma.session.findMany({
          distinct: ["bedId"],
          orderBy: { createdAt: "desc" },
          select: { bedId: true, status: true },
        }),
      ]);

    const runningBeds = new Set(runningSessions.map((s) => s.bedId));
    const latestStatus = new Map(latestPerBed.map((s) => [s.bedId, s.status]));

    // Most-recent completed scan per bed (completedScans is already desc).
    const lastScanByBed = new Map<number, (typeof completedScans)[number]>();
    for (const s of completedScans) {
      if (!lastScanByBed.has(s.bedId)) lastScanByBed.set(s.bedId, s);
    }

    const totalPlants = beds.reduce((a, b) => a + b.plants.length, 0);
    const harvestReady = beds.reduce(
      (a, b) =>
        a +
        b.plants.filter((p) => (p.lastRipe ?? 0) > HARVEST_READY_RIPE).length,
      0,
    );
    const totalRipeAllTime = completedScans.reduce(
      (a, s) => a + (s.totalRipe ?? 0),
      0,
    );

    // ── Monthly ripe vs unripe (last 6 months with data, oldest → newest) ──
    const monthBuckets = new Map<
      string,
      { order: number; month: string; ripe: number; unripe: number }
    >();
    for (const s of completedScans) {
      const when = s.completedAt ?? s.startedAt;
      if (!when) continue;
      const order = when.getUTCFullYear() * 12 + when.getUTCMonth();
      const key = String(order);
      const month = when.toLocaleString("en-US", { month: "short" });
      const b = monthBuckets.get(key) ?? { order, month, ripe: 0, unripe: 0 };
      b.ripe += s.totalRipe ?? 0;
      b.unripe += s.totalUnripe ?? 0;
      monthBuckets.set(key, b);
    }
    const monthly = [...monthBuckets.values()]
      .sort((a, b) => a.order - b.order)
      .slice(-6)
      .map(({ month, ripe, unripe }) => ({ month, ripe, unripe }));

    const bedViews = beds.map((b) => {
      const last = lastScanByBed.get(b.id);
      const moistures = b.plants
        .map((p) => p.lastMoisturePct)
        .filter((m): m is number => m != null);
      const status: PlantsOverview["beds"][number]["status"] = runningBeds.has(
        b.id,
      )
        ? "scanning"
        : latestStatus.get(b.id) === SessionStatus.ERROR
          ? "error"
          : "idle";
      return {
        id: b.id,
        name: b.name,
        streamUrl: `${b.piUrl.replace(/\/$/, "")}/camera/stream`,
        status,
        lastScanAt:
          (last?.completedAt ?? last?.startedAt)?.toISOString() ?? null,
        soilMoisture: round1(avg(moistures)),
        lastHarvest: {
          count: last?.totalRipe ?? 0,
          date: (last?.completedAt ?? null)?.toISOString() ?? null,
        },
        scanResult: {
          unripe: last?.totalUnripe ?? 0,
          turning: last?.totalTurning ?? 0,
          ripe: last?.totalRipe ?? 0,
          broken: last?.totalDamaged ?? 0,
        },
      };
    });

    return {
      totalPlants,
      totalBeds: beds.length,
      totalRipeAllTime,
      harvestReady,
      monthly,
      beds: bedViews,
    };
  },
};
