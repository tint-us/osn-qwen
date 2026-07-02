"use client";

interface StudyProgressProps {
  currentIndex: number;
  total: number;
  correctCount: number;
  wrongCount: number;
}

export function StudyProgress({
  currentIndex,
  total,
  correctCount,
  wrongCount,
}: StudyProgressProps) {
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium">
          Soal {currentIndex + 1} dari {total}
        </span>
        <span className="text-muted-foreground">
          Benar: {correctCount} | Salah: {wrongCount}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
