import { NextResponse } from "next/server";
import { ScanConfigService } from "@/server/services/scan-config.service";

export async function GET() {
  try {
    const configs = await ScanConfigService.list();
    return NextResponse.json(configs);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch scan configs", error },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const config = await ScanConfigService.create(body);
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create scan config", error: (error as Error).message },
      { status: 500 },
    );
  }
}
