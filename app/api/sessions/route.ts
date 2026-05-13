import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.session.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        captures: true,
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong!", error },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { title, notes, startedAt, completedAt, status } = await req.json();

    const result = await prisma.session.create({
      data: {
        title,
        notes,
        startedAt,
        completedAt,
        status,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error: ", error);
    return NextResponse.json(
      { message: "Something went wrong!", error: (error as Error).message },
      { status: 500 },
    );
  }
}
