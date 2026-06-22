import { Prisma, ScheduleRunStatus, SessionStatus, SessionType } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { SessionService } from "@/server/services/session.service";

// A scheduled slot is "due" if now is within this window after the slot instant.
// Wide enough to tolerate poll jitter, narrow enough that a real outage is treated
// as a missed slot (→ skipped, never caught up).
const DUE_WINDOW_MS = 3 * 60_000; // 3 minutes
// A dispatched-but-not-yet-run session is queued behind a running one. If it can't
// start within this window of its slot it is abandoned (STOPPED) rather than run
// at the wrong time of day.
const QUEUE_GRACE_MS = 30 * 60_000; // 30 minutes

export type ScheduledTaskData = {
  bedId: number;
  name?: string | null;
  sessionType: "SCAN" | "WATERING";
  scanConfigId?: number | null;
  wateringConfigId?: number | null;
  timeOfDay: string; // local "HH:MM"
  daysOfWeek?: number[]; // 0=Sun..6=Sat; empty = every day
  timezone?: string;
  enabled?: boolean;
};

export type DueSession = {
  session_id: number;
  session_type: "SCAN" | "WATERING";
  config: Prisma.JsonValue | null; // RPi-shaped snapshot (snake_case) or null
};

// ─── Timezone helpers (Intl-based, no extra deps) ──────────────────────────────

// (localWallClock - utc) in ms for `date` observed in `timeZone`.
function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, number> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") map[p.type] = Number(p.value);
  }
  const asUTC = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
  return asUTC - date.getTime();
}

// UTC instant for a local wall-clock (y/m/d h:m) in `timeZone`.
function zonedToUtc(
  y: number,
  m: number,
  d: number,
  hh: number,
  mm: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const offset = tzOffsetMs(new Date(guess), timeZone);
  return new Date(guess - offset);
}

// Local calendar date + weekday for `date` in `timeZone`.
function localDateParts(date: Date, timeZone: string): { y: number; m: number; d: number; dow: number } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) map[p.type] = p.value;
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
    dow: dowMap[map.weekday],
  };
}

function parseHHMM(timeOfDay: string): { hh: number; mm: number } {
  const [hh, mm] = timeOfDay.split(":").map(Number);
  return { hh: hh || 0, mm: mm || 0 };
}

function runsOnDay(daysOfWeek: number[], dow: number): boolean {
  return daysOfWeek.length === 0 || daysOfWeek.includes(dow);
}

// All slot instants for a task over the local dates [today-1, today, ...+aheadDays].
function slotInstants(
  task: { timeOfDay: string; daysOfWeek: number[]; timezone: string },
  from: Date,
  backDays: number,
  aheadDays: number,
): Date[] {
  const { hh, mm } = parseHHMM(task.timeOfDay);
  const slots: Date[] = [];
  for (let off = -backDays; off <= aheadDays; off++) {
    // Shift by whole local days using a noon anchor to avoid DST edge issues.
    const anchor = new Date(from.getTime() + off * 86_400_000);
    const { y, m, d, dow } = localDateParts(anchor, task.timezone);
    if (!runsOnDay(task.daysOfWeek, dow)) continue;
    slots.push(zonedToUtc(y, m, d, hh, mm, task.timezone));
  }
  return slots;
}

// ─── Service ───────────────────────────────────────────────────────────────────

