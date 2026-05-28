import { NextResponse } from "next/server";
import { WateringService } from "@/server/services/watering.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const config = await WateringService.getConfigById(Number(id));
    if (!config) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch watering config", error },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const config = await WateringService.updateConfig(Number(id), body);
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update watering config", error: (error as Error).message },
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
    await WateringService.deleteConfig(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete watering config", error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // POST /api/watering-configs/{id} sets this config as the default
  const { id } = await params;
  try {
    const config = await WateringService.setDefault(Number(id));
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to set default watering config", error: (error as Error).message },
      { status: 500 },
    );
  }
}
