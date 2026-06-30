"use client";

import { GreenhouseCam } from "@/components/root/dashboard/GreenhouseCam";
import ScheduleReminder from "@/components/root/dashboard/ScheduleReminder";
import SecondaryStats from "@/components/root/dashboard/SecondaryStats";
import StatGrid from "@/components/root/dashboard/StatGrid";
import WaterResourceUsage from "@/components/root/dashboard/WaterResourceUsage";
import WeeklyYeild from "@/components/root/dashboard/WeeklyYeild";
import { piApi } from "@/lib/pi";

// ─── page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <main className="min-h-full w-full pt-2">
      <div className="flex flex-col gap-2 lg:flex-row">
        {/* ════ LEFT COLUMN ════ */}
        <div className="flex flex-col gap-2 lg:flex-2">
          {/* Schedule */}
          <ScheduleReminder />

          {/* Stats 2×2 — plant/bed counts + live ambient sensors */}
          <StatGrid />

          {/* Irrigation summary */}
          <WaterResourceUsage />

          {/* Plant-health metrics from the latest sessions */}
          <SecondaryStats />
        </div>

        {/* ════ RIGHT COLUMN ════ */}
        <div className="flex flex-col gap-2 lg:flex-3">
          <GreenhouseCam
            streamUrl={piApi.streamUrl()}
            streamType="mjpeg"
            label="Greenhouse A — Cam 01"
            bedId={1}
          />

          <WeeklyYeild />
        </div>
      </div>
    </main>
  );
}
