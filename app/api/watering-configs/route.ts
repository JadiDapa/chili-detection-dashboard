import { NextResponse } from "next/server";
import { WateringService } from "@/server/services/watering.service";

export async function GET() {
  try {
    const configs = await WateringService.listConfigs();
    return NextResponse.json(configs);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch watering configs", error },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const config = await WateringService.createConfig(body);
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create watering config", error: (error as Error).message },
      { status: 500 },
    );
  }
}
