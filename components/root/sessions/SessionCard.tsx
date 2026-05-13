"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Leaf, AlertTriangle, CircleCheck } from "lucide-react";
import { SessionType } from "@/lib/types/session";
import { format } from "date-fns";
import Link from "next/link";

export default function SessionCard({ session }: { session: SessionType }) {
  const captures = session.captures ?? [];

  // ---- Aggregations ----
  const readyToHarvest = captures.filter((c) => c.ripeCount > 3).length;
  const ripeTotal = captures.reduce((s, c) => s + c.ripeCount, 0);
  const unripeTotal = captures.reduce((s, c) => s + c.unripeCount, 0);
  const damagedTotal = captures.reduce((s, c) => s + c.brokenCount, 0);

  const avatarLetter = (session.title ?? "?").charAt(0).toUpperCase();

  // ---- Status UI mapping ----
  const statusVariant =
    session.status === "RUNNING" || session.status === "CAPTURING"
      ? "default"
      : session.status === "COMPLETED"
        ? "secondary"
        : "outline";

  return (
    <Link href={`/sessions/${session.id}`} className="block">
      <Card className="rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
        <CardContent className="space-y-4 p-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black font-bold text-white">
                {avatarLetter}
              </div>

              <div>
                <p className="text-sm font-semibold">{session.title}</p>
                <p className="text-muted-foreground text-xs">
                  {format(session.createdAt, "d MMM yyyy")}
                </p>
              </div>
            </div>

            <Badge variant={statusVariant} className="capitalize">
              {session.status?.toLowerCase()}
            </Badge>
          </div>

          {/* Notes */}
          {session.notes && (
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {session.notes}
            </p>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <MiniStat
              icon={<CircleCheck className="h-3 w-3 text-green-600" />}
              value={readyToHarvest}
              label="Ready"
            />
            <MiniStat
              icon={<Leaf className="h-3 w-3 text-emerald-500" />}
              value={ripeTotal}
              label="Ripe"
            />
            <MiniStat
              icon={<Leaf className="h-3 w-3 text-yellow-500" />}
              value={unripeTotal}
              label="Unripe"
            />
            <MiniStat
              icon={<AlertTriangle className="h-3 w-3 text-red-500" />}
              value={damagedTotal}
              label="Damaged"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-muted-foreground text-xs">
              {session.startedAt
                ? format(session.startedAt, "HH:mm")
                : "Not started"}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button size="sm">See Session</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/* Small stat for card */
function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border p-2">
      <div className="text-muted-foreground flex items-center gap-1">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
