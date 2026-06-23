import { cn } from "@/lib/utils";

/**
 * Centered region-of-interest box drawn over the live feed. Sized as a
 * percentage of the frame so it lines up pixel-for-pixel with the ROI the
 * Raspberry Pi uses to filter YOLO detections (both are percentage-based).
 * Anything outside this box is ignored when counting fruit. A full-frame ROI
 * (>= 100 on both axes) renders nothing.
 */
export function RoiOverlay({
  wPct,
  hPct,
  className,
}: {
  wPct: number;
  hPct: number;
  className?: string;
}) {
  if (wPct >= 100 && hPct >= 100) return null;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-20", className)}
      aria-hidden
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-dashed border-amber-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
        style={{ width: `${wPct}%`, height: `${hPct}%` }}
      >
        <span className="absolute -top-5 left-0 rounded bg-amber-400/90 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-black uppercase">
          ROI {Math.round(wPct)}×{Math.round(hPct)}%
        </span>
      </div>
    </div>
  );
}
