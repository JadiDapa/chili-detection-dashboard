import PageHeader from "@/components/root/PageHeader";
import { PlantsCam } from "@/components/root/plants/PlantsCam";
import { piApi } from "@/lib/pi";
import { ScanConfigService } from "@/server/services/scan-config.service";
import ScanningResultChart from "@/components/root/plants/section/ScanningResultChart";
import SectionOverviewStats from "@/components/root/plants/section/SectionOverviewStats";
import GantryControl from "@/components/root/plants/section/GantryControl";
import HardwarePanel from "@/components/root/plants/section/HardwarePanel";
import ServoPanTiltControl from "@/components/root/plants/section/ServoPanTiltControl";
import SessionSidebar from "@/components/root/plants/section/SessionSidebar";
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
    <main className="flex min-h-screen w-full flex-col gap-3 overflow-hidden py-2 lg:flex-row lg:pe-3">
      <div className="min-w-0 px-3 lg:flex-5">
        <div className="flex items-center justify-between gap-3">
          <PageHeader
            title={`Section: ${section}`}
            subtitle="Live feed and detailed information about this planter bed"
          />
          <Button className="shrink-0">
            <span className="hidden sm:inline">Start Session</span> <Play />
          </Button>
        </div>

        <div className="mt-4">
          {/* Live Cam */}
          <div className="relative min-h-60 overflow-hidden rounded-xl bg-zinc-900 sm:min-h-120">
            <PlantsCam
              label={`Planter Bed ${section}`}
              streamUrl={piApi.streamUrl()}
              roiWPct={defaultConfig?.roiWPct ?? 100}
              roiHPct={defaultConfig?.roiHPct ?? 100}
            />
          </div>

          <div className="flex flex-col gap-3 py-3 pr-1 pb-4">
            <SectionOverviewStats />
            <ScanningResultChart />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <ServoPanTiltControl />
              <GantryControl />
              <HardwarePanel />
            </div>
          </div>
        </div>
      </div>

      <SessionSidebar />
    </main>
  );
}
