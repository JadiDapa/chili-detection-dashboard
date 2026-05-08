"use client";

import { Download } from "lucide-react";

export default function DownlaodDataset({ datasetId }: { datasetId: number }) {
  return (
    <button
      onClick={() =>
        window.open(`/api/datasets/${datasetId}/download`, "_blank")
      }
      className="hover:text-foreground transition-colors"
    >
      <Download size={18} />
    </button>
  );
}