export const ScheduleService = {
  async list(bedId?: number) {
    return prisma.scheduledTask.findMany({
      where: bedId ? { bedId } : undefined,
      orderBy: [{ sessionType: "asc" }, { timeOfDay: "asc" }],
      include: {
        scanConfig: { select: { id: true, name: true } },
        wateringConfig: { select: { id: true, name: true } },
        runs: {
          orderBy: { scheduledFor: "desc" },
          take: 5,
          include: { session: { select: { id: true, status: true } } },
        },
      },
    });
  },

  async getById(id: number) {
    return prisma.scheduledTask.findUnique({ where: { id } });
  },

  async create(data: ScheduledTaskData) {
    return prisma.scheduledTask.create({
      data: {
        bedId: data.bedId,
        name: data.name ?? null,
        sessionType: data.sessionType === "WATERING" ? SessionType.WATERING : SessionType.SCAN,
        scanConfigId: data.sessionType === "SCAN" ? (data.scanConfigId ?? null) : null,
        wateringConfigId: data.sessionType === "WATERING" ? (data.wateringConfigId ?? null) : null,
        timeOfDay: data.timeOfDay,
        daysOfWeek: data.daysOfWeek ?? [],
        timezone: data.timezone ?? "Asia/Jakarta",
        enabled: data.enabled ?? true,
      },
    });
  },

  async update(id: number, data: Partial<ScheduledTaskData>) {
    return prisma.scheduledTask.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.sessionType !== undefined && {
          sessionType: data.sessionType === "WATERING" ? SessionType.WATERING : SessionType.SCAN,
        }),
        ...(data.scanConfigId !== undefined && { scanConfigId: data.scanConfigId }),
        ...(data.wateringConfigId !== undefined && { wateringConfigId: data.wateringConfigId }),
        ...(data.timeOfDay !== undefined && { timeOfDay: data.timeOfDay }),
        ...(data.daysOfWeek !== undefined && { daysOfWeek: data.daysOfWeek }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
      },
    });
  },

  async remove(id: number) {
    return prisma.scheduledTask.delete({ where: { id } });
  },

  async setEnabled(id: number, enabled: boolean) {
    return prisma.scheduledTask.update({ where: { id }, data: { enabled } });
  },

  // Next future slot instant for a task (for UI display). null if none ahead.
  nextRunAt(
    task: { timeOfDay: string; daysOfWeek: number[]; timezone: string },
    now: Date = new Date(),
  ): Date | null {
    const slots = slotInstants(task, now, 0, 8)
      .filter((s) => s.getTime() > now.getTime())
      .sort((a, b) => a.getTime() - b.getTime());
    return slots[0] ?? null;
  },

  // Core firing routine. Called by the RPi poller. Idempotent per slot via the
  // ScheduleRun @@unique([scheduledTaskId, scheduledFor]) constraint.
  async tick(bedId: number, now: Date = new Date()): Promise<DueSession[]> {
    const tasks = await prisma.scheduledTask.findMany({ where: { bedId, enabled: true } });

    for (const task of tasks) {
      // Consider yesterday + today's slots to cover the midnight boundary.
      for (const slot of slotInstants(task, now, 1, 0)) {
        const age = now.getTime() - slot.getTime();
        if (age < 0) continue; // future slot — not due yet
        const existing = await prisma.scheduleRun.findUnique({
          where: { scheduledTaskId_scheduledFor: { scheduledTaskId: task.id, scheduledFor: slot } },
        });
        if (existing) continue; // already handled this slot

        if (age <= DUE_WINDOW_MS) {
          await dispatch(task, slot);
        } else {
          // Missed: system was offline at the scheduled time → skip, never catch up.
          await skip(task.id, slot, "missed (system offline at scheduled time)");
        }
      }
    }

    // Abandon queued sessions that waited too long behind a running one.
    await expireStale(now);

    // Return ready-to-run dispatched sessions, oldest slot first.
    const ready = await prisma.scheduleRun.findMany({
      where: {
        status: ScheduleRunStatus.DISPATCHED,
        scheduledTask: { bedId },
        session: { status: SessionStatus.PENDING },
      },
      orderBy: { scheduledFor: "asc" },
      include: {
        session: {
          select: {
            id: true,
            sessionType: true,
            scanConfigSnapshot: true,
            wateringConfigSnapshot: true,
          },
        },
      },
    });

    return ready
      .filter((r) => r.session)
      .map((r) => ({
        session_id: r.session!.id,
        session_type: r.session!.sessionType,
        config:
          r.session!.sessionType === SessionType.WATERING
            ? r.session!.wateringConfigSnapshot
            : r.session!.scanConfigSnapshot,
      }));
  },
};

// Claim the slot (unique run), then create the PENDING session and link it.
// Creating the run first means a duplicate tick fails the unique constraint and
// never produces an orphan session.
async function dispatch(
  task: { id: number; bedId: number; sessionType: SessionType; scanConfigId: number | null; wateringConfigId: number | null },
  slot: Date,
): Promise<void> {
  let run;
  try {
    run = await prisma.scheduleRun.create({
      data: {
        scheduledTaskId: task.id,
        scheduledFor: slot,
        status: ScheduleRunStatus.DISPATCHED,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return; // raced
    throw e;
  }

  try {
    const session = await SessionService.create(
      task.bedId,
      `Scheduled ${task.sessionType.toLowerCase()}`,
      task.scanConfigId,
      task.sessionType === SessionType.WATERING ? "WATERING" : "SCAN",
      task.wateringConfigId,
    );
    await prisma.scheduleRun.update({ where: { id: run.id }, data: { sessionId: session.id } });
  } catch {
    await prisma.scheduleRun.update({
      where: { id: run.id },
      data: { status: ScheduleRunStatus.SKIPPED, skipReason: "session creation failed" },
    });
  }
}

async function skip(scheduledTaskId: number, slot: Date, reason: string): Promise<void> {
  try {
    await prisma.scheduleRun.create({
      data: {
        scheduledTaskId,
        scheduledFor: slot,
        status: ScheduleRunStatus.SKIPPED,
        skipReason: reason,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return;
    throw e;
  }
}

async function expireStale(now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - QUEUE_GRACE_MS);
  const stale = await prisma.scheduleRun.findMany({
    where: {
      status: ScheduleRunStatus.DISPATCHED,
      scheduledFor: { lt: cutoff },
      session: { status: SessionStatus.PENDING },
    },
    select: { id: true, sessionId: true },
  });
  for (const r of stale) {
    if (r.sessionId != null) {
      await prisma.session.update({
        where: { id: r.sessionId },
        data: { status: SessionStatus.STOPPED, completedAt: now },
      });
    }
    await prisma.scheduleRun.update({
      where: { id: r.id },
      data: { skipReason: "expired in queue (busy past grace window)" },
    });
  }
}
