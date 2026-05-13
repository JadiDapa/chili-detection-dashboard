import { NextResponse } from "next/server";
import { SessionService } from "@/server/services/session.service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { status } = (await req.json()) as { status: "running" | "stopped" | "error" };
  const session = await SessionService.patchStatus(Number(id), status);
  return NextResponse.json({ ok: true, status: session.status });
}
