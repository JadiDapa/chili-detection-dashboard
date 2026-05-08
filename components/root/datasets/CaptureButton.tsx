"use client";

import { useTransition } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { captureImage } from "@/app/actions/dataset.action";
import { useRouter } from "next/navigation";

export function CaptureButton({ datasetId }: { datasetId: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCapture = () => {
    startTransition(async () => {
      try {
        await captureImage(datasetId);
        toast.success("Capture berhasil disimpan!");
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error("Gagal capture gambar");
      }
    });
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
      <Button
        onClick={handleCapture}
        disabled={isPending}
        className="h-16 w-16 rounded-full shadow-lg"
      >
        {isPending ? (
          <span className="text-xs">...</span>
        ) : (
          <Camera className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
