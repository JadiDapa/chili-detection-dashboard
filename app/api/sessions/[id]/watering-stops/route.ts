import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WateringService, CreateWateringStopInput } from "@/server/services/watering.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const stops = await prisma.wateringStop.findMany({
      where: { sessionId: Number(id) },
      orderBy: { stopIndex: "asc" },
    });
    return NextResponse.json(stops);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch watering stops", error },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = (await req.json()) as CreateWateringStopInput;
    const stop = await WateringService.createWateringStop(Number(id), body);
    return NextResponse.json({ ok: true, stopId: stop.id });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create watering stop", error: (error as Error).message },
      { status: 500 },
    );
  }
}
