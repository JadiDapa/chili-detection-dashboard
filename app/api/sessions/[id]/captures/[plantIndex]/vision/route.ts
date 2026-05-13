import { NextResponse } from "next/server";
import { SessionService, CreateCaptureInput } from "@/server/services/session.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; plantIndex: string }> },
) {
  const { id, plantIndex } = await params;
  const body = (await req.json()) as CreateCaptureInput;
  const capture = await SessionService.createCapture(Number(id), Number(plantIndex), body);
  return NextResponse.json({ ok: true, captureId: capture.id });
}
