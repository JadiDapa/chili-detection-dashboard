import { CaptureButton } from "@/components/root/datasets/CaptureButton";
import CaptureCard from "@/components/root/datasets/CapturedData";
import DownlaodDataset from "@/components/root/datasets/DownlaodDataset";
import PageHeader from "@/components/root/PageHeader";
import { PlantsCam } from "@/components/root/plants/PlantsCam";
import { DatasetService } from "@/server/services/dataset.service";
import { AlignJustify } from "lucide-react";

export default async function Dataset({ params }: { params: { id: string } }) {
  const { id } = await params;
  const dataset = await DatasetService.getById(Number(id));

  return (
    <main className="min-h-screen w-full gap-4">
      {/* Header */}

      <div className="mt-6 flex w-full gap-4">
        <div className="flex-1 space-y-6">
          <div className="flex w-full items-center justify-between">
            <PageHeader
              title={`Session: ${dataset?.title}`}
              subtitle="Detail sesi dataset dan data capture yang telah dikumpulkan."
            />
          </div>
          <div className="relative aspect-video h-80 flex-2 overflow-hidden rounded-xl">
            <PlantsCam
              label="Main Webcam"
              streamUrl="http://100.127.114.61:8000/camera/stream"
            />

            <CaptureButton datasetId={Number(id)} />
          </div>
        </div>

        <div className="bg-card text-foreground flex h-screen w-full flex-3 flex-col rounded-xl px-3">
          <div className="flex items-center justify-between px-1 pt-5 pb-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Sessions
              </h1>
              <p className="text-[11px] text-zinc-500 capitalize">
                {dataset?.location} -{" "}
                {dataset?.captureType.replace("_", " ").toLowerCase()}
              </p>
            </div>
            <div className="flex items-center gap-3 text-zinc-400">
              <DownlaodDataset datasetId={Number(id)} />
              <button className="hover:text-foreground transition-colors">
                <AlignJustify size={18} />
              </button>
            </div>
          </div>
          <div className="my-3 border-t" />

          <div className="grid grid-cols-4 gap-2">
            {dataset?.captures.length === 0 && (
              <p className="py-4 text-center text-xs text-zinc-500">
                Waiting for first scan…
              </p>
            )}
            {dataset?.captures.map((cap) => (
              <CaptureCard key={cap.id} cap={cap} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
