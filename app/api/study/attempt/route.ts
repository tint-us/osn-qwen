import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeAnswer } from "@/lib/study/grading";
import { updateStreak } from "@/lib/services/streak-service";

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
    const { questionId, userAnswer } = body as {
      questionId?: number;
      userAnswer?: string;
    };

    if (
      !questionId ||
      typeof questionId !== "number" ||
      isNaN(questionId) ||
      !userAnswer ||
      typeof userAnswer !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        questionType: true,
        options: true,
        correctOption: true,
        acceptableAnswers: true,
        explanation: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Soal tidak ditemukan" },
        { status: 404 }
      );
    }

    const options = (question.options as string[]) || [];
    const result = gradeAnswer(
      question.questionType,
      userAnswer,
      question.correctOption,
      options,
      question.acceptableAnswers
    );

    const userId = Number(session.user.userId);

    await prisma.studyAttempt.create({
      data: {
        userId,
        questionId,
        userAnswer,
        isCorrect: result.isCorrect,
      },
    });

    await updateStreak(userId);

    return NextResponse.json({
      success: true,
      data: {
        isCorrect: result.isCorrect,
        correctAnswer: result.correctAnswer,
        explanation: question.explanation,
      },
    });
  } catch (error) {
    console.error("[POST /api/study/attempt] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
