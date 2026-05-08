import { RequestType, MediaType, Prisma } from "@/generated/prisma/client";
import path from "path";
import { prisma } from "@/lib/prisma";
import { BASE_DIR, saveFile } from "@/lib/upload";
import fs from "fs/promises";

export type MediaListOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  orderBy?: Prisma.MediaOrderByWithRelationInput;
};

export const MediaService = {
  async upload({
    entityId,
    file,
    requestType,
    mediaType,
    description,
    uploadedById,
  }: {
    entityId: string;
    file: File;
    requestType: RequestType;
    mediaType: MediaType;
    description?: string;
    uploadedById?: string;
  }) {
    const dir = path.join(BASE_DIR, requestType.toLowerCase());

    const saved = await saveFile({
      baseDir: dir,
      file,
    });

    return prisma.media.create({
      data: {
        entityId,
        url: `/media/${requestType.toLowerCase()}/${saved.filename}`,
        filename: saved.filename,
        mimeType: saved.mimeType,
        size: saved.size,
        requestType,
        mediaType,
        description,
        uploadedById,
      },
    });
  },

  async uploadMany({
    entityId,
    files,
    requestType,
    mediaType,
    description,
    uploadedById,
  }: {
    entityId: string;
    files: File[];
    requestType: RequestType;
    mediaType: MediaType;
    description?: string;
    uploadedById?: string;
  }) {
    const dir = path.join(BASE_DIR, requestType.toLowerCase());

    const results = [];

    for (const file of files) {
      const saved = await saveFile({
        baseDir: dir,
        file,
      });

      const media = await prisma.media.create({
        data: {
          entityId,
          url: `/media/${requestType.toLowerCase()}/${saved.filename}`,
          filename: saved.filename,
          mimeType: saved.mimeType,
          size: saved.size,
          requestType,
          mediaType,
          description,
          uploadedById,
        },
      });

      results.push(media);
    }

    return results;
  },

  async delete(mediaId: string) {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error("Media not found");
    }

    const filePath = path.join(
      BASE_DIR,
      media.requestType.toLowerCase(),
      media.filename || "",
    );

    await prisma.media.delete({
      where: { id: mediaId },
    });

    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      if (err instanceof Error && "code" in err && err.code === "ENOENT") {
        throw err;
      }
      throw err;
    }
  },
};

// async upload({
//   entityId,
//   file,
//   RequestType,
//   mediaType,
//   description,
// }: {
//   entityId: string;
//   file: File;
//   RequestType: RequestType;
//   mediaType: MediaType;
//   description?: string;
// }) {
//   const folder = RequestType.toLowerCase();
//   const ext = safeExt(file.name);
//   const filename = `${crypto.randomUUID()}${ext}`;
//   const key = `${folder}/${filename}`;

//   const body = Buffer.from(await file.arrayBuffer());

//   const contentType = file.type || "application/octet-stream";

//   await putObjectToR2({
//     bucket: process.env.R2_BUCKET!,
//     key,
//     body,
//     contentType,
//     cacheControl: "public, max-age=31536000, immutable",
//   });

//   const url = joinUrl(process.env.R2_PUBLIC_BASE_URL!, key);

//   return prisma.media.create({
//     data: {
//       entityId,
//       url,
//       filename,
//       mimeType: file.type || null,
//       size: file.size,
//       RequestType,
//       mediaType,
//       description,
//     },
//   });
// },
