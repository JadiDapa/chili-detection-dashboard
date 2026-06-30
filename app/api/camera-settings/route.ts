import { NextResponse } from "next/server";
import { CameraSettingService } from "@/server/services/camera-setting.service";

// GET /api/camera-settings?bedId=1
// Called by the RPi at startup to restore the saved camera controls. Returns the
// snake_case payload the camera service understands, or { settings: null } when
// nothing is saved yet (the RPi then keeps its built-in defaults).
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bedId = Number(searchParams.get("bedId"));
    if (!Number.isInteger(bedId) || bedId <= 0) {
      return NextResponse.json(
        { message: "Valid bedId query param is required" },
        { status: 400 },
      );
    }

    const record = await CameraSettingService.getByBed(bedId);
    return NextResponse.json({
      settings: record ? CameraSettingService.buildPayload(record) : null,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch camera settings", error: (error as Error).message },
      { status: 500 },
    );
  }
}
