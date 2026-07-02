import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitBatch } from "@/lib/exam/session";
import { updateStreak } from "@/lib/services/streak-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; batchIndex: string }> }
) {
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

    const { id, batchIndex } = await params;
    const sessionId = Number(id);
    const batchIdx = Number(batchIndex);

    if (isNaN(sessionId) || isNaN(batchIdx)) {
      return NextResponse.json(
        { success: false, error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { answers } = body as { answers?: Record<string, string> };

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { success: false, error: "Answers wajib diisi" },
        { status: 400 }
      );
    }

    const userId = Number(session.user.userId);
    const result = await submitBatch(userId, sessionId, batchIdx, answers);

    await updateStreak(userId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[POST /api/exam/sessions/[id]/batch/[batchIndex]/submit] Error:", error);

    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan server";

    if (message === "SESSION_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }
    if (message === "SESSION_NOT_ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Session is not active" },
        { status: 400 }
      );
    }
    if (message === "BATCH_NOT_AVAILABLE") {
      return NextResponse.json(
        { success: false, error: "Batch not available" },
        { status: 400 }
      );
    }
    if (message === "BATCH_ALREADY_SUBMITTED") {
      return NextResponse.json(
        { success: false, error: "Batch sudah di-submit" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
