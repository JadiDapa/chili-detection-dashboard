"use client";

import Image from "next/image";
import { CheckCircle2, Circle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FruitClass = "Ripe" | "Unripe" | "Turning" | "Broken";

const CLASS_BAR_COLOR: Record<FruitClass, string> = {
  Ripe: "bg-emerald-500",
  Unripe: "bg-sky-500",
  Turning: "bg-amber-500",
  Broken: "bg-red-500",
};

/** The subset of Capture fields this dialog renders. */
export interface CaptureDetail {
  plantIndex: number | null;
  imageUrl: string | null;
  annotatedImageUrl: string | null;
  totalFruits: number;
  ripeCount: number;
  unripeCount: number;
  turningCount: number;
  brokenCount: number;
  heightCm?: number | null;
  moisturePct?: number | null;
}

function LabeledImage({
  label,
  url,
  alt,
}: {
  label: string;
  url: string | null;
  alt: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
        {label}
      </span>
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-md bg-zinc-700">
        {url ? (
          <Image
            src={url}
            alt={alt}
            unoptimized
            fill
            className="object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-[10px] text-zinc-500">No image</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function CaptureDetailDialog({
  capture,
  isReady,
  children,
}: {
  capture: CaptureDetail;
  isReady: boolean;
  children: React.ReactNode;
}) {
  const plantLabel = String(capture.plantIndex ?? "?").padStart(2, "0");
  const total = capture.totalFruits;
  const classes: Record<FruitClass, number> = {
    Ripe: capture.ripeCount,
    Unripe: capture.unripeCount,
    Turning: capture.turningCount,
    Broken: capture.brokenCount,
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle>Plant #{plantLabel}</DialogTitle>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                isReady
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-zinc-500/10 text-zinc-400",
              )}
            >
              {isReady ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              {isReady ? "Ready to harvest" : "Not ready"}
            </span>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <LabeledImage
            label="YOLO"
            url={capture.annotatedImageUrl}
            alt={`Plant ${plantLabel} annotated`}
          />
          <LabeledImage
            label="Raw"
            url={capture.imageUrl}
            alt={`Plant ${plantLabel} raw`}
          />
        </div>

        <div className="bg-muted flex items-center justify-between rounded-lg px-3 py-2">
          <span className="text-sm text-zinc-500">Total Fruits</span>
          <span className="text-primary text-lg font-bold tabular-nums">
            {total}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
            Ripeness Classification
          </span>
          <div className="flex flex-col gap-1.5">
            {(Object.entries(classes) as [FruitClass, number][]).map(
              ([label, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-14 text-xs text-zinc-400">{label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-300 dark:bg-zinc-700">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          CLASS_BAR_COLOR[label],
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold text-zinc-400 tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </div>

        {(capture.heightCm != null || capture.moisturePct != null) && (
          <div className="grid grid-cols-2 gap-2 border-t pt-3">
            {capture.heightCm != null && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Height</span>
                <span className="text-xs text-zinc-400">
                  {capture.heightCm} cm
                </span>
              </div>
            )}
            {capture.moisturePct != null && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Moisture</span>
                <span className="text-xs text-zinc-400">
                  {capture.moisturePct}%
                </span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
