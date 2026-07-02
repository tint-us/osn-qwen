import { prisma } from "@/lib/prisma";

export interface DashboardStats {
  totalQuestions: number;
  totalUsers: number;
  totalSiswa: number;
  totalAdmins: number;
  totalExamSessions: number;
  totalStudyAttempts: number;
  activeSessions: number;
  questionsByTingkat: { tingkat: string; count: number }[];
  recentUsers: {
    id: number;
    name: string;
    username: string;
    role: string;
    createdAt: string;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalQuestions,
    totalUsers,
    totalSiswa,
    totalAdmins,
    totalExamSessions,
    totalStudyAttempts,
    activeSessions,
    questionsByTingkatRaw,
    recentUsersRaw,
  ] = await Promise.all([
    prisma.question.count(),
    prisma.user.count(),
    prisma.user.count({ where: { role: "SISWA" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.examSession.count(),
    prisma.studyAttempt.count(),
    prisma.examSession.count({ where: { status: "ACTIVE" } }),
    prisma.question.groupBy({
      by: ["tingkat"],
      _count: true,
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    totalQuestions,
    totalUsers,
    totalSiswa,
    totalAdmins,
    totalExamSessions,
    totalStudyAttempts,
    activeSessions,
    questionsByTingkat: questionsByTingkatRaw.map((q) => ({
      tingkat: q.tingkat,
      count: q._count,
    })),
    recentUsers: recentUsersRaw.map((u) => ({
      ...u,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    })),
  };
}

export interface DBHealthStatus {
  connected: boolean;
  latency: number | null;
  error: string | null;
  stats: {
    totalQuestions: number;
    totalUsers: number;
    totalExamSessions: number;
  };
}

export async function getDBHealth(): Promise<DBHealthStatus> {
  const start = Date.now();

  try {
    const [totalQuestions, totalUsers, totalExamSessions] = await Promise.all([
      prisma.question.count(),
      prisma.user.count(),
      prisma.examSession.count(),
    ]);

    const latency = Date.now() - start;

    return {
      connected: true,
      latency,
      error: null,
      stats: { totalQuestions, totalUsers, totalExamSessions },
    };
  } catch (error) {
    const latency = Date.now() - start;
    const message =
      error instanceof Error ? error.message : "Unknown database error";

    return {
      connected: false,
      latency,
      error: message,
      stats: {
        totalQuestions: 0,
        totalUsers: 0,
        totalExamSessions: 0,
      },
    };
  }
}
