import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const STREAK_MILESTONES = [3, 7, 14, 30] as const;

interface SessionFilter {
  tingkat: string;
  level: string;
  matpels: string[];
  timerEnabled: boolean;
  timerDuration: number;
}

interface SessionListItem {
  id: number;
  createdAt: string;
  filter: { tingkat: string; level: string; matpels: string[] };
  totalQuestions: number;
  batchSize: number;
  status: string;
  avgScore: number;
  batchesSubmitted: number;
  totalBatches: number;
}

interface SessionDetailBatch {
  batchIndex: number;
  questionCount: number;
  score: number;
  totalCorrect: number;
  totalWrong: number;
  submittedAt: string | null;
  answers: Record<string, unknown>;
}

interface SessionDetail {
  id: number;
  createdAt: string;
  filter: { tingkat: string; level: string; matpels: string[] };
  totalQuestions: number;
  batchSize: number;
  status: string;
  currentBatchIndex: number;
  timerEnabled: boolean;
  timerDuration: number;
  avgScore: number;
  batches: SessionDetailBatch[];
}

interface BatchScoreItem {
  index: number;
  batchIndex: number;
  score: number;
  submittedAt: string;
  sessionDate: string;
  sessionFilter: { tingkat: string; level: string; matpels: string[] };
}

interface AnalyticsData {
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
  batchScores: BatchScoreItem[];
}

interface StreakData {
  currentStreak: number;
  lastActiveDate: string | null;
  milestones: Record<string, boolean>;
}

interface StudyStatItem {
  matpel: string;
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
}

interface AnalyticsFilter {
  tingkat?: string;
  level?: string;
  matpel?: string;
}

function parseFilter(raw: unknown): SessionFilter {
  const obj = raw as Record<string, unknown>;
  return {
    tingkat: String(obj.tingkat ?? ""),
    level: String(obj.level ?? ""),
    matpels: Array.isArray(obj.matpels) ? (obj.matpels as string[]) : [],
    timerEnabled: typeof obj.timerEnabled === "boolean" ? obj.timerEnabled : false,
    timerDuration: typeof obj.timerDuration === "number" ? obj.timerDuration : 30,
  };
}

function buildSessionFilter(filter: SessionFilter) {
  return {
    tingkat: filter.tingkat,
    level: filter.level,
    matpels: filter.matpels,
  };
}

