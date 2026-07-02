"use client";

import { Button } from "@/components/ui/button";
import { QuestionDisplay } from "@/components/shared/QuestionDisplay";

interface FeedbackPanelProps {
  result: {
    questionId: number;
    userAnswer: string;
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
  };
  onNext: () => void;
  isLast: boolean;
}

export function FeedbackPanel({ result, onNext, isLast }: FeedbackPanelProps) {
  return (
    <div className="mt-4 space-y-3 rounded-lg border p-4 animate-in fade-in duration-300">
      <div
        className={`rounded-md px-4 py-3 text-center font-semibold ${
          result.isCorrect
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {result.isCorrect ? "✅ BENAR" : "❌ SALAH"}
      </div>

      {!result.isCorrect && (
        <p className="text-sm">
          <span className="font-semibold">Jawaban benar: </span>
          {result.correctAnswer}
        </p>
      )}

      <div className="space-y-1">
        <p className="text-sm font-semibold">Pembahasan:</p>
        <div className="text-sm text-muted-foreground">
          <QuestionDisplay content={result.explanation} />
        </div>
      </div>

      <Button onClick={onNext} className="w-full">
        {isLast ? "Selesai" : "Soal Berikutnya"}
      </Button>
    </div>
  );
}
