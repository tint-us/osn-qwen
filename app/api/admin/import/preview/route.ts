import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseFile } from "@/lib/content/parsers";
import { validateQuestions } from "@/lib/content/validator";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".csv", ".json", ".xml"];

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return filename.slice(dotIndex).toLowerCase();
}

export async function POST(req: NextRequest) {
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

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "File wajib diupload" },
        { status: 400 }
      );
    }

    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { success: false, error: "Format file tidak didukung. Gunakan .csv, .json, atau .xml" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Ukuran file maksimal 5MB" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: "File kosong" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const format = ext.slice(1) as "csv" | "json" | "xml";

    let rawQuestions;
    try {
      rawQuestions = parseFile(text, format);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Parse error";
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }

    if (rawQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada soal dalam file" },
        { status: 400 }
      );
    }

    const results = validateQuestions(rawQuestions);
    const validCount = results.filter((r) => r.isValid).length;
    const invalidCount = results.length - validCount;

    return NextResponse.json({
      success: true,
      data: {
        totalParsed: rawQuestions.length,
        validCount,
        invalidCount,
        questions: results,
      },
    });
  } catch (error) {
    console.error("[POST /api/admin/import/preview] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
