import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSessions } from "@/lib/history/analytics";

const MAX_LIMIT = 50;
const VALID_STATUSES = ["COMPLETED", "ACTIVE", "ABANDONED"];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (session.user.role !== "SISWA") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit")) || 10)
    );
    const status = searchParams.get("status") ?? undefined;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status filter" },
        { status: 400 }
      );
    }

    const userId = Number(session.user.userId);
    const data = await getSessions(userId, page, limit, status);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GET /api/history/sessions] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
