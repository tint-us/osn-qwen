import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  validateQuestions,
  revalidateForInsert,
  bulkInsertQuestions,
  type ValidatedQuestion,
} from "@/lib/content/validator";
import type { RawQuestion } from "@/lib/content/parsers";

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

    const body = await req.json();
    const { questions } = body as { questions?: RawQuestion[] };

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada soal untuk diimport" },
        { status: 400 }
      );
    }

    const results = validateQuestions(questions);

    const validationErrors: string[] = [];
    const validQuestions: ValidatedQuestion[] = [];

    for (const r of results) {
      if (!r.isValid) {
        validationErrors.push(
          `soal ${r.index} - ${r.errors.join(", ")}`
        );
      } else if (!revalidateForInsert(r.question)) {
        validationErrors.push(`soal ${r.index} - revalidasi gagal`);
      } else {
        validQuestions.push(r.question);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Validasi gagal: ${validationErrors.join("; ")}`,
        },
        { status: 400 }
      );
    }

    try {
      const imported = await bulkInsertQuestions(validQuestions);
      return NextResponse.json({ success: true, data: { imported } });
    } catch (dbError) {
      const message =
        dbError instanceof Error ? dbError.message : "unknown error";
      return NextResponse.json(
        { success: false, error: `Import gagal: ${message}. Tidak ada soal yang disimpan.` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[POST /api/admin/import/confirm] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
