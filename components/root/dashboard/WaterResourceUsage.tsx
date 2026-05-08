import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Maximize2, RefreshCw } from "lucide-react";

export default function WaterResourceUsage() {
  const progress = 70;
  const segments = 100;
  const activeSegments = Math.round((progress / 100) * segments);

  const stats = [
    { label: "Water Usage", value: "74%" },
    { label: "Labor Utilization", value: "22%" },
    { label: "Equipment Idle", value: "4%" },
  ];

  return (
    <Card className="border-none p-3 shadow-none">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-semibold">Water Resource Usage</p>
          <p className="text-muted-foreground text-[10px]">
            Last updated 14 min ago
          </p>
        </div>
        <div className="flex gap-1.5">
          <button className="hover:bg-muted rounded-lg p-1.5 transition-colors">
            <Maximize2 className="text-muted-foreground size-3.5" />
          </button>
          <button className="hover:bg-muted rounded-lg p-1.5 transition-colors">
            <RefreshCw className="text-muted-foreground size-3.5" />
          </button>
        </div>
      </div>
      <div className="bg-muted rounded-lg px-4 py-6">
        <div className="mb-3 grid grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-semibold">{stat.value}</p>
              <p className="text-muted-foreground text-[10px]">{stat.label}</p>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <div className="text-muted-foreground mb-1 flex justify-between text-sm">
          <span>Inefficient</span>
          <span>Optimized</span>
        </div>
        {/* Segmented progress */}
        <div className="flex h-10 gap-0.5 rounded-full p-0.5">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm ${i < activeSegments ? "bg-green-700" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
