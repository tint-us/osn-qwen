"use client";

interface ExamNavigationProps {
  total: number;
  currentIndex: number;
  answers: Record<string, string>;
  questions: { id: number }[];
  onJump: (index: number) => void;
}

export function ExamNavigation({
  total,
  currentIndex,
  answers,
  questions,
  onJump,
}: ExamNavigationProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => {
        const q = questions[i];
        const isAnswered = q && answers[String(q.id)] && answers[String(q.id)] !== "";
        const isCurrent = i === currentIndex;

        return (
          <button
            key={i}
            onClick={() => onJump(i)}
            className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${
              isCurrent
                ? "border-primary bg-primary text-primary-foreground"
                : isAnswered
                ? "border-green-500 bg-green-100 text-green-700"
                : "hover:bg-accent"
            }`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
