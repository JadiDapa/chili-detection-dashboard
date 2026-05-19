"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface ScanConfigSummary {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  cols: number;
  rows: number;
  gapXMm: number;
  gapYMm: number;
  paddingXMm: number;
  paddingYMm: number;
}

interface StartSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (configId: number | null) => void;
  isPending: boolean;
}

export default function StartSessionDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: StartSessionDialogProps) {
  const [configs, setConfigs] = useState<ScanConfigSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/scan-configs")
      .then((r) => r.json())
      .then((data: ScanConfigSummary[]) => {
        setConfigs(data);
        const def = data.find((c) => c.isDefault) ?? data[0] ?? null;
        setSelectedId(def?.id ?? null);
      })
      .catch(() => setConfigs([]))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Choose Scan Configuration</DialogTitle>
          <p className="text-muted-foreground -mt-1 text-sm">
            Select a preset to use for this session
          </p>
        </DialogHeader>

        <div className="mt-2 space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Spinner />
            </div>
          )}

          {!loading && configs.length === 0 && (
            <p className="py-4 text-center text-sm text-zinc-500">
              No configurations found — the session will use built-in defaults.
            </p>
          )}

          {!loading &&
            configs.map((config) => (
              <button
                key={config.id}
                onClick={() => setSelectedId(config.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  selectedId === config.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted",
                )}
              >
                {/* Radio dot */}
                <div className="mt-0.5 shrink-0">
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border-2",
                      selectedId === config.id
                        ? "border-primary bg-primary"
                        : "border-zinc-400",
                    )}
                  >
                    {selectedId === config.id && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                {/* Config details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{config.name}</span>
                    {config.isDefault && (
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500">
                        Default
                      </span>
                    )}
                  </div>
                  {config.description && (
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                      {config.description}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-zinc-400">
                    {config.rows}×{config.cols} grid &middot;{" "}
                    {config.gapXMm / 10} cm × {config.gapYMm / 10} cm spacing
                  </p>
                </div>
              </button>
            ))}
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={() => onConfirm(selectedId)} disabled={isPending}>
            {isPending ? <Spinner /> : "Start Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
