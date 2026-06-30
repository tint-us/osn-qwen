# Backend Architecture — EXAM MODE Module

## 1. API Routes Structure

```
app/api/exam/
  sessions/
    route.ts                    → POST: create session
    active/
      route.ts                  → GET: get active session
    [id]/
      route.ts                  → GET: get session by ID
      sync/
        route.ts                → PATCH: sync progress
      abandon/
        route.ts                → DELETE: abandon session
      batch/
        [batchIndex]/
          route.ts              → GET: get batch questions
          submit/
            route.ts            → POST: submit batch answers
```

## 2. Service Layer

```
lib/services/
  examService.ts                → Session & batch CRUD, shuffle, distribute
  questionService.ts            → findByIds, stripCorrectAnswers (shared with Study)
  streakService.ts              → updateStreak (shared with Study)
```

### examService.ts — Core Functions

```typescript
// lib/services/examService.ts

import { prisma } from "@/lib/prisma";
import { fisherYatesShuffle, shuffleMCOptions } from "@/lib/utils/shuffle";

// ─── Session Management ───

export async function createSession(
  userId: number,
  filter: { tingkat: string; level: string; matpels: string[] },
  batchSize: number,
  timerEnabled: boolean,
  timerDuration: number
): Promise<ExamSession> {
  // 1. Validate: no existing ACTIVE session
  const existing = await prisma.examSession.findFirst({
    where: { userId, status: "ACTIVE" },
  });
  if (existing) {
    throw new ValidationError("Anda memiliki sesi aktif. Resume atau abandon terlebih dahulu.");
  }

  // 2. Fetch questions by filter
  const questions = await prisma.question.findMany({
    where: {
      tingkat: filter.tingkat as Tingkat,
      level: filter.level as Level,
      matpel: { in: filter.matpels },
    },
    select: { id: true, questionType: true, options: true,
              correctOption: true, acceptableAnswers: true },
  });

  // 3. Validate minimum
  if (questions.length < 10) {
    throw new ValidationError("Minimal 10 soal untuk memulai exam");
  }

  // 4. Shuffle question order
  const shuffled = fisherYatesShuffle(questions);

  // 5. Shuffle MC options + remap correctOption
  for (const q of shuffled) {
    if (q.questionType === "MULTIPLE_CHOICE" && q.options) {
      const { shuffledOptions, newCorrectIndex } = shuffleMCOptions(
        q.options as string[], q.correctOption!
      );
      await prisma.question.update({
        where: { id: q.id },
        data: { options: shuffledOptions, correctOption: newCorrectIndex },
      });
    }
  }

  // 6. Create session
  const session = await prisma.examSession.create({
    data: {
      userId,
      filter: filter as any,
      totalQuestions: shuffled.length,
      batchSize,
      status: "ACTIVE",
      questionOrder: shuffled.map(q => q.id),
      currentBatchIndex: 0,
    },
  });

  // 7. Distribute to batches
  const questionIds = shuffled.map(q => q.id);
  const batches: number[][] = [];
  for (let i = 0; i < questionIds.length; i += batchSize) {
    batches.push(questionIds.slice(i, i + batchSize));
  }

  // 8. Create batch records
  await prisma.examBatch.createMany({
    data: batches.map((batchQIds, index) => ({
      sessionId: session.id,
      batchIndex: index,
      questionIds: batchQIds,
      answers: {},
      startedAt: index === 0 ? new Date() : null,
    })),
  });

  return session;
}

export async function getActiveSession(userId: number) {
  return prisma.examSession.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { batches: { orderBy: { batchIndex: "asc" } } },
  });
}

export async function getSession(sessionId: number, userId: number) {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: { batches: { orderBy: { batchIndex: "asc" } } },
  });
  if (!session || session.userId !== userId) {
    throw new NotFoundError("Session not found");
  }
  return session;
}

export async function abandonSession(sessionId: number, userId: number) {
  const session = await getSession(sessionId, userId);
  if (session.status !== "ACTIVE") {
    throw new ValidationError("Session is not active");
  }
  return prisma.examSession.update({
    where: { id: sessionId },
    data: { status: "ABANDONED" },
  });
}

// ─── Batch Management ───

export async function getBatch(
  sessionId: number,
  batchIndex: number,
  userId: number
) {
  const session = await getSession(sessionId, userId);

  if (session.status !== "ACTIVE") {
    throw new ValidationError("Session is not active");
  }

  if (batchIndex !== session.currentBatchIndex) {
    throw new ValidationError(
      `Batch ${batchIndex} is not available. Current batch: ${session.currentBatchIndex}`
    );
  }

  const batch = await prisma.examBatch.findUnique({
    where: { sessionId_batchIndex: { sessionId, batchIndex } },
  });
  if (!batch) throw new NotFoundError("Batch not found");

  // Server-side timer check (safety net)
  if (session.timerEnabled && batch.startedAt && !batch.submittedAt) {
    const endTime = batch.startedAt.getTime() + session.timerDuration * 60 * 1000;
    if (Date.now() > endTime) {
      // Auto-submit with last synced answers
      await autoSubmitBatch(sessionId, batchIndex, batch.answers as Record<number, string>);
      return { autoSubmitted: true };
    }
  }

  // Set startedAt if first access
  let startedAt = batch.startedAt;
  if (!startedAt) {
    startedAt = new Date();
    await prisma.examBatch.update({
      where: { id: batch.id },
      data: { startedAt },
    });
  }

  return { batch, startedAt };
}

export async function syncBatch(
  sessionId: number,
  userId: number,
  data: { currentBatchIndex: number; answers: Record<number, string>;
          currentQuestionIndex: number }
) {
  const session = await getSession(sessionId, userId);
  if (session.status !== "ACTIVE") {
    throw new ValidationError("Session is not active");
  }

  return prisma.examBatch.update({
    where: { sessionId_batchIndex: { sessionId, batchIndex: data.currentBatchIndex } },
    data: { answers: data.answers as any },
  });
}

export async function submitBatch(
  sessionId: number,
  batchIndex: number,
  userId: number,
  userAnswers: Record<number, string>
) {
  const session = await getSession(sessionId, userId);

  if (session.status !== "ACTIVE") {
    throw new ValidationError("Session is not active");
  }

  const batch = await prisma.examBatch.findUnique({
    where: { sessionId_batchIndex: { sessionId, batchIndex } },
  });
  if (!batch) throw new NotFoundError("Batch not found");

  // Prevent double submit
  if (batch.submittedAt) {
    throw new ValidationError("Batch sudah di-submit");
  }

  // Fetch questions WITH correct answers for grading
  const questions = await prisma.question.findMany({
    where: { id: { in: batch.questionIds } },
  });

  // Grade each answer
  const gradedAnswers: Record<number, {
    userAnswer: string; isCorrect: boolean; correctAnswer: string;
  }> = {};
  let totalCorrect = 0;

  for (const q of questions) {
    const userAnswer = userAnswers[q.id] || "";
    const isCorrect = gradeAnswer(userAnswer, q);
    if (isCorrect) totalCorrect++;

    gradedAnswers[q.id] = {
      userAnswer,
      isCorrect,
      correctAnswer: getCorrectAnswerText(q),
    };
  }

  const totalWrong = questions.length - totalCorrect;
  const score = Math.round((totalCorrect / questions.length) * 10000) / 100;

  // Save batch results
  await prisma.examBatch.update({
    where: { id: batch.id },
    data: {
      answers: gradedAnswers as any,
      score,
      totalCorrect,
      totalWrong,
      submittedAt: new Date(),
    },
  });

  // Update session
  const totalBatches = Math.ceil(session.totalQuestions / session.batchSize);
  const isLastBatch = batchIndex + 1 >= totalBatches;

  await prisma.examSession.update({
    where: { id: sessionId },
    data: {
      currentBatchIndex: batchIndex + 1,
      status: isLastBatch ? "COMPLETED" : "ACTIVE",
    },
  });

  // Update streak
  await updateStreak(userId);

  // Fetch all batch scores for analytics
  const allBatches = await prisma.examBatch.findMany({
    where: { sessionId },
    orderBy: { batchIndex: "asc" },
    select: { batchIndex: true, score: true,
              totalCorrect: true, totalWrong: true },
  });

  return { score, totalCorrect, totalWrong, gradedAnswers, allBatches, isLastBatch };
}

async function autoSubmitBatch(
  sessionId: number,
  batchIndex: number,
  syncedAnswers: Record<number, string>
) {
  // Called when timer expired server-side
  // Uses answers from last sync
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) return;

  await submitBatch(sessionId, batchIndex, session.userId, syncedAnswers);
}

// ─── Grading (shared logic with Study Mode) ───

function gradeAnswer(userAnswer: string, question: Question): boolean {
  if (!userAnswer || userAnswer.trim() === "") return false;

  switch (question.questionType) {
    case "MULTIPLE_CHOICE":
      return parseInt(userAnswer) === question.correctOption;
    case "SHORT_ANSWER":
      const normalized = userAnswer.trim().toLowerCase();
      return question.acceptableAnswers.some(
        ans => ans.trim().toLowerCase() === normalized
      );
    case "ESSAY":
      const userNum = parseFloat(userAnswer.replace(",", "."));
      const correctNum = parseFloat(
        question.acceptableAnswers[0]?.replace(",", ".") || ""
      );
      return !isNaN(userNum) && !isNaN(correctNum) &&
             Math.abs(userNum - correctNum) < 0.001;
    default:
      return false;
  }
}

function getCorrectAnswerText(q: Question): string {
  switch (q.questionType) {
    case "MULTIPLE_CHOICE":
      return (q.options as string[])[q.correctOption!] || "";
    case "SHORT_ANSWER":
      return q.acceptableAnswers[0] || "";
    case "ESSAY":
      return q.acceptableAnswers[0] || "";
    default:
      return "";
  }
}
```

