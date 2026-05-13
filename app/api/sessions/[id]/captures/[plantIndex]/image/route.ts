import { NextResponse } from "next/server";
import { fileUpload } from "@/lib/file-upload";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; plantIndex: string }> },
) {
  await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const filename = await fileUpload(file, "uploads");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const imageUrl = `${baseUrl}/api/uploads/${filename}`;
  return NextResponse.json({ ok: true, imageUrl });
}
