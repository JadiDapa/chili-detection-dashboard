import { NextResponse } from "next/server";
import { SessionService } from "@/server/services/session.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await SessionService.errorSession(Number(id));
  return NextResponse.json({ ok: true, sessionId: session.id });
}
