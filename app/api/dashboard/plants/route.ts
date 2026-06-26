import { NextResponse } from "next/server";
import { DashboardService } from "@/server/services/dashboard.service";

export async function GET() {
  try {
    const overview = await DashboardService.getPlantsOverview();
    return NextResponse.json(overview);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch plants overview",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
