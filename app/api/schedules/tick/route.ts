import { NextResponse } from "next/server";
import { ScheduleService } from "@/server/services/schedule.service";

// Called by the RPi poller (services/scheduler.py). Fires any due slots (creating
// PENDING sessions), records skips/expiries, and returns ready-to-run scheduled
// sessions so the RPi can launch them. Session ids are minted here, never on the RPi.
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bedId = Number(searchParams.get("bedId"));
    if (!bedId) {
      return NextResponse.json({ message: "bedId is required" }, { status: 400 });
    }
    const due = await ScheduleService.tick(bedId);
    return NextResponse.json({ sessions: due });
  } catch (error) {
    return NextResponse.json(
      { message: "Schedule tick failed", error: (error as Error).message },
      { status: 500 },
    );
  }
}
