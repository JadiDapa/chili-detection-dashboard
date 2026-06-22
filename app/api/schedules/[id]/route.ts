import { NextResponse } from "next/server";
import { ScheduleService } from "@/server/services/schedule.service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const task = await ScheduleService.update(Number(id), body);
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update schedule", error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await ScheduleService.remove(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete schedule", error: (error as Error).message },
      { status: 500 },
    );
  }
}
