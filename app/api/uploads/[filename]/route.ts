import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import mime from "mime-types";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) => {
  const { filename } = await params;

  const filePath = path.join(process.cwd(), "uploads", filename);

  try {
    const file = await fs.readFile(filePath);

    const contentType = mime.lookup(filename) || "application/octet-stream";

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline", // or "attachment"
        // Capture files are immutable once written — cache aggressively.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
};
