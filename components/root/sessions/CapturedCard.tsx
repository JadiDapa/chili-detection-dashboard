import { CaptureType } from "@/lib/types/capture";
import { CAMERA_ASPECT_CLASS } from "@/lib/camera";
import Image from "next/image";

export default function CapturedCard({
  capture,
  index,
}: {
  capture: CaptureType;
  index: number;
}) {
  return (
    <div className="group bg-card rounded-xl border transition hover:shadow-md">
      {/* IMAGE */}
      <div
        className={`relative ${CAMERA_ASPECT_CLASS} overflow-hidden rounded-t-xl`}
      >
        <Image
          unoptimized
          src={capture.imageUrl}
          alt={capture.title ?? ""}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* OVERLAY BADGE */}
        <div className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur">
          {index}
        </div>
      </div>

      {/* CONTENT */}
      <div className="space-y-2 p-3">
        {/* TITLE */}
        <p className="truncate text-sm leading-tight font-semibold">
          {capture.title}
        </p>

        {/* STATS */}
        <div className="flex flex-wrap gap-1 text-xs">
          <StatBadge label="Total" value={capture.totalFruits} />
          <StatBadge label="Ripe" value={capture.ripeCount} color="green" />
          <StatBadge label="Unripe" value={capture.unripeCount} color="yellow" />
          <StatBadge label="Broken" value={capture.brokenCount} color="red" />
        </div>
      </div>
    </div>
  );
}

function StatBadge({
  label,
  value,
  color = "gray",
}: {
  label: string;
  value: number;
  color?: "gray" | "green" | "yellow" | "red";
}) {
  const colors = {
    gray: "bg-muted text-muted-foreground",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <div className={`rounded-md px-2 py-0.5 font-medium ${colors[color]}`}>
      {label}: {value}
    </div>
  );
}
