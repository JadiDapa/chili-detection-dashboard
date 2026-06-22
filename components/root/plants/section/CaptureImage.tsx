"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CrosshairOverlay } from "../CrosshairOverlay";

/**
 * Plant capture thumbnail with a raw ↔ annotated toggle on its edge.
 *
 * Defaults to the YOLO-annotated frame (boxes drawn) when available, with a
 * small pill control to flip back to the raw capture. When there is no annotated
 * image (stub-mode scans or older sessions) it silently shows the raw image and
 * hides the toggle.
 */
export function CaptureImage({
  plantId,
  rawUrl,
  annotatedUrl,
}: {
  plantId: number | string;
  rawUrl: string | null;
  annotatedUrl: string | null;
}) {
  const hasAnnotated = !!annotatedUrl;
  const hasRaw = !!rawUrl;
  const canToggle = hasAnnotated && hasRaw;
  // Default to annotated when it exists.
  const [showAnnotated, setShowAnnotated] = useState(hasAnnotated);

  const activeUrl = showAnnotated && hasAnnotated ? annotatedUrl : rawUrl;

  return (
    <div className="relative h-44 w-56 shrink-0 overflow-hidden rounded-s-md bg-zinc-700">
      <div className="absolute top-1 left-1 z-10 rounded-full bg-black/50 px-2 py-0.5">
        <p className="text-[10px] font-medium text-white">
          Plant #{String(plantId).padStart(2, "0")}
        </p>
      </div>

      {activeUrl ? (
        <>
          <Image
            src={activeUrl}
            alt={`Plant ${plantId} ${showAnnotated && hasAnnotated ? "annotated" : "raw"}`}
            unoptimized
            className="object-cover object-center"
            fill
          />
          <CrosshairOverlay />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-[10px] text-zinc-500">No image</span>
        </div>
      )}

      {canToggle && (
        <div className="absolute right-1 bottom-1 z-10 flex overflow-hidden rounded-full bg-black/60 text-[9px] font-semibold backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setShowAnnotated(true)}
            className={cn(
              "px-2 py-0.5 transition-colors",
              showAnnotated
                ? "bg-emerald-500 text-white"
                : "text-zinc-300 hover:text-white",
            )}
          >
            YOLO
          </button>
          <button
            type="button"
            onClick={() => setShowAnnotated(false)}
            className={cn(
              "px-2 py-0.5 transition-colors",
              !showAnnotated
                ? "bg-white text-black"
                : "text-zinc-300 hover:text-white",
            )}
          >
            Raw
          </button>
        </div>
      )}
    </div>
  );
}
