import PageHeader from "@/components/root/PageHeader";
import { PlantsCam } from "@/components/root/plants/PlantsCam";
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
    <main className="flex min-h-screen w-full gap-3 overflow-hidden pe-3 pt-2">
      <div className="flex-5 p-3">
        <div className="flex items-center justify-between">
          <PageHeader
            title={`Section: ${section}`}
            subtitle="Live feed and detailed information about this planter bed"
          />
          <Button>
            Start Session <Play />
          </Button>
        </div>

        <div className="mt-4 flex flex-3">
          {/* Live Cam */}
          <div className="relative min-h-50 flex-3 overflow-hidden rounded-xl bg-zinc-900">
            <PlantsCam
              label={`Planter Bed ${section}`}
              streamUrl={"http://100.127.114.61:8000/camera/stream"}
            />
          </div>

          <div className="">
            {/* Overview Chart */}
            <div className=""></div>
            {/* Scanning Result */}
            <div className=""></div>
          </div>
        </div>
      </div>
      <SessionSidebar />
    </main>
  );
}