## 3. Security Considerations

### Correct Answer Stripping

```typescript
// lib/utils/security.ts

export function stripCorrectAnswers(questions: Question[]) {
  return questions.map(q => ({
    id: q.id,
    content: q.content,
    imageUrl: q.imageUrl,
    questionType: q.questionType,
    options: q.options, // MC options (already shuffled) — no correctOption
    // NO correctOption
    // NO acceptableAnswers
  }));
}
```

### Authorization Checks

| Endpoint | Auth Check |
|---|---|
| POST /api/exam/sessions | `session.user.id === body.userId && role === SISWA` |
| GET /api/exam/sessions/active | `session.user.role === SISWA` |
| GET /api/exam/sessions/[id] | `session.user.id === session.userId` |
| GET /api/exam/sessions/[id]/batch/[batchIndex] | `session.user.id === examSession.userId` |
| PATCH /api/exam/sessions/[id]/sync | `session.user.id === examSession.userId && status === ACTIVE` |
| POST /api/exam/sessions/[id]/batch/[batchIndex]/submit | `session.user.id === examSession.userId && status === ACTIVE` |
| DELETE /api/exam/sessions/[id]/abandon | `session.user.id === examSession.userId && status === ACTIVE` |

### Input Validation

| Field | Validation |
|---|---|
| batchSize | Integer, 10-30 |
| timerDuration | Integer, 1-180 (if timerEnabled) |
| filter.tingkat | Enum: SD, SMP, SMA |
| filter.level | Enum: OSNK, OSNP, SEMIFINAL, FINAL |
| filter.matpels | Array of strings, min length 1 |
| batchIndex | Integer, >= 0, < totalBatches |
| answers | Object: { [questionId: number]: string } |
