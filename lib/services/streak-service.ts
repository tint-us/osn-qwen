import { prisma } from "@/lib/prisma";

function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getStartOfYesterday(): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1
  );
}

function isSameDay(a: Date | null, b: Date): boolean {
  if (!a) return false;
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export async function updateStreak(userId: number) {
  const today = getStartOfToday();

  const existing = await prisma.streakLog.findUnique({
    where: {
      userId_date: { userId, date: today },
    },
    select: { id: true },
  });

  if (existing) return;

  await prisma.streakLog.create({
    data: { userId, date: today },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streak: true, lastActiveDate: true },
  });

  if (!user) return;

  const yesterday = getStartOfYesterday();
  const wasActiveYesterday = isSameDay(user.lastActiveDate, yesterday);

  await prisma.user.update({
    where: { id: userId },
    data: {
      streak: wasActiveYesterday ? user.streak + 1 : 1,
      lastActiveDate: today,
    },
  });
}
