import { NextResponse } from "next/server";
import { SessionService, SessionSummaryInput } from "@/server/services/session.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { summary } = (await req.json()) as { summary: SessionSummaryInput };
  const session = await SessionService.completeSession(Number(id), summary);
  return NextResponse.json({ ok: true, sessionId: session.id });
}
