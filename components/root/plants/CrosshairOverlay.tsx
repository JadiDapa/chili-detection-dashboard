import { cn } from "@/lib/utils";

/**
 * Center crosshair overlay for camera frames and capture images. Helps locate
 * the optical center of the camera. Purely decorative and non-interactive.
 *
 * Drop into any `relative` container (the parent must be positioned). Uses
 * `mix-blend-difference` so the lines stay visible over any background.
 */
export function CrosshairOverlay({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-20", className)}
      aria-hidden
    >
      {/* Vertical line */}
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/50 mix-blend-difference" />
      {/* Horizontal line */}
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/50 mix-blend-difference" />
      {/* Center marker */}
      <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/80 ring-1 ring-white/80" />
    </div>
  );
}
