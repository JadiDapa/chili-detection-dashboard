import PageHeader from "@/components/root/PageHeader";
import ScheduleManager, {
  type ScheduleTaskView,
} from "@/components/root/schedule/ScheduleManager";
import { ScheduleService } from "@/server/services/schedule.service";

// Single-bed deployment (matches SessionSidebar). Change if multi-bed lands.
const BED_ID = 1;

export default async function SchedulePage() {
  const tasks = await ScheduleService.list(BED_ID);

  const view: ScheduleTaskView[] = tasks.map((t) => ({
    id: t.id,
    name: t.name,
    sessionType: t.sessionType,
    scanConfigId: t.scanConfigId,
    wateringConfigId: t.wateringConfigId,
    configName: t.scanConfig?.name ?? t.wateringConfig?.name ?? null,
    timeOfDay: t.timeOfDay,
    daysOfWeek: t.daysOfWeek,
    timezone: t.timezone,
    enabled: t.enabled,
    nextRunAt:
      t.enabled
        ? (ScheduleService.nextRunAt(t)?.toISOString() ?? null)
        : null,
    runs: t.runs.map((r) => ({
      id: r.id,
      scheduledFor: r.scheduledFor.toISOString(),
      status: r.status,
      skipReason: r.skipReason,
      sessionId: r.sessionId,
      sessionStatus: r.session?.status ?? null,
    })),
  }));

  return (
    <main className="min-h-full w-full space-y-8 border bg-white p-4 md:rounded-2xl lg:p-6 dark:bg-transparent">
      <PageHeader
        title="Schedule"
        subtitle="Plan recurring watering and scanning sessions. The gantry runs these automatically — no need to keep this page open."
      />
      <ScheduleManager bedId={BED_ID} tasks={view} />
    </main>
  );
}
