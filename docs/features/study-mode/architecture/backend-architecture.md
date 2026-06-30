# Backend Architecture — STUDY MODE Module

## 1. API Routes

```
app/api/
├── questions/
│   └── route.ts              ← GET: fetch soal dengan filter
├── study/
│   └── attempt/
│       └── route.ts           ← POST: submit jawaban + grading
```

## 2. Service Layer

### File: `lib/services/study-service.ts`

```typescript
import { prisma } from "@/lib/prisma";

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Shuffle MC options and update correctOption
function shuffleOptions(question: QuestionDTO): QuestionDTO {
  if (question.questionType !== "MULTIPLE_CHOICE") return question;

  const options = question.options as string[];
  const correctOption = question.correctOption ?? -1;

  const mapping = options.map((text, originalIndex) => ({ text, originalIndex }));
  const shuffled = shuffleArray(mapping);

  return {
    ...question,
    options: shuffled.map(item => item.text),
    correctOption: shuffled.findIndex(item => item.originalIndex === correctOption),
  };
}

export const studyService = {
  // Get questions with filter, shuffled
  async getQuestions(filter: {
    tingkat: string;
    level: string;
    matpels: string[];
  }) {
    const questions = await prisma.question.findMany({
      where: {
        tingkat: filter.tingkat as Tingkat,
        level: filter.level as Level,
        matpel: { in: filter.matpels },
      },
      select: {
        id: true,
        tingkat: true,
        level: true,
        matpel: true,
        questionType: true,
        content: true,
        imageUrl: true,
        options: true,
        correctOption: true,
        acceptableAnswers: true,
        explanation: true,
      },
    });

    // Shuffle question order
    const shuffled = shuffleArray(questions);
    // Shuffle MC options per question
    return shuffled.map(q => shuffleOptions(q));
  },

  // Grade answer and save attempt
  async submitAttempt(userId: number, data: {
    questionId: number;
    userAnswer: string;
  }) {
    const question = await prisma.question.findUnique({
      where: { id: data.questionId },
    });

    if (!question) throw new Error("QUESTION_NOT_FOUND");

    // Grade based on questionType
    let isCorrect = false;
    let correctAnswer = "";

    switch (question.questionType) {
      case "MULTIPLE_CHOICE":
        isCorrect = parseInt(data.userAnswer, 10) === question.correctOption;
        correctAnswer = (question.options as string[])[question.correctOption ?? -1] ?? "";
        break;

      case "SHORT_ANSWER":
        const normalizedUser = data.userAnswer.trim().toLowerCase();
        isCorrect = question.acceptableAnswers.some(
          ans => ans.trim().toLowerCase() === normalizedUser
        );
        correctAnswer = question.acceptableAnswers[0] ?? "";
        break;

      case "ESSAY":
        const normalizedUserNum = parseFloat(data.userAnswer.replace(",", "."));
        isCorrect = question.acceptableAnswers.some(
          ans => parseFloat(ans.replace(",", ".")) === normalizedUserNum
        );
        correctAnswer = question.acceptableAnswers[0] ?? "";
        break;
    }

    // Save StudyAttempt
    await prisma.studyAttempt.create({
      data: {
        userId,
        questionId: data.questionId,
        userAnswer: data.userAnswer,
        isCorrect,
      },
    });

    // Update streak
    await this.updateStreak(userId);

    return {
      isCorrect,
      correctAnswer,
      explanation: question.explanation,
    };
  },

  // Update streak log
  async updateStreak(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.streakLog.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (existing) return; // Already logged today

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    const isConsecutive = lastActive && lastActive.getTime() === yesterday.getTime();

    await prisma.streakLog.create({
      data: { userId, date: today, isActive: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        streak: isConsecutive ? user.streak + 1 : 1,
        lastActiveDate: today,
      },
    });
  },
};
```

## 3. API Route: GET /api/questions

### File: `app/api/questions/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { studyService } from "@/lib/services/study-service";
import { z } from "zod";

const querySchema = z.object({
  tingkat: z.enum(["SD", "SMP", "SMA"]),
  level: z.enum(["OSNK", "OSNP", "SEMIFINAL", "FINAL"]),
  matpel: z.string().min(1), // comma-separated
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "SISWA")
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success)
    return NextResponse.json({ success: false, error: "Invalid filter" }, { status: 400 });

  const matpels = parsed.data.matpel.split(",");
  const questions = await studyService.getQuestions({
    tingkat: parsed.data.tingkat,
    level: parsed.data.level,
    matpels,
  });

  return NextResponse.json({ success: true, data: questions });
}
```

## 4. API Route: POST /api/study/attempt

### File: `app/api/study/attempt/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { studyService } from "@/lib/services/study-service";
import { z } from "zod";

const attemptSchema = z.object({
  questionId: z.number().int().positive(),
  userAnswer: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "SISWA")
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = attemptSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });

  try {
    const userId = parseInt((session.user as any).userId);
    const result = await studyService.submitAttempt(userId, parsed.data);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error.message === "QUESTION_NOT_FOUND")
      return NextResponse.json({ success: false, error: "Soal tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ success: false, error: "Terjadi kesalahan" }, { status: 500 });
  }
}
```

## 5. Security Considerations

| Concern | Mitigation |
|---|---|
| Correct answer leak | correctOption dan acceptableAnswers TIDAK dikirim ke client sebelum submit. Server return correctAnswer hanya setelah attempt disimpan. |
| XSS via question content | KaTeX render dengan throwOnError=false, no raw HTML injection. Content di-escape. |
| XSS via userAnswer | userAnswer disimpan sebagai plain string, di-escape saat ditampilkan. |
| Unauthorized access | Session check di setiap API route |
| Role bypass | Cek role === SISWA di setiap API route |
| Parameter injection | Zod schema validation di setiap endpoint |
| Question enumeration | Filter wajib (tidak bisa fetch semua soal tanpa filter) |
