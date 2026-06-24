import { NextResponse } from "next/server";
import { DatasetConfigService } from "@/server/services/dataset-config.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const config = await DatasetConfigService.getById(Number(id));
    if (!config) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch dataset config", error },
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
    const config = await DatasetConfigService.update(Number(id), body);
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update dataset config", error: (error as Error).message },
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
    await DatasetConfigService.delete(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete dataset config", error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // POST /api/dataset-configs/{id} sets this config as the default
  const { id } = await params;
  try {
    const config = await DatasetConfigService.setDefault(Number(id));
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to set default dataset config", error: (error as Error).message },
      { status: 500 },
    );
  }
}
