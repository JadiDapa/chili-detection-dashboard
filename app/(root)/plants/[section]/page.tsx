import PageHeader from "@/components/root/PageHeader";
import { PlantsCam } from "@/components/root/plants/PlantsCam";
import { piApi } from "@/lib/pi";
import { CAMERA_ASPECT_CLASS } from "@/lib/camera";
import { ScanConfigService } from "@/server/services/scan-config.service";
import ScanningResultChart from "@/components/root/plants/section/ScanningResultChart";
import SectionOverviewStats from "@/components/root/plants/section/SectionOverviewStats";
import EmergencyStopButton from "@/components/root/plants/section/EmergencyStopButton";
import ManualControlSheet from "@/components/root/plants/section/ManualControlSheet";
import GridLayoutSheet from "@/components/root/plants/section/GridLayoutSheet";
import SessionSidebarPanel from "@/components/root/plants/section/SessionSidebarPanel";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default async function PlantSections({
  params,
}: {
  params: { section: string };
}) {
  const { section } = await params;
  const defaultConfig = await ScanConfigService.getDefault();

  return (
    <main className="flex min-h-full w-full flex-col gap-3 py-2 lg:flex-row lg:pe-3">
      <div className="min-w-0 px-3 lg:flex-5">
        <div className="flex items-center justify-between gap-3">
          <PageHeader
            title={`Section: ${section}`}
            subtitle="Live feed and detailed information about this planter bed"
          />
          <div className="flex shrink-0 items-center gap-2">
            <GridLayoutSheet bedId={1} />
            <ManualControlSheet />
            <EmergencyStopButton />
          </div>
        </div>

        <div className="mt-4">
          {/* Live Cam — locked to the camera 4:3 ratio so the ROI overlay maps
              1:1 to the RPi ROI (see lib/camera.ts). */}
          <div
            className={`relative ${CAMERA_ASPECT_CLASS} w-full overflow-hidden rounded-xl bg-zinc-900`}
          >
            <PlantsCam
              label={`Planter Bed ${section}`}
              streamUrl={piApi.streamUrl()}
              roiWPct={defaultConfig?.roiWPct ?? 100}
              roiHPct={defaultConfig?.roiHPct ?? 100}
              bedId={1}
            />
          </div>

          <div className="flex flex-col gap-3 py-3 pr-1 pb-4">
            <SectionOverviewStats />
            <ScanningResultChart />
          </div>
        </div>
      </div>

      <SessionSidebarPanel />
    </main>
  );
}
