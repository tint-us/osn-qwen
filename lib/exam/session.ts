import { prisma } from "@/lib/prisma";
import { Prisma, type Tingkat, type Level, type ExamSessionStatus } from "@prisma/client";

const MIN_QUESTIONS = 10;
const MIN_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 30;

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffleOptions(options: string[], correctOption: number | null) {
  if (!options || options.length === 0 || correctOption === null) {
    return { options, correctOption };
  }
  const indices = options.map((_, i) => i);
  const shuffledIndices = fisherYatesShuffle(indices);
  const shuffledOptions = shuffledIndices.map((i) => options[i]);
  const newCorrectOption = shuffledIndices.indexOf(correctOption);
  return { options: shuffledOptions, correctOption: newCorrectOption };
}

export async function fetchQuestionIds(
  tingkat: Tingkat,
  level: Level,
  matpels: string[]
): Promise<number[]> {
  const questions = await prisma.question.findMany({
    where: { tingkat, level, matpel: { in: matpels } },
    select: { id: true },
  });
  return questions.map((q) => q.id);
}

export function createBatches(
  questionIds: number[],
  batchSize: number
): number[][] {
  const batches: number[][] = [];
  for (let i = 0; i < questionIds.length; i += batchSize) {
    batches.push(questionIds.slice(i, i + batchSize));
  }
  return batches;
}

export interface ExamSessionInput {
  userId: number;
  filter: { tingkat: string; level: string; matpels: string[] };
  batchSize: number;
  timerEnabled: boolean;
  timerDuration: number;
}

export interface CreatedExamSession {
  id: number;
  filter: Record<string, unknown>;
  totalQuestions: number;
  batchSize: number;
  totalBatches: number;
  currentBatchIndex: number;
  status: string;
  timerEnabled: boolean;
  timerDuration: number;
}

export async function createExamSession(
  input: ExamSessionInput
): Promise<CreatedExamSession> {
  const { userId, filter, batchSize, timerEnabled, timerDuration } = input;

  if (batchSize < MIN_BATCH_SIZE || batchSize > MAX_BATCH_SIZE) {
    throw new Error("INVALID_BATCH_SIZE");
  }

  if (timerEnabled && (timerDuration < 1 || timerDuration > 180)) {
    throw new Error("INVALID_TIMER_DURATION");
  }

  const activeSession = await prisma.examSession.findFirst({
    where: { userId, status: "ACTIVE" },
    select: { id: true },
  });
  if (activeSession) {
    throw new Error("ACTIVE_SESSION_EXISTS");
  }

  const questionIds = await fetchQuestionIds(
    filter.tingkat as Tingkat,
    filter.level as Level,
    filter.matpels
  );

  if (questionIds.length === 0) {
    throw new Error("NO_QUESTIONS_FOUND");
  }

  if (questionIds.length < MIN_QUESTIONS) {
    throw new Error("INSUFFICIENT_QUESTIONS");
  }

  const shuffledIds = fisherYatesShuffle(questionIds);
  const batches = createBatches(shuffledIds, batchSize);

  const session = await prisma.examSession.create({
    data: {
      userId,
      filter: {
        ...filter,
        timerEnabled,
        timerDuration,
      } as unknown as Prisma.InputJsonValue,
      totalQuestions: shuffledIds.length,
      batchSize,
      status: "ACTIVE",
      questionOrder: shuffledIds,
      currentBatchIndex: 0,
    },
  });

  await prisma.examBatch.createMany({
    data: batches.map((batch, index) => ({
      sessionId: session.id,
      batchIndex: index,
      questionIds: batch,
      answers: {},
    })),
  });

  return {
    id: session.id,
    filter: session.filter as Record<string, unknown>,
    totalQuestions: session.totalQuestions,
    batchSize: session.batchSize,
    totalBatches: batches.length,
    currentBatchIndex: 0,
    status: session.status,
    timerEnabled,
    timerDuration,
  };
}

