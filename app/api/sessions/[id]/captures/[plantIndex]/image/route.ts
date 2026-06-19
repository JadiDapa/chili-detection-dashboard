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
  // Store a RELATIVE URL so the image always resolves against whatever origin
  // served the dashboard (localhost, ngrok, Tailscale, …). An absolute URL built
  // from NEXT_PUBLIC_BASE_URL breaks whenever the browser is on a different host
  // than the server. The RPi forwards this value verbatim into the SSE
  // `plant_scanned` event, so both the live and detail views get a working URL.
  const imageUrl = `/api/uploads/${filename}`;
  return NextResponse.json({ ok: true, imageUrl });
}
