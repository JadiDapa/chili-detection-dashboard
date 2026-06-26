import { NextResponse } from "next/server";
import { DashboardService } from "@/server/services/dashboard.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bedId = Number(searchParams.get("bedId") ?? 1);
    const overview = await DashboardService.getOverview(bedId);
    return NextResponse.json(overview);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch dashboard overview",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
