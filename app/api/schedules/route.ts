import { NextResponse } from "next/server";
import { ScheduleService } from "@/server/services/schedule.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bedId = searchParams.get("bedId");
    const tasks = await ScheduleService.list(bedId ? Number(bedId) : undefined);
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch schedules", error },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const task = await ScheduleService.create(body);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create schedule", error: (error as Error).message },
      { status: 500 },
    );
  }
}