export async function getActiveSession(userId: number) {
  const session = await prisma.examSession.findFirst({
    where: { userId, status: "ACTIVE" },
    include: {
      batches: {
        orderBy: { batchIndex: "asc" },
        select: {
          batchIndex: true,
          submittedAt: true,
          score: true,
          totalCorrect: true,
          totalWrong: true,
        },
      },
    },
  });

  if (!session) return null;

  return {
    id: session.id,
    filter: session.filter,
    totalQuestions: session.totalQuestions,
    batchSize: session.batchSize,
    totalBatches: session.batches.length,
    currentBatchIndex: session.currentBatchIndex,
    status: session.status,
    timerEnabled: (session.filter as { timerEnabled?: boolean })?.timerEnabled ?? false,
    timerDuration: (session.filter as { timerDuration?: number })?.timerDuration ?? 30,
    batches: session.batches.map((b) => ({
      batchIndex: b.batchIndex,
      submittedAt: b.submittedAt,
      score: b.score,
      totalCorrect: b.totalCorrect,
      totalWrong: b.totalWrong,
    })),
  };
}

export async function abandonSession(userId: number, sessionId: number) {
  const session = await prisma.examSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true, status: true },
  });

  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (session.status !== "ACTIVE") throw new Error("SESSION_NOT_ACTIVE");

  const updated = await prisma.examSession.update({
    where: { id: sessionId },
    data: { status: "ABANDONED" as ExamSessionStatus },
    select: { id: true, status: true },
  });

  return updated;
}

export async function getBatchData(
  userId: number,
  sessionId: number,
  batchIndex: number
) {
  const session = await prisma.examSession.findFirst({
    where: { id: sessionId, userId },
    select: {
      id: true,
      status: true,
      currentBatchIndex: true,
      questionOrder: true,
      batchSize: true,
      filter: true,
    },
  });

  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (session.status !== "ACTIVE") throw new Error("SESSION_NOT_ACTIVE");
  if (batchIndex !== session.currentBatchIndex) {
    throw new Error("BATCH_NOT_AVAILABLE");
  }

  const batch = await prisma.examBatch.findFirst({
    where: { sessionId, batchIndex },
    select: {
      id: true,
      questionIds: true,
      answers: true,
      submittedAt: true,
      startedAt: true,
    },
  });

  if (!batch) throw new Error("BATCH_NOT_FOUND");
  if (batch.submittedAt) throw new Error("BATCH_ALREADY_SUBMITTED");

  const questionIds = batch.questionIds as number[];

  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      questionType: true,
      content: true,
      imageUrl: true,
      options: true,
      correctOption: true,
      acceptableAnswers: true,
      explanation: true,
    },
  });

  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const orderedQuestions = questionIds
    .map((id) => questionMap.get(id))
    .filter(Boolean) as typeof questions;

  const existingAnswers = (batch.answers as Record<string, unknown>) || {};
  const existingOptionMap =
    (existingAnswers.__optionMap__ as Record<string, number[]>) || null;

  const optionMap: Record<string, number[]> = {};
  const shuffledQuestions = orderedQuestions.map((q) => {
    const options = (q.options as string[]) || [];

    let permutation: number[];
    if (existingOptionMap && existingOptionMap[String(q.id)]) {
      permutation = existingOptionMap[String(q.id)];
    } else {
      permutation = fisherYatesShuffle(options.map((_, i) => i));
    }

    const shuffledOpts = permutation.map((i) => options[i]);
    optionMap[String(q.id)] = permutation;

    return {
      id: q.id,
      questionType: q.questionType as string,
      content: q.content,
      imageUrl: q.imageUrl,
      options: shuffledOpts,
      correctOption: null,
      acceptableAnswers: [] as string[],
      explanation: "",
    };
  });

  const needsStartedAt = !batch.startedAt;
  const needsOptionMap = !existingOptionMap;
  if (needsStartedAt || needsOptionMap) {
    const updatedAnswers = { ...existingAnswers, __optionMap__: optionMap };
    await prisma.examBatch.update({
      where: { id: batch.id },
      data: {
        ...(needsStartedAt ? { startedAt: new Date() } : {}),
        ...(needsOptionMap
          ? { answers: updatedAnswers as unknown as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  const filter = session.filter as {
    timerEnabled?: boolean;
    timerDuration?: number;
  };

  const clientAnswers: Record<string, string> = {};
  for (const [key, value] of Object.entries(existingAnswers)) {
    if (key !== "__optionMap__") {
      clientAnswers[key] = String(value);
    }
  }

  return {
    batchIndex,
    questions: shuffledQuestions,
    answers: clientAnswers,
    timer: {
      enabled: filter.timerEnabled ?? false,
      duration: filter.timerDuration ?? 30,
      startedAt: batch.startedAt || new Date(),
    },
  };
}

export async function syncBatchData(
  userId: number,
  sessionId: number,
  data: {
    currentBatchIndex: number;
    answers: Record<string, string>;
    currentQuestionIndex: number;
  }
) {
  const session = await prisma.examSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true, status: true, currentBatchIndex: true },
  });

  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (session.status !== "ACTIVE") throw new Error("SESSION_NOT_ACTIVE");

  const batch = await prisma.examBatch.findFirst({
    where: { sessionId, batchIndex: session.currentBatchIndex },
    select: { id: true, submittedAt: true, answers: true },
  });

  if (!batch) throw new Error("BATCH_NOT_FOUND");
  if (batch.submittedAt) throw new Error("BATCH_ALREADY_SUBMITTED");

  const existingAnswers = (batch.answers as Record<string, unknown>) || {};
  const optionMap = existingAnswers.__optionMap__;
  const mergedAnswers: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data.answers)) {
    if (key !== "__optionMap__") {
      mergedAnswers[key] = value;
    }
  }
  if (optionMap) {
    mergedAnswers.__optionMap__ = optionMap;
  }
  await prisma.examBatch.update({
    where: { id: batch.id },
    data: { answers: mergedAnswers as unknown as Prisma.InputJsonValue },
  });

  return { syncedAt: new Date().toISOString() };
}

