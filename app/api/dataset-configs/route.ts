import { NextResponse } from "next/server";
import { DatasetConfigService } from "@/server/services/dataset-config.service";

export async function GET() {
  try {
    const configs = await DatasetConfigService.list();
    return NextResponse.json(configs);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch dataset configs", error },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const config = await DatasetConfigService.create(body);
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create dataset config", error: (error as Error).message },
      { status: 500 },
    );
  }
}
