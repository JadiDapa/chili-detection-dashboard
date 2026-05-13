import { NextResponse } from "next/server";
import { SessionService, PiSyncPayload } from "@/server/services/session.service";

export async function POST(req: Request) {
  let payload: PiSyncPayload;

  try {
    payload = (await req.json()) as PiSyncPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { session_id, status, bed_id, started_at, completed_at, plant_scans, summary } = payload;

  if (!session_id || !status || !bed_id || !started_at || !completed_at || !summary || !plant_scans) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    const session = await SessionService.syncFromPi(payload);
    return NextResponse.json({ ok: true, session_id: session.id }, { status: 200 });
  } catch (error) {
    console.error("[sync] failed to persist session:", error);
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
