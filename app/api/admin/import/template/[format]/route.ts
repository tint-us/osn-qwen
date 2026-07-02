import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTemplate, getTemplateContentType } from "@/lib/content/templates";

const VALID_FORMATS = ["csv", "json", "xml"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ format: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: admin access required" },
        { status: 403 }
      );
    }

    const { format } = await params;

    if (!VALID_FORMATS.includes(format)) {
      return NextResponse.json(
        { success: false, error: "Format template tidak valid. Gunakan csv, json, atau xml" },
        { status: 400 }
      );
    }

    const template = getTemplate(format as "csv" | "json" | "xml");
    const contentType = getTemplateContentType(format as "csv" | "json" | "xml");

    return new NextResponse(template, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="template-import.${format}"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/import/template] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
