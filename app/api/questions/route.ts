import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchAndShuffleQuestions } from "@/lib/study/questions";
import type { Tingkat, Level } from "@prisma/client";

const VALID_TINGKAT = ["SD", "SMP", "SMA"];
const VALID_LEVEL = ["OSNK", "OSNP", "SEMIFINAL", "FINAL"];

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const tingkat = searchParams.get("tingkat");
    const level = searchParams.get("level");
    const matpel = searchParams.get("matpel");

    if (
      !tingkat ||
      !level ||
      !matpel ||
      !VALID_TINGKAT.includes(tingkat) ||
      !VALID_LEVEL.includes(level)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid filter" },
        { status: 400 }
      );
    }

    const matpels = matpel
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    if (matpels.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid filter" },
        { status: 400 }
      );
    }

    const questions = await fetchAndShuffleQuestions(
      tingkat as Tingkat,
      level as Level,
      matpels
    );

    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error("[GET /api/questions] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
