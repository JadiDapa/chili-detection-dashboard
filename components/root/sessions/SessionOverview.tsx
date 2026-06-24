import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SessionType } from "@/lib/types/session";
import { format, intervalToDuration } from "date-fns";
import { Clock, Leaf, AlertTriangle, CircleCheck, Droplets, Ruler, Video } from "lucide-react";

export default function SessionOverview({ session }: { session: SessionType }) {
  const captures = session?.captures ?? [];
  const isWatering = session.sessionType === "WATERING";
  const isDataset = session.sessionType === "DATA_COLLECTION";

  const readyToHarvest = captures.filter((c) => c.ripeCount > 3).length;
  const ripeTotal = captures.reduce((sum, c) => sum + c.ripeCount, 0);
  const unripeTotal = captures.reduce((sum, c) => sum + c.unripeCount, 0);
  const damagedTotal = captures.reduce((sum, c) => sum + c.brokenCount, 0);

  const runningTime =
    session?.status !== "PENDING" && session?.startedAt
      ? intervalToDuration({
          start: new Date(session.startedAt),
          end: new Date(),
        })
      : null;

  return (
    <Card className="lg:col-span-3">
      {/* Header */}
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Session Overview</CardTitle>
            <span
              className={
                isWatering
                  ? "rounded border border-sky-400 px-1.5 py-0.5 text-[10px] font-semibold text-sky-500"
                  : isDataset
                    ? "rounded border border-violet-400 px-1.5 py-0.5 text-[10px] font-semibold text-violet-500"
                    : "rounded border border-emerald-400 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500"
              }
            >
              {isWatering ? "Watering" : isDataset ? "Data Collection" : "Scan"}
            </span>
          </div>
          <Badge
            variant={
              session.status === "RUNNING"
                ? "default"
                : session.status === "COMPLETED"
                  ? "secondary"
                  : "outline"
            }
          >
            {session.status}
          </Badge>
        </div>

        <p className="text-muted-foreground text-sm">
          {isWatering
            ? "Monitoring watering progress & results"
            : isDataset
              ? "Continuous video sweep for dataset collection"
              : "Monitoring scan progress & results"}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="text-muted-foreground h-4 w-4" />
            Time
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>
              Start:
              <span className="block font-medium">
                {session.startedAt
                  ? format(new Date(session.startedAt), "HH:mm:ss")
                  : "-"}
              </span>
            </p>

            <p>
              End:
              <span className="block font-medium">
                {session.completedAt
                  ? format(new Date(session.completedAt), "HH:mm:ss")
                  : "-"}
              </span>
            </p>
          </div>

          {runningTime && (
            <p className="text-muted-foreground text-xs">
              Running for {runningTime.minutes ?? 0}m {runningTime.seconds ?? 0}
              s
            </p>
          )}
        </div>

        <Separator />

        {isDataset ? (
          /* ── DATA_COLLECTION results ── */
          <div className="space-y-3">
            <p className="text-sm font-medium">Recorded Video</p>
            {session.videoUrl ? (
              <>
                <video
                  controls
                  src={session.videoUrl}
                  className="w-full rounded-lg bg-black"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {session.videoDurationSec != null
                      ? `${session.videoDurationSec.toFixed(1)} s`
                      : ""}
                  </span>
                  <a
                    href={session.videoUrl}
                    download
                    className="inline-flex items-center gap-1.5 text-violet-500 hover:underline"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Download
                  </a>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                No video recorded for this session.
              </p>
            )}
          </div>
        ) : isWatering ? (
          /* ── WATERING results ── */
          <div className="space-y-3">
            <p className="text-sm font-medium">Watering Result</p>

            <div className="grid grid-cols-2 gap-3">
              <Stat
                icon={<Ruler className="h-4 w-4 text-yellow-500" />}
                label="Max Height"
                value={
                  session.maxHeightCm != null
                    ? `${session.maxHeightCm.toFixed(1)} cm`
                    : "—"
                }
              />
              <Stat
                icon={<Droplets className="h-4 w-4 text-sky-500" />}
                label="Valve Duration"
                value={
                  session.fuzzyDurationSec != null
                    ? `${session.fuzzyDurationSec.toFixed(1)} s`
                    : "—"
                }
              />
              <Stat
                icon={<Droplets className="h-4 w-4 text-blue-400" />}
                label="Moisture Before"
                value={
                  session.moistureBeforeAvg != null
                    ? `${session.moistureBeforeAvg.toFixed(1)}%`
                    : "—"
                }
              />
              <Stat
                icon={<Droplets className="h-4 w-4 text-emerald-500" />}
                label="Moisture After"
                value={
                  session.moistureAfterAvg != null
                    ? `${session.moistureAfterAvg.toFixed(1)}%`
                    : "—"
                }
              />
            </div>

            {/* Watering stops table */}
            {session.wateringStops && session.wateringStops.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-zinc-500">
                  Column Stops ({session.wateringStops.length})
                </p>
                <div className="overflow-hidden rounded-lg border text-xs">
                  <table className="w-full">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Col</th>
                        <th className="px-3 py-2 text-left font-medium">
                          X (mm)
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Height
                        </th>
                        <th className="px-3 py-2 text-right font-medium">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.wateringStops.map((stop) => (
                        <tr key={stop.id} className="border-t">
                          <td className="px-3 py-1.5">{stop.stopIndex}</td>
                          <td className="px-3 py-1.5">
                            {stop.xMm.toFixed(0)}
                          </td>
                          <td className="px-3 py-1.5">
                            {stop.maxHeightCm != null
                              ? `${stop.maxHeightCm.toFixed(1)} cm`
                              : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-right font-semibold">
                            {stop.valveDurationSec.toFixed(1)} s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── SCAN results ── */
          <div className="space-y-3">
            <p className="text-sm font-medium">Scanning Result</p>

            <div className="grid grid-cols-2 gap-3">
              <Stat
                icon={<CircleCheck className="h-4 w-4 text-green-600" />}
                label="Ready"
                value={String(readyToHarvest)}
              />
              <Stat
                icon={<Leaf className="h-4 w-4 text-emerald-500" />}
                label="Ripe"
                value={String(ripeTotal)}
              />
              <Stat
                icon={<Leaf className="h-4 w-4 text-yellow-500" />}
                label="Unripe"
                value={String(unripeTotal)}
              />
              <Stat
                icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                label="Damaged"
                value={String(damagedTotal)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
