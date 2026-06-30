import PageHeader from "@/components/root/PageHeader";
import { DatasetService } from "@/server/services/dataset.service";
import { CAMERA_ASPECT_CLASS } from "@/lib/camera";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Calendar, MapPin } from "lucide-react";
import CreateDatasetSessionDialog from "@/components/root/datasets/CreateDatasetSessionDialog";
import { DatasetType } from "@/server/validators/dataset.validator";
import Link from "next/link";

export default async function DatasetCollection() {
  const dataset = await DatasetService.getAll(true);

  return (
    <main className="min-h-full w-full gap-4 pt-4">
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <PageHeader
          title="Dataset Collection"
          subtitle="Kumpulkan data tanaman cabai untuk melatih model klasifikasi yang akurat."
        />
        <CreateDatasetSessionDialog />
      </div>

      {/* Filters (placeholder for now) */}
      <div className="mt-6 flex gap-3">
        <Button variant="outline">Filter Tanggal</Button>
        <Button variant="outline">Tipe Capture</Button>
      </div>

      {/* Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dataset.map((item) => (
          <DatasetCard key={item.id} dataset={item} />
        ))}
      </div>
    </main>
  );
}

function DatasetCard({ dataset }: { dataset: DatasetType }) {
  const captureCount = dataset.captures?.length || 0;

  return (
    <Link href={`/dataset/${dataset.id}`} className="block">
      {" "}
      <Card className="group gap-0 overflow-hidden rounded-2xl border p-0 shadow-none transition hover:shadow-lg">
        {/* Thumbnail */}
        <div
          className={`bg-muted relative flex ${CAMERA_ASPECT_CLASS} w-full items-center justify-center overflow-hidden`}
        >
          {captureCount > 0 && (
            /* eslint-disable @next/next/no-img-element */

            <img
              src={dataset.captures[0].imageUrl}
              alt="Capture Image"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <CardContent className="my-0 space-y-3 px-4 py-4">
          {/* Title */}
          <div>
            <h3 className="text-lg leading-tight font-semibold">
              {dataset.title}
            </h3>
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {dataset.description || "Tidak ada deskripsi"}
            </p>
          </div>

          {/* Info */}
          <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
            {/* Date */}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(dataset.startedAt)} -{" "}
              {dataset.endedAt ? formatDate(dataset.endedAt) : "Sekarang"}
            </div>

            {/* Location */}
            {dataset.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {dataset.location}
              </div>
            )}
          </div>

          {/* Bottom */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Badge variant="secondary">
                {dataset.captureType === "IMAGE_CAPTURE" ? "Image" : "Video"}
              </Badge>

              <Badge variant="outline">{captureCount} items</Badge>
            </div>

            <Button size="sm" variant="ghost">
              Open
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/* ================= Helpers ================= */

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}
