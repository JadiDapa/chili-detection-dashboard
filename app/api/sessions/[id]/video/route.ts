import { NextResponse } from "next/server";
import { fileUpload } from "@/lib/file-upload";
import { SessionService } from "@/server/services/session.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const filename = await fileUpload(file, "uploads");
  // Store a RELATIVE URL so the video always resolves against whatever origin
  // served the dashboard (localhost, ngrok, Tailscale, …). Same rationale as the
  // captures image route.
  const videoUrl = `/api/uploads/${filename}`;
  // Persist it onto the Session immediately, independent of final status. The RPi
  // uploads on EVERY terminal path (complete/stopped/error), so attaching here
  // means a session keeps its footage even when it ended early — no re-record.
  await SessionService.attachVideo(Number(id), videoUrl);
  return NextResponse.json({ ok: true, videoUrl });
}
