import { NextResponse } from "next/server";
import { SessionService } from "@/server/services/session.service";

export async function GET() {
  try {
    const result = await SessionService.list();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong!", error },
      { status: 500 },
    );
  }
}
