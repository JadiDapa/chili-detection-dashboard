import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fileUpload } from "@/lib/file-upload";
import { CaptureStatus } from "@/generated/prisma";

export async function GET() {
  try {
    const result = await prisma.captures.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong!", error },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const title = formData.get("title") as string | null;
    const imageUrl = formData.get("file") as File | null;
    const detected = formData.get("detected") as string | null;
    const ripe = formData.get("ripe") as string | null;
    const unripe = formData.get("unripe") as string | null;
    const damaged = formData.get("damaged") as string | null;
    const sessionId = formData.get("sessionId") as string | null;
    const row = formData.get("row") as string | null;
    const col = formData.get("col") as string | null;
    const status = formData.get("status") as CaptureStatus;

    if (!imageUrl) {
      return NextResponse.json({ error: "No file received" }, { status: 400 });
    }

    let filePath: string | null = null;

    if (imageUrl && imageUrl.name) {
      const filename = await fileUpload(imageUrl, "uploads");
      filePath = `${process.env.NEXT_PUBLIC_BASE_URL}/api/uploads/${filename}`;
    }

    const result = await prisma.$transaction(async (tx) => {
      const capture = await tx.captures.create({
        data: {
          title: title || "Untitled",
          imageUrl: filePath || "",
          detected: detected ? parseInt(detected) : 0,
          ripe: ripe ? parseInt(ripe) : 0,
          unripe: unripe ? parseInt(unripe) : 0,
          damaged: damaged ? parseInt(damaged) : 0,
          sessionId: Number(sessionId) || 0,
        },
      });

      await tx.session.update({
        where: { id: Number(sessionId) || 0 },
        data: {
          row: Number(row),
          column: Number(col),
          status: status,
        },
      });

      return capture;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error: ", error);
    return NextResponse.json(
      { message: "Something went wrong!", error: (error as Error).message },
      { status: 500 },
    );
  }
}
