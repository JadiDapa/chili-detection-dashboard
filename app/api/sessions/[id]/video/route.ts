import { NextResponse } from "next/server";
import { fileUpload } from "@/lib/file-upload";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const filename = await fileUpload(file, "uploads");
  // Store a RELATIVE URL so the video always resolves against whatever origin
  // served the dashboard (localhost, ngrok, Tailscale, …). Same rationale as the
  // captures image route. The RPi forwards this value into the session summary,
  // which is persisted on the Session row and shown in the live/detail views.
  const videoUrl = `/api/uploads/${filename}`;
  return NextResponse.json({ ok: true, videoUrl });
}
