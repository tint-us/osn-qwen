import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnalytics } from "@/lib/history/analytics";

const VALID_TINGKAT = ["SD", "SMP", "SMA"];
const VALID_LEVEL = ["OSNK", "OSNP", "SEMIFINAL", "FINAL"];

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
    const tingkat = searchParams.get("tingkat") ?? undefined;
    const level = searchParams.get("level") ?? undefined;
    const matpel = searchParams.get("matpel") ?? undefined;

    if (tingkat && !VALID_TINGKAT.includes(tingkat)) {
      return NextResponse.json(
        { success: false, error: "Invalid tingkat" },
        { status: 400 }
      );
    }
    if (level && !VALID_LEVEL.includes(level)) {
      return NextResponse.json(
        { success: false, error: "Invalid level" },
        { status: 400 }
      );
    }

    const userId = Number(session.user.userId);
    const data = await getAnalytics(userId, { tingkat, level, matpel });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GET /api/history/analytics] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
