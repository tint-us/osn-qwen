import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDBHealth } from "@/lib/admin/stats";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const data = await getDBHealth();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GET /api/admin/diagnostics] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
