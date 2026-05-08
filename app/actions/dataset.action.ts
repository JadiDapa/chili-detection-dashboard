"use server";

import z from "zod";
import { CreateDatasetSchema } from "@/server/validators/dataset.validator";
import { DatasetService } from "@/server/services/dataset.service";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export async function createDataset(
  dataset: z.input<typeof CreateDatasetSchema>,
) {
  const data = CreateDatasetSchema.parse(dataset);

  const created = await DatasetService.create(data);
  return created;
}

export async function captureImage(datasetId: number) {
  const res = await fetch("http://100.127.114.61:8000/camera/snapshot", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to capture image");
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 📁 Store outside public
  const uploadDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadDir, { recursive: true });

  const filename = `capture_${Date.now()}.jpg`;
  const filePath = path.join(uploadDir, filename);

  await writeFile(filePath, buffer);

  // 🔗 API route URL
  const imageUrl = `/api/uploads/${filename}`;

  // 💾 Save to DB
  const created = await prisma.datasetCaptures.create({
    data: {
      timestamp: new Date(),
      imageUrl: imageUrl,
      datasetSession: datasetId,
      title: `Capture ${new Date().toLocaleString()}`,
    },
  });

  return created;
}

export async function deleteCapture(captureId: number) {
  // 1. Get capture data
  const capture = await prisma.datasetCaptures.findUnique({
    where: { id: captureId },
  });

  if (!capture) {
    throw new Error("Capture not found");
  }

  // 2. Extract filename from URL
  const filename = capture.imageUrl.split("/").pop();

  if (filename) {
    const filePath = path.join(process.cwd(), "uploads", filename);

    try {
      await unlink(filePath); // delete file
    } catch {
      console.warn("File not found, skipping delete");
    }
  }

  // 3. Delete DB record
  await prisma.datasetCaptures.delete({
    where: { id: captureId },
  });

  return { success: true };
}
