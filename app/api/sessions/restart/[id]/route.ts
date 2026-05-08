import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.session.update({
        where: { id: Number(id) },
        data: {
          startTime: null,
          endTime: null,
          status: "PENDING",
          row: 0,
          column: 0,
        },
      });

      await tx.captures.deleteMany({
        where: { sessionId: Number(id) },
      });

      return session;
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Transaction error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
