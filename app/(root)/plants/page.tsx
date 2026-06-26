import PageHeader from "@/components/root/PageHeader";
import HarvestSummaryChart from "@/components/root/plants/HarvestSummaryChart";
import RadialChart from "@/components/root/plants/RadialChart";
import PlantsStats from "@/components/root/plants/PlantsStats";
import PlanterBedList from "@/components/root/plants/PlanterBedList";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlantsPage() {
  return (
    <main className="min-h-screen w-full gap-3 overflow-hidden pt-2">
      <div className="flex w-full items-center justify-between gap-3">
        <PageHeader
          title="All Plants"
          subtitle="Every chili tree that planted on Elektro Unsri Greenhouse's"
        />
        <Button className="shrink-0">
          <span className="hidden sm:inline">Start Session</span> <Play />
        </Button>
      </div>
      <div className="flex flex-col gap-3 py-4 lg:flex-row">
        <div className="flex flex-1 gap-3">
          <div className="flex-1 gap-3 space-y-4">
            {/* Stats */}
            <PlantsStats />

            {/* Bar Chart */}
            <HarvestSummaryChart />

            {/* Radial Chart */}
            <RadialChart />
          </div>
        </div>
        <div className="hidden min-h-screen w-px bg-slate-300 lg:block"></div>
        {/* Right Side — real planter beds from the DB */}
        <div className="space-y-3 lg:flex-2">
          <PlanterBedList />
        </div>
      </div>
    </main>
  );
}
