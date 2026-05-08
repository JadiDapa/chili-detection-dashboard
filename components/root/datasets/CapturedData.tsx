"use client";

import { DatasetCaptures } from "@/generated/prisma";
import { format } from "date-fns";
import { Download, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCapture } from "@/app/actions/dataset.action";

export default function CaptureCard({ cap }: { cap: DatasetCaptures }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    const confirmed = confirm("Are you sure you want to delete?");
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deleteCapture(cap.id);
        toast.success("Capture deleted");
        router.refresh();
      } catch {
        toast.error("Failed to delete");
      }
    });
  };

  console.log(cap);

  return (
    <div className="group bg-muted relative flex w-full overflow-hidden rounded-lg">
      {/* Image */}
      <div className="relative w-full overflow-hidden bg-zinc-700">
        {/* eslint-disable @next/next/no-img-element */}
        <img
          src={cap.imageUrl}
          alt="Capture Image"
          className="h-full w-full object-cover"
        />
        {/* Time */}
        <div className="absolute top-1 left-1 rounded-full bg-black/50 px-2 py-0.5">
          <p className="text-[10px] font-medium text-white">
            {format(new Date(cap.timestamp), "HH:mm:ss")}
          </p>
        </div>
        {/* Overlay Actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition group-hover:opacity-100">
          {/* Download */}
          <a
            href={cap.imageUrl}
            download
            className="rounded-full bg-white p-2 transition hover:scale-105"
          >
            <Download className="h-4 w-4 text-black" />
          </a>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-full bg-red-500 p-2 transition hover:scale-105"
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
