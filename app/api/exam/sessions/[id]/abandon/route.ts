import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { abandonSession } from "@/lib/exam/session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const sessionId = Number(id);
    if (isNaN(sessionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid session ID" },
        { status: 400 }
      );
    }

    const userId = Number(session.user.userId);
    const result = await abandonSession(userId, sessionId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[DELETE /api/exam/sessions/[id]/abandon] Error:", error);

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

    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
