"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface StreakMilestonePopupProps {
  currentStreak: number;
  milestones: Record<string, boolean>;
}

const MILESTONE_MESSAGES: Record<number, string> = {
  3: "Hebat! Kamu sudah belajar 3 hari berturut-turut. Teruskan!",
  7: "Luar biasa! Seminggu penuh konsisten. Kamu hebat!",
  14: "Dua minggu beruntun! Dedikasimu luar biasa!",
  30: "Sebulan penuh! Kamu adalah juara sejati!",
};

const MILESTONE_EMOJIS: Record<number, string> = {
  3: "⭐",
  7: "🎉",
  14: "🏆",
  30: "👑",
};

export function StreakMilestonePopup({
  currentStreak,
  milestones,
}: StreakMilestonePopupProps) {
  const [show, setShow] = useState(false);
  const [milestone, setMilestone] = useState<number | null>(null);

  useEffect(() => {
    if (currentStreak === 0) return;

    const matchedMilestones = Object.entries(milestones)
      .filter(([_, achieved]) => achieved)
      .map(([day]) => Number(day))
      .sort((a, b) => b - a);

    if (matchedMilestones.length === 0) return;

    const latestMilestone = matchedMilestones[0];
    const storageKey = `streak-milestone-${latestMilestone}-shown`;

    if (currentStreak === latestMilestone && !localStorage.getItem(storageKey)) {
      setMilestone(latestMilestone);
      setShow(true);
      localStorage.setItem(storageKey, "true");
    }
  }, [currentStreak, milestones]);

  if (!show || milestone === null) return null;

  const message = MILESTONE_MESSAGES[milestone] ?? "Selamat atas pencapaianmu!";
  const emoji = MILESTONE_EMOJIS[milestone] ?? "🎉";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => setShow(false)}
    >
      <div
        className="relative w-full max-w-sm animate-[scaleIn_0.3s_ease-out] rounded-2xl bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 p-1 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl bg-background p-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-yellow-100 text-5xl dark:from-orange-950/40 dark:to-yellow-950/30">
            {emoji}
          </div>
          <h2 className="mb-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
            Milestone Tercapai!
          </h2>
          <p className="mb-1 text-4xl font-bold">{currentStreak} Hari</p>
          <p className="mb-6 text-sm text-muted-foreground">{message}</p>
          <Button
            className="w-full bg-orange-500 text-white hover:bg-orange-600"
            onClick={() => setShow(false)}
          >
            Lanjut Belajar!
          </Button>
        </div>
      </div>
    </div>
  );
}
