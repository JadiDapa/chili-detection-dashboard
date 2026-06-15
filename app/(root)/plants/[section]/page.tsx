import PageHeader from "@/components/root/PageHeader";
import { PlantsCam } from "@/components/root/plants/PlantsCam";
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

  return (
    <main className="flex min-h-screen w-full gap-3 overflow-hidden py-2 pe-3">
      <div className="flex-5 px-3">
        <div className="flex items-center justify-between">
          <PageHeader
            title={`Section: ${section}`}
            subtitle="Live feed and detailed information about this planter bed"
          />
          <Button>
            Start Session <Play />
          </Button>
        </div>

        <div className="mt-4 flex-3">
          {/* Live Cam */}
          <div className="relative min-h-120 flex-3 overflow-hidden rounded-xl bg-zinc-900">
            <PlantsCam
              label={`Planter Bed ${section}`}
              streamUrl={"http://100.127.114.61:8000/camera/stream"}
            />
          </div>

          <div className="flex flex-col gap-3 py-3 pr-1 pb-4">
            <SectionOverviewStats />
            <ScanningResultChart />
            <div className="flex gap-3">
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
