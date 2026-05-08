import { prisma } from "@/lib/prisma";
import archiver from "archiver";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const datasetId = Number(id);

  if (isNaN(datasetId)) {
    return new Response("Invalid dataset id", { status: 400 });
  }

  const captures = await prisma.datasetCaptures.findMany({
    where: { datasetSession: datasetId },
  });

  console.log("CAPTURES:", captures.length);

  const archive = archiver("zip", { zlib: { level: 9 } });

  const stream = new ReadableStream({
    start(controller) {
      archive.on("data", (chunk) => controller.enqueue(chunk));
      archive.on("end", () => controller.close());
      archive.on("error", (err) => controller.error(err));

      let validFiles = 0;

      for (const cap of captures) {
        const filename = cap.imageUrl.split("/").pop();
        if (!filename) continue;

        const filePath = path.join(process.cwd(), "uploads", filename);

        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: filename });
          validFiles++;
        }
      }

      if (validFiles === 0) {
        controller.error("No valid files found");
        return;
      }

      archive.finalize();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="dataset-${datasetId}.zip"`,
    },
  });
}
