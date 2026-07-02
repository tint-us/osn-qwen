import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  validateQuestionInput,
  type QuestionInput,
} from "@/lib/admin/questions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const questionId = Number(id);
    if (isNaN(questionId)) {
      return NextResponse.json(
        { success: false, error: "ID soal tidak valid" },
        { status: 400 }
      );
    }

    const question = await getQuestionById(questionId);

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Soal tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    console.error("[GET /api/admin/questions/[id]] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const questionId = Number(id);
    if (isNaN(questionId)) {
      return NextResponse.json(
        { success: false, error: "ID soal tidak valid" },
        { status: 400 }
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

    const existing = await getQuestionById(questionId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Soal tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await updateQuestion(questionId, result.data!);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/admin/questions/[id]] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const questionId = Number(id);
    if (isNaN(questionId)) {
      return NextResponse.json(
        { success: false, error: "ID soal tidak valid" },
        { status: 400 }
      );
    }

    const existing = await getQuestionById(questionId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Soal tidak ditemukan" },
        { status: 404 }
      );
    }

    await deleteQuestion(questionId);

    return NextResponse.json({ success: true, data: { id: questionId } });
  } catch (error) {
    console.error("[DELETE /api/admin/questions/[id]] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
