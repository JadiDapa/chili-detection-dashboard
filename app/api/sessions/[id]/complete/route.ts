import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionService, SessionSummaryInput } from "@/server/services/session.service";
import { WateringService, WateringSessionSummaryInput } from "@/server/services/watering.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { summary } = await req.json();

  const session = await prisma.session.findUniqueOrThrow({
    where: { id: Number(id) },
    select: { sessionType: true },
  });

  if (session.sessionType === "WATERING") {
    await WateringService.completeWateringSession(Number(id), summary as WateringSessionSummaryInput);
    return NextResponse.json({ ok: true, sessionId: Number(id) });
  }

  const completed = await SessionService.completeSession(Number(id), summary as SessionSummaryInput);
  return NextResponse.json({ ok: true, sessionId: completed.id });
}
