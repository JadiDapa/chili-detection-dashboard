import { Droplets, Sparkles } from "lucide-react";
import { PlantsCam } from "@/components/root/plants/PlantsCam";
import { CAMERA_ASPECT_CLASS } from "@/lib/camera";
import { StatusBadge } from "@/components/root/plants/StatusBadge";
import Link from "next/link";

type ScanResult = {
  unripe: number;
  turning: number;
  ripe: number;
  broken: number;
};

type Props = {
  label: string;
  streamUrl: string;
  status: "idle" | "scanning" | "error" | "offline";
  lastScan: string;
  soilMoisture: number;
  lastHarvest: { count: number; date: string };
  scanResult: ScanResult;
  link: string;
};

const scanItems = [
  { key: "unripe", label: "Unripe", color: "bg-green-500" },
  { key: "turning", label: "Turning", color: "bg-amber-400" },
  { key: "ripe", label: "Ripe", color: "bg-red-500" },
  { key: "broken", label: "Broken", color: "bg-muted-foreground/30" },
] as const;

export function PlanterBedCard({
  label,
  streamUrl,
  status,
  lastScan,
  soilMoisture,
  lastHarvest,
  scanResult,
  link,
}: Props) {
  const moistureLabel =
    soilMoisture >= 60 ? "Good" : soilMoisture >= 40 ? "Low" : "Critical";
  const moistureColor =
    soilMoisture >= 60
      ? "text-green-600"
      : soilMoisture >= 40
        ? "text-amber-600"
        : "text-red-600";

  const total =
    scanResult.unripe +
    scanResult.turning +
    scanResult.ripe +
    scanResult.broken;

  return (
    <Link
      href={link}
      className="bg-card flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-none shadow-none transition hover:-translate-y-1 hover:scale-[100.5%] hover:brightness-90 sm:flex-row"
    >
      {/* Camera */}
      <div className={`relative ${CAMERA_ASPECT_CLASS} bg-zinc-900 sm:flex-3`}>
        <PlantsCam label={label} streamUrl={streamUrl} />
      </div>

      {/* Info panel */}
      <div className="flex min-w-0 flex-col gap-3 p-4 sm:flex-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">{label}</h2>
            <p className="text-muted-foreground text-[11px]">
              Last scan {lastScan}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="border-t" />

        {/* Soil + harvest */}
        <div className="flex gap-2">
          <div className="bg-muted flex flex-1 flex-col gap-4 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-6 items-center justify-center rounded-lg bg-green-100">
                <Droplets className="size-3.5 text-green-700" />
              </div>
              <p className="">Soil moisture</p>
            </div>

            <div className="flex items-baseline gap-2">
              <p className="text-xl font-medium">{soilMoisture}%</p> -
              <p className={`text-xs ${moistureColor}`}>{moistureLabel}</p>
            </div>
          </div>

          <div className="bg-muted flex flex-1 flex-col gap-4 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-6 items-center justify-center rounded-lg bg-yellow-100">
                <Sparkles className="size-3.5 text-yellow-700" />
              </div>
              <p className="">Last Harvest</p>
            </div>

            <div className="flex items-baseline gap-2">
              <p className="text-xl font-medium">{lastHarvest.count}</p>
              <p className={`text-xs ${moistureColor}`}>Fruit</p>
            </div>
          </div>
        </div>

        <div className="border-t" />

        {/* Scan results */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-muted-foreground text-[11px] font-medium">
              Last scan results
            </p>
            <p className="text-muted-foreground text-[10px]">{total} total</p>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {scanItems.map(({ key, label, color }) => (
              <div
                key={key}
                className="bg-muted flex gap-2.5 rounded-[10px] px-3 py-2"
              >
                <span
                  className={`mt-1 size-2 rounded-full ${color} shrink-0`}
                />
                <div>
                  <p className="text-muted-foreground text-[10px]">{label}</p>
                  <p className="text-sm font-medium">{scanResult[key]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
