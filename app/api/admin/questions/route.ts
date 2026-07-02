import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getQuestions,
  createQuestion,
  validateQuestionInput,
  type QuestionInput,
} from "@/lib/admin/questions";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 20;
    const search = searchParams.get("search") || undefined;
    const tingkat = searchParams.get("tingkat") || undefined;
    const level = searchParams.get("level") || undefined;
    const matpel = searchParams.get("matpel") || undefined;
    const questionType = searchParams.get("questionType") || undefined;

    const data = await getQuestions({
      page,
      pageSize,
      search,
      tingkat,
      level,
      matpel,
      questionType,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GET /api/admin/questions] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const input: QuestionInput = {
      tingkat: body.tingkat || "",
      level: body.level || "",
      matpel: body.matpel || "",
      questionType: body.questionType || "",
      content: body.content || "",
      imageUrl: body.imageUrl || null,
      options: Array.isArray(body.options) ? body.options : [],
      correctOption:
        body.correctOption !== undefined && body.correctOption !== null
          ? Number(body.correctOption)
          : null,
      acceptableAnswers: Array.isArray(body.acceptableAnswers)
        ? body.acceptableAnswers
        : [],
      explanation: body.explanation || "",
    };

    const result = validateQuestionInput(input);

    if (!result.isValid) {
      return NextResponse.json(
        { success: false, error: result.errors.join("; ") },
        { status: 400 }
      );
    }

    const created = await createQuestion(result.data!);

    return NextResponse.json(
      { success: true, data: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/admin/questions] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
