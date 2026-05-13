import { NextResponse } from "next/server";
import { SessionService, UpdateSensorsInput } from "@/server/services/session.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; plantIndex: string }> },
) {
  const { id, plantIndex } = await params;
  const body = (await req.json()) as UpdateSensorsInput;
  await SessionService.updateCaptureSensors(Number(id), Number(plantIndex), body);
  return NextResponse.json({ ok: true });
}
