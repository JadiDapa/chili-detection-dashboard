"use client";

import { GreenhouseCam } from "@/components/root/dashboard/GreenhouseCam";
import ScheduleReminder from "@/components/root/dashboard/ScheduleReminder";
import SmallStatCard from "@/components/root/dashboard/SmallStatCard";
import WaterResourceUsage from "@/components/root/dashboard/WaterResourceUsage";
import WeeklyYeild from "@/components/root/dashboard/WeeklyYeild";
import { Card } from "@/components/ui/card";
import { Leaf, BoxSelectIcon, Thermometer, Sun } from "lucide-react";

// ─── page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <main className="min-h-screen w-full overflow-hidden pt-2">
      <div className="flex gap-2">
        {/* ════ LEFT COLUMN ════ */}
        <div className="flex flex-2 flex-col gap-2">
          {/* Schedule */}
          <ScheduleReminder />

          {/* Stats 2×2 */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="flex flex-col gap-1 border-none p-4 shadow-none">
              <div className="flex max-w-[80%] items-center gap-2">
                <div className="bg-muted flex items-center justify-center rounded-full p-3">
                  <Leaf className="size-5 text-green-700" />
                </div>
                <p className="text-base leading-tight font-medium">
                  Total Tree Planted
                </p>
              </div>
              <p className="mt-3 text-3xl font-medium">
                48{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  Chili Trees
                </span>
              </p>
            </Card>
            <Card className="flex flex-col gap-1 border-none p-4 shadow-none">
              <div className="flex max-w-[80%] items-center gap-2">
                <div className="bg-muted flex items-center justify-center rounded-full p-3">
                  <BoxSelectIcon className="size-5 text-green-700" />
                </div>
                <p className="text-base leading-tight font-medium">
                  Active Planting Area
                </p>
              </div>
              <p className="mt-3 text-3xl font-medium">
                3{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  Planter Bed
                </span>
              </p>
            </Card>
            <Card className="flex flex-col gap-1 border-none p-4 shadow-none">
              <div className="flex max-w-[80%] items-center gap-2">
                <div className="bg-muted flex items-center justify-center rounded-full p-3">
                  <Sun className="size-5 text-green-700" />
                </div>
                <p className="text-base leading-tight font-medium">
                  Lighting Level
                </p>
              </div>
              <p className="mt-3 text-3xl font-medium">
                270 lux{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  High --- Day
                </span>
              </p>
            </Card>
            <Card className="flex flex-col gap-1 border-none p-4 shadow-none">
              <div className="flex max-w-[80%] items-center gap-2">
                <div className="bg-muted flex items-center justify-center rounded-full p-3">
                  <Thermometer className="size-5 text-green-700" />
                </div>
                <p className="text-base leading-tight font-medium">
                  Environment Temperature
                </p>
              </div>
              <p className="mt-3 text-3xl font-medium">
                28°c{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  Average
                </span>
              </p>
            </Card>
          </div>

          {/* Farm Resource Usage */}
          <WaterResourceUsage />

          <div className="grid grid-cols-3 gap-2">
            <SmallStatCard
              icon={Thermometer}
              label="Environment Temperature"
              value="28°c"
              unit="Average"
              desc="Lorem ipsum dolor sit amet."
            />
            <SmallStatCard
              icon={Thermometer}
              label="Environment Temperature"
              value="28°c"
              unit="Average"
              desc="Lorem ipsum dolor sit amet."
            />{" "}
            <SmallStatCard
              icon={Thermometer}
              label="Environment Temperature"
              value="28°c"
              unit="Average"
              desc="Lorem ipsum dolor sit amet."
            />
          </div>
        </div>

        {/* ════ RIGHT COLUMN ════ */}
        <div className="flex flex-3 flex-col gap-2">
          <GreenhouseCam
            streamUrl="http://YOUR_CAMERA_IP/stream" // ← your MJPEG/HLS URL
            streamType="mjpeg"
            label="Greenhouse A — Cam 01"
          />

          <WeeklyYeild />
        </div>
      </div>
    </main>
  );
}
