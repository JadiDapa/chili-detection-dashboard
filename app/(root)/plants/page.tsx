import { Card } from "@/components/ui/card";
import PageHeader from "@/components/root/PageHeader";
import HarvestSummaryChart from "@/components/root/plants/HarvestSummaryChart";
import RadialChart from "@/components/root/plants/RadialChart";
import { Leaf, Play } from "lucide-react";
import { PlanterBedCard } from "@/components/root/plants/PlanterBedCard";
import { Button } from "@/components/ui/button";

export default function PlantsPage() {
  return (
    <main className="min-h-screen w-full gap-3 overflow-hidden pt-2">
      <div className="flex w-full items-center justify-between">
        <PageHeader
          title="All Plants"
          subtitle="Every chili tree that planted on Elektro Unsri Greenhouse's"
        />
        <Button>
          Start Session <Play />
        </Button>
      </div>
      <div className="flex gap-3 py-4">
        <div className="flex flex-1 gap-3">
          <div className="flex-1 gap-3 space-y-4">
            {/* Stats */}
            <div className="flex gap-3">
              <Card className="w-full border-none p-4 shadow-none">
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-full p-3">
                    <Leaf className="size-5 text-green-700" />
                  </div>
                  <p className="font-medium">Total Tree Planted</p>
                </div>
                <p className="text-3xl font-medium">
                  48{" "}
                  <span className="text-muted-foreground text-sm">
                    Chili Trees
                  </span>
                </p>
              </Card>

              <Card className="w-full border-none p-4 shadow-none">
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-full p-3">
                    <Leaf className="size-5 text-green-700" />
                  </div>
                  <p className="font-medium">Total Harvest</p>
                </div>
                <p className="text-3xl font-medium">
                  120{" "}
                  <span className="text-muted-foreground text-sm">Fruits</span>
                </p>
              </Card>
            </div>

            {/* Bar Chart */}
            <HarvestSummaryChart />

            {/* Radial Chart */}
            <RadialChart />
          </div>
        </div>
        <div className="min-h-screen w-px bg-slate-300"></div>
        {/* Right Side */}
        <div className="flex-2 space-y-3">
          <PlanterBedCard
            label="Planter Bed 01"
            streamUrl="http://100.127.114.61:8000/camera/stream"
            status="idle"
            lastScan="12 Hour ago"
            soilMoisture={68}
            lastHarvest={{ count: 24, date: "Apr 7, 2026" }}
            scanResult={{ unripe: 120, turning: 24, ripe: 44, broken: 4 }}
            link="/plants/planter-bed-01"
          />

          <PlanterBedCard
            label="Planter Bed 02"
            streamUrl="https://localhost:8080/stream"
            status="idle"
            lastScan="11 Hour ago"
            soilMoisture={72}
            lastHarvest={{ count: 24, date: "Apr 7, 2026" }}
            scanResult={{ unripe: 140, turning: 12, ripe: 50, broken: 5 }}
            link="/plants/planter-bed-02"
          />
          <PlanterBedCard
            label="Planter Bed 03"
            streamUrl="https://localhost:8080/stream"
            status="idle"
            lastScan="10 min ago"
            soilMoisture={65}
            lastHarvest={{ count: 24, date: "Apr 7, 2026" }}
            scanResult={{ unripe: 125, turning: 33, ripe: 34, broken: 4 }}
            link="/plants/planter-bed-03"
          />
        </div>
      </div>
    </main>
  );
}