export async function submitBatch(
  userId: number,
  sessionId: number,
  batchIndex: number,
  answers: Record<string, string>
) {
  const session = await prisma.examSession.findFirst({
    where: { id: sessionId, userId },
    select: {
      id: true,
      status: true,
      currentBatchIndex: true,
      batchSize: true,
      questionOrder: true,
    },
  });

  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (session.status !== "ACTIVE") throw new Error("SESSION_NOT_ACTIVE");
  if (batchIndex !== session.currentBatchIndex) {
    throw new Error("BATCH_NOT_AVAILABLE");
  }

  const batch = await prisma.examBatch.findFirst({
    where: { sessionId, batchIndex },
    select: {
      id: true,
      questionIds: true,
      submittedAt: true,
      answers: true,
    },
  });

  if (!batch) throw new Error("BATCH_NOT_FOUND");
  if (batch.submittedAt) throw new Error("BATCH_ALREADY_SUBMITTED");

  const batchAnswers = (batch.answers as Record<string, unknown>) || {};
  const optionMap =
    (batchAnswers.__optionMap__ as Record<string, number[]>) || {};
  const questionIds = batch.questionIds as number[];
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      questionType: true,
      options: true,
      correctOption: true,
      acceptableAnswers: true,
    },
  });

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  let totalCorrect = 0;
  let totalWrong = 0;
  const gradedAnswers: Record<
    string,
    { userAnswer: string; isCorrect: boolean; correctAnswer: string }
  > = {};

  for (const qId of questionIds) {
    const q = questionMap.get(qId);
    if (!q) continue;

    const userAnswer = answers[String(qId)] ?? "";
    const options = (q.options as string[]) || [];
    let isCorrect = false;
    let correctAnswer = "";

    if (q.questionType === "MULTIPLE_CHOICE") {
      const userIndex = parseInt(userAnswer, 10);
      const permutation = optionMap[String(qId)];
      if (
        permutation &&
        permutation.length === options.length &&
        !isNaN(userIndex) &&
        userIndex >= 0 &&
        userIndex < permutation.length
      ) {
        const originalIndex = permutation[userIndex];
        isCorrect =
          q.correctOption !== null && originalIndex === q.correctOption;
      } else {
        isCorrect =
          !isNaN(userIndex) &&
          q.correctOption !== null &&
          userIndex === q.correctOption;
      }
      correctAnswer =
        q.correctOption !== null && options[q.correctOption]
          ? options[q.correctOption]
          : "";
    } else if (q.questionType === "SHORT_ANSWER") {
      const normalized = userAnswer.trim().toLowerCase();
      isCorrect = q.acceptableAnswers.some(
        (a) => a.trim().toLowerCase() === normalized
      );
      correctAnswer = q.acceptableAnswers[0] || "";
    } else if (q.questionType === "ESSAY") {
      const normalizedUser = parseFloat(userAnswer.replace(",", "."));
      isCorrect =
        !isNaN(normalizedUser) &&
        q.acceptableAnswers.some((a) => {
          const normalizedAccepted = parseFloat(a.replace(",", "."));
          return (
            !isNaN(normalizedAccepted) &&
            normalizedAccepted === normalizedUser
          );
        });
      correctAnswer = q.acceptableAnswers[0] || "";
    }

    if (isCorrect) {
      totalCorrect++;
    } else {
      totalWrong++;
    }

    gradedAnswers[String(qId)] = { userAnswer, isCorrect, correctAnswer };
  }

  const totalQuestions = questionIds.length;
  const score = totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100 * 100) / 100
    : 0;

  const questionsWithContent = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      content: true,
      imageUrl: true,
      questionType: true,
      options: true,
      explanation: true,
    },
  });
  const questionContentMap = new Map(questionsWithContent.map((q) => [q.id, q]));

  const cleanAnswers: Record<string, string> = {};
  for (const [key, value] of Object.entries(answers)) {
    if (key !== "__optionMap__") {
      cleanAnswers[key] = value;
    }
  }

  await prisma.examBatch.update({
    where: { id: batch.id },
    data: {
      answers: gradedAnswers as unknown as Prisma.InputJsonValue,
      score,
      totalCorrect,
      totalWrong,
      submittedAt: new Date(),
    },
  });

  const isLastBatch = batchIndex >= session.questionOrder.length / session.batchSize - 1;

  let sessionStatus = "ACTIVE";
  if (isLastBatch) {
    await prisma.examSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" as ExamSessionStatus },
    });
    sessionStatus = "COMPLETED";
  } else {
    await prisma.examSession.update({
      where: { id: sessionId },
      data: { currentBatchIndex: batchIndex + 1 },
    });
  }

  const allBatches = await prisma.examBatch.findMany({
    where: { sessionId },
    orderBy: { batchIndex: "asc" },
    select: {
      batchIndex: true,
      score: true,
      totalCorrect: true,
      totalWrong: true,
      submittedAt: true,
    },
  });

  return {
    batchIndex,
    score,
    totalCorrect,
    totalWrong,
    totalQuestions,
    gradedAnswers,
    isLastBatch,
    sessionStatus,
    questions: questionIds.map((qId) => {
      const q = questionContentMap.get(qId);
      if (!q) return null;
      return {
        id: q.id,
        content: q.content,
        imageUrl: q.imageUrl,
        questionType: q.questionType as string,
        options: (q.options as string[]) || [],
      };
    }).filter(Boolean),
    explanations: Object.fromEntries(
      questionIds.map((qId) => {
        const q = questionContentMap.get(qId);
        return [String(qId), q?.explanation || ""];
      })
    ),
    allBatchScores: allBatches
      .filter((b) => b.submittedAt !== null || b.batchIndex === batchIndex)
      .map((b) => ({
        batchIndex: b.batchIndex,
        score: b.score,
        totalCorrect: b.totalCorrect,
        totalWrong: b.totalWrong,
      })),
  };
}
