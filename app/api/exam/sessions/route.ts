import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createExamSession } from "@/lib/exam/session";

const VALID_TINGKAT = ["SD", "SMP", "SMA"];
const VALID_LEVEL = ["OSNK", "OSNP", "SEMIFINAL", "FINAL"];

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { filter, batchSize, timerEnabled, timerDuration } = body as {
      filter?: { tingkat?: string; level?: string; matpels?: string[] };
      batchSize?: number;
      timerEnabled?: boolean;
      timerDuration?: number;
    };

    if (
      !filter?.tingkat ||
      !filter?.level ||
      !filter?.matpels ||
      filter.matpels.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "Filter wajib: tingkat, level, matpel" },
        { status: 400 }
      );
    }

    if (!VALID_TINGKAT.includes(filter.tingkat) || !VALID_LEVEL.includes(filter.level)) {
      return NextResponse.json(
        { success: false, error: "Filter wajib: tingkat, level, matpel" },
        { status: 400 }
      );
    }

    if (
      typeof batchSize !== "number" ||
      batchSize < 10 ||
      batchSize > 30
    ) {
      return NextResponse.json(
        { success: false, error: "Batch size harus 10-30" },
        { status: 400 }
      );
    }

    if (timerEnabled) {
      if (typeof timerDuration !== "number" || timerDuration < 1 || timerDuration > 180) {
        return NextResponse.json(
          { success: false, error: "Timer duration minimal 1 menit" },
          { status: 400 }
        );
      }
    }

    const userId = Number(session.user.userId);

    const result = await createExamSession({
      userId,
      filter: {
        tingkat: filter.tingkat,
        level: filter.level,
        matpels: filter.matpels,
      },
      batchSize,
      timerEnabled: timerEnabled ?? false,
      timerDuration: timerDuration ?? 30,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/exam/sessions] Error:", error);

    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan server";

    if (message === "ACTIVE_SESSION_EXISTS") {
      return NextResponse.json(
        {
          success: false,
          error: "Anda memiliki sesi aktif. Resume atau abandon terlebih dahulu.",
        },
        { status: 400 }
      );
    }
    if (message === "NO_QUESTIONS_FOUND") {
      return NextResponse.json(
        { success: false, error: "Tidak ada soal untuk filter ini" },
        { status: 400 }
      );
    }
    if (message === "INSUFFICIENT_QUESTIONS") {
      return NextResponse.json(
        { success: false, error: "Minimal 10 soal untuk memulai exam" },
        { status: 400 }
      );
    }
    if (message === "INVALID_BATCH_SIZE") {
      return NextResponse.json(
        { success: false, error: "Batch size harus 10-30" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
