import { cn } from "@/lib/utils";

export function CrosshairOverlay({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-20", className)}
      aria-hidden
    >
      {/* Top */}
      <div className="absolute top-1/2 left-1/2 h-6 w-px -translate-x-1/2 -translate-y-3.5 bg-white mix-blend-difference" />

      {/* Bottom */}
      <div className="absolute top-1/2 left-1/2 h-6 w-px -translate-x-1/2 translate-y-2 bg-white mix-blend-difference" />

      {/* Left */}
      <div className="absolute top-1/2 left-1/2 h-px w-6 -translate-x-3.5 -translate-y-1/2 bg-white mix-blend-difference" />

      {/* Right */}
      <div className="absolute top-1/2 left-1/2 h-px w-6 translate-x-2 -translate-y-1/2 bg-white mix-blend-difference" />

      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 ring-1 ring-white/80" />
    </div>
  );
}