export async function getSessions(
  userId: number,
  page: number,
  limit: number,
  status?: string
): Promise<{ sessions: SessionListItem[]; pagination: Pagination }> {
  const where: Prisma.ExamSessionWhereInput = { userId };
  if (status) {
    where.status = status as Prisma.EnumExamSessionStatusFilter;
  }

  const [total, sessions] = await Promise.all([
    prisma.examSession.count({ where }),
    prisma.examSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        batches: {
          select: {
            batchIndex: true,
            score: true,
            submittedAt: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  const result: SessionListItem[] = sessions.map((s) => {
    const submittedBatches = s.batches.filter((b) => b.submittedAt !== null);
    const avgScore =
      submittedBatches.length > 0
        ? submittedBatches.reduce((sum, b) => sum + b.score, 0) /
          submittedBatches.length
        : 0;

    return {
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      filter: buildSessionFilter(parseFilter(s.filter)),
      totalQuestions: s.totalQuestions,
      batchSize: s.batchSize,
      status: s.status,
      avgScore: Math.round(avgScore * 100) / 100,
      batchesSubmitted: submittedBatches.length,
      totalBatches: s.batches.length,
    };
  });

  return {
    sessions: result,
    pagination: { page, limit, total, totalPages },
  };
}

export async function getSessionDetail(
  userId: number,
  sessionId: number
): Promise<SessionDetail | null> {
  const session = await prisma.examSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      batches: {
        orderBy: { batchIndex: "asc" },
        select: {
          batchIndex: true,
          questionIds: true,
          answers: true,
          score: true,
          totalCorrect: true,
          totalWrong: true,
          submittedAt: true,
        },
      },
    },
  });

  if (!session) return null;

  const filter = parseFilter(session.filter);
  const submittedBatches = session.batches.filter(
    (b) => b.submittedAt !== null
  );
  const avgScore =
    submittedBatches.length > 0
      ? submittedBatches.reduce((sum, b) => sum + b.score, 0) /
        submittedBatches.length
      : 0;

  const batches: SessionDetailBatch[] = session.batches.map((b) => ({
    batchIndex: b.batchIndex,
    questionCount: (b.questionIds as number[]).length,
    score: b.score,
    totalCorrect: b.totalCorrect,
    totalWrong: b.totalWrong,
    submittedAt: b.submittedAt ? b.submittedAt.toISOString() : null,
    answers:
      b.submittedAt !== null
        ? (b.answers as Record<string, unknown>)
        : {},
  }));

  return {
    id: session.id,
    createdAt: session.createdAt.toISOString(),
    filter: buildSessionFilter(filter),
    totalQuestions: session.totalQuestions,
    batchSize: session.batchSize,
    status: session.status,
    currentBatchIndex: session.currentBatchIndex,
    timerEnabled: filter.timerEnabled,
    timerDuration: filter.timerDuration,
    avgScore: Math.round(avgScore * 100) / 100,
    batches,
  };
}

export async function getAnalytics(
  userId: number,
  filter?: AnalyticsFilter
): Promise<AnalyticsData> {
  const sessionWhere: Prisma.ExamSessionWhereInput = { userId };

  const jsonConditions: Prisma.ExamSessionWhereInput["filter"][] = [];
  if (filter?.tingkat) {
    jsonConditions.push({ path: ["tingkat"], equals: filter.tingkat });
  }
  if (filter?.level) {
    jsonConditions.push({ path: ["level"], equals: filter.level });
  }
  if (filter?.matpel) {
    jsonConditions.push({ path: ["matpels"], array_contains: filter.matpel });
  }
  if (jsonConditions.length > 0) {
    sessionWhere.AND = jsonConditions.map((f) => ({ filter: f }));
  }

  const sessions = await prisma.examSession.findMany({
    where: sessionWhere,
    select: {
      id: true,
      createdAt: true,
      filter: true,
      batches: {
        where: { submittedAt: { not: null } },
        select: {
          batchIndex: true,
          score: true,
          totalCorrect: true,
          totalWrong: true,
          submittedAt: true,
        },
        orderBy: { submittedAt: "asc" },
      },
    },
  });

  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalWrong = 0;
  const batchScores: BatchScoreItem[] = [];

  let runningIndex = 0;
  for (const session of sessions) {
    const sessionFilter = parseFilter(session.filter);
    for (const batch of session.batches) {
      totalQuestions += batch.totalCorrect + batch.totalWrong;
      totalCorrect += batch.totalCorrect;
      totalWrong += batch.totalWrong;

      batchScores.push({
        index: runningIndex++,
        batchIndex: batch.batchIndex,
        score: batch.score,
        submittedAt: batch.submittedAt!.toISOString(),
        sessionDate: session.createdAt.toISOString(),
        sessionFilter: buildSessionFilter(sessionFilter),
      });
    }
  }

  const accuracy =
    totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100 * 100) / 100
      : 0;

  return {
    totalQuestions,
    totalCorrect,
    totalWrong,
    accuracy,
    batchScores,
  };
}

export async function getStreak(userId: number): Promise<StreakData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streak: true, lastActiveDate: true },
  });

  if (!user) {
    return {
      currentStreak: 0,
      lastActiveDate: null,
      milestones: Object.fromEntries(
        STREAK_MILESTONES.map((m) => [String(m), false])
      ),
    };
  }

  const milestones: Record<string, boolean> = {};
  for (const m of STREAK_MILESTONES) {
    milestones[String(m)] = user.streak >= m;
  }

  return {
    currentStreak: user.streak,
    lastActiveDate: user.lastActiveDate
      ? user.lastActiveDate.toISOString()
      : null,
    milestones,
  };
}

export async function getStudyStats(
  userId: number,
  filter?: { tingkat?: string; level?: string }
): Promise<StudyStatItem[]> {
  const questionWhere: string[] = [];
  const params: unknown[] = [userId];
  let paramIdx = 2;

  let query = `
    SELECT q."matpel",
           COUNT(*)::int AS "totalAttempts",
           COUNT(CASE WHEN sa."isCorrect" THEN 1 END)::int AS "totalCorrect"
    FROM "StudyAttempt" sa
    JOIN "Question" q ON sa."questionId" = q.id
    WHERE sa."userId" = $1
  `;

  if (filter?.tingkat) {
    query += ` AND q."tingkat" = $${paramIdx}`;
    params.push(filter.tingkat);
    paramIdx++;
  }

  if (filter?.level) {
    query += ` AND q."level" = $${paramIdx}`;
    params.push(filter.level);
    paramIdx++;
  }

  query += ` GROUP BY q."matpel" ORDER BY "totalAttempts" DESC`;

  const rows = await prisma.$queryRawUnsafe<
    { matpel: string; totalAttempts: number; totalCorrect: number }[]
  >(query, ...params);

  return rows.map((row) => ({
    matpel: row.matpel,
    totalAttempts: row.totalAttempts,
    totalCorrect: row.totalCorrect,
    accuracy:
      row.totalAttempts > 0
        ? Math.round((row.totalCorrect / row.totalAttempts) * 100 * 100) / 100
        : 0,
  }));
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
