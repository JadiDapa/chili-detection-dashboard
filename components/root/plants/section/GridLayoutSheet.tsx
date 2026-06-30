"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Grid3x3 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { getBedAction, updateBedGridAction } from "@/app/actions/bed.actions";

type GridForm = {
  rows: string;
  cols: string;
  gapXMm: string;
  gapYMm: string;
  startXMm: string;
  startYMm: string;
};

const EMPTY: GridForm = {
  rows: "2",
  cols: "8",
  gapXMm: "750",
  gapYMm: "1000",
  startXMm: "0",
  startYMm: "0",
};

// Bed grid layout editor. Grid (rows/cols/gaps/first-plant) is the single source
// of truth for every session type — it lives on the Bed, not per-session config.
// Saving regenerates this bed's plant positions, so it shows a heads-up.
export default function GridLayoutSheet({
  bedId = 1,
  // When rendered inside the (clickable) bed card, stop the click from following
  // the card's link.
  stopPropagation = false,
}: {
  bedId?: number;
  stopPropagation?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<GridForm>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    getBedAction(bedId)
      .then((bed) => {
        if (!bed) return;
        setForm({
          rows: String(bed.rows),
          cols: String(bed.cols),
          gapXMm: String(bed.gapXMm),
          gapYMm: String(bed.gapYMm),
          startXMm: String(bed.startXMm),
          startYMm: String(bed.startYMm),
        });
      })
      .catch(() => setError("Failed to load grid"))
      .finally(() => setLoading(false));
  }, [open, bedId]);

  function setField<K extends keyof GridForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateBedGridAction(bedId, {
        rows: Math.max(1, parseInt(form.rows) || 1),
        cols: Math.max(1, parseInt(form.cols) || 1),
        gapXMm: parseFloat(form.gapXMm) || 0,
        gapYMm: parseFloat(form.gapYMm) || 0,
        startXMm: parseFloat(form.startXMm) || 0,
        startYMm: parseFloat(form.startYMm) || 0,
      });
      router.refresh();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save grid");
    } finally {
      setSaving(false);
    }
  }

  const rowsN = Math.max(1, parseInt(form.rows) || 1);
  const colsN = Math.max(1, parseInt(form.cols) || 1);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          title="Grid layout"
          onClick={(e) => {
            if (stopPropagation) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Grid Layout</SheetTitle>
          <SheetDescription>
            Plant grid for this bed — shared by every session type. Saving
            regenerates plant positions (row/col and X/Y in mm).
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Columns"
                  value={form.cols}
                  onChange={(v) => setField("cols", v)}
                />
                <Field
                  label="Rows"
                  value={form.rows}
                  onChange={(v) => setField("rows", v)}
                />
                <Field
                  label="Gap X (mm)"
                  value={form.gapXMm}
                  onChange={(v) => setField("gapXMm", v)}
                />
                <Field
                  label="Gap Y (mm)"
                  value={form.gapYMm}
                  onChange={(v) => setField("gapYMm", v)}
                />
                <Field
                  label="First plant X (mm)"
                  value={form.startXMm}
                  onChange={(v) => setField("startXMm", v)}
                />
                <Field
                  label="First plant Y (mm)"
                  value={form.startYMm}
                  onChange={(v) => setField("startYMm", v)}
                />
              </div>

              <div className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] text-zinc-500">
                <Grid3x3 className="h-3.5 w-3.5 shrink-0" />
                {rowsN}×{colsN} = {rowsN * colsN} plants. Position of plant{" "}
                <span className="font-mono">(r,c)</span> = first plant + (c·gapX,
                r·gapY).
              </div>

              {error && (
                <p className="rounded-md bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        <SheetFooter>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? <Spinner className="h-3.5 w-3.5" /> : "Save & Regenerate"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
}
