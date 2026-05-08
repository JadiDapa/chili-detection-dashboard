import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SessionType } from "@/lib/types/session";
import { format, intervalToDuration } from "date-fns";
import { Clock, MapPin, Leaf, AlertTriangle, CircleCheck } from "lucide-react";

export default function SessionOverview({ session }: { session: SessionType }) {
  const captures = session?.captures ?? [];

  const readyToHarvest = captures.filter((c) => c.ripe > 3).length;
  const ripeTotal = captures.reduce((sum, c) => sum + c.ripe, 0);
  const unripeTotal = captures.reduce((sum, c) => sum + c.unripe, 0);
  const damagedTotal = captures.reduce((sum, c) => sum + c.damaged, 0);

  const runningTime =
    session?.status !== "PENDING" && session?.startTime
      ? intervalToDuration({
          start: new Date(session.startTime),
          end: new Date(),
        })
      : null;

  return (
    <Card className="col-span-5 lg:col-span-3">
      {/* Header */}
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle>Session Overview</CardTitle>
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
          Monitoring scan progress & results
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
                {session.startTime
                  ? format(new Date(session.startTime), "HH:mm:ss")
                  : "-"}
              </span>
            </p>

            <p>
              End:
              <span className="block font-medium">
                {session.endTime
                  ? format(new Date(session.endTime), "HH:mm:ss")
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

        {/* Position */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="text-muted-foreground h-4 w-4" />
            Position
          </div>

          <div className="flex gap-6 text-sm">
            <p>
              Row
              <span className="text-primary block text-lg font-semibold">
                {session?.row}
              </span>
            </p>
            <p>
              Column
              <span className="block text-lg font-semibold">
                {session?.column}
              </span>
            </p>
          </div>
        </div>

        <Separator />

        {/* Scan Results */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Scanning Result</p>

          <div className="grid grid-cols-2 gap-3">
            <Stat
              icon={<CircleCheck className="h-4 w-4 text-green-600" />}
              label="Ready"
              value={readyToHarvest}
            />
            <Stat
              icon={<Leaf className="h-4 w-4 text-emerald-500" />}
              label="Ripe"
              value={ripeTotal}
            />
            <Stat
              icon={<Leaf className="h-4 w-4 text-yellow-500" />}
              label="Unripe"
              value={unripeTotal}
            />
            <Stat
              icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
              label="Damaged"
              value={damagedTotal}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* Small stat card */
function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
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
