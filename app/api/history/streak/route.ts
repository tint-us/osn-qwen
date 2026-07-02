import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStreak } from "@/lib/history/analytics";

export async function GET() {
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

    const userId = Number(session.user.userId);
    const data = await getStreak(userId);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GET /api/history/streak] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
