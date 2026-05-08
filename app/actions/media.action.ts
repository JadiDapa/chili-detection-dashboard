"use server";

import { RequestType, MediaType } from "@/generated/prisma";
import { MediaService } from "@/server/services/media.service";
import { revalidatePath } from "next/cache";

export async function uploadMedia({
  entityId,
  file,
  requestType,
  mediaType,
  description,
  revalidate,
  uploadedById,
}: {
  entityId: string;
  file: File;
  requestType: RequestType;
  mediaType: MediaType;
  description?: string;
  revalidate?: string;
  uploadedById?: string;
}) {
  if (!file) throw new Error("No file provided");

  const media = await MediaService.upload({
    entityId,
    file,
    requestType,
    mediaType,
    description,
    uploadedById,
  });

  if (revalidate) {
    revalidatePath(revalidate);
  }

  return media;
}

export async function uploadManyMedia({
  entityId,
  files,
  requestType,
  mediaType,
  description,
  revalidate,
  uploadedById,
}: {
  entityId: string;
  files: File[];
  requestType: RequestType;
  mediaType: MediaType;
  description?: string;
  revalidate?: string;
  uploadedById?: string;
}) {
  if (!files || files.length === 0) {
    throw new Error("No files provided");
  }

  const results = [];

  for (const file of files) {
    const media = await MediaService.upload({
      entityId,
      file,
      requestType,
      mediaType,
      description,
      uploadedById,
    });

    results.push(media);
  }

  if (revalidate) {
    revalidatePath(revalidate);
  }

  return results;
}

export async function deleteMedia({
  mediaId,
  revalidate,
}: {
  mediaId: string;
  revalidate?: string;
}) {
  await MediaService.delete(mediaId);

  if (revalidate) {
    revalidatePath(revalidate);
  }

  return true;
}
