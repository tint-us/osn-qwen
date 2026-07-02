"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionDisplay } from "@/components/shared/QuestionDisplay";
import { Badge } from "@/components/ui/badge";

interface ExamQuestionProps {
  question: {
    id: number;
    questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
    content: string;
    imageUrl: string | null;
    options: string[];
  };
  index: number;
  total: number;
  batchIndex: number;
  totalBatches: number;
  answer: string;
  onAnswer: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export function ExamQuestion({
  question,
  index,
  total,
  batchIndex,
  totalBatches,
  answer,
  onAnswer,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
}: ExamQuestionProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            Soal {index + 1} dari {total} (Batch {batchIndex + 1}/{totalBatches})
          </span>
          <Badge variant="secondary">
            {question.questionType === "MULTIPLE_CHOICE"
              ? "PG"
              : question.questionType === "SHORT_ANSWER"
              ? "Isian"
              : "Essay"}
          </Badge>
        </div>

        <div className="mb-6 text-base leading-relaxed">
          <QuestionDisplay content={question.content} />
        </div>

        {question.imageUrl && (
          <div className="mb-6">
            <img
              src={question.imageUrl}
              alt="Gambar soal"
              className="max-w-full rounded-lg border"
              loading="lazy"
            />
          </div>
        )}

        <div className="space-y-4">
          {question.questionType === "MULTIPLE_CHOICE" && (
            <div className="space-y-2">
              {question.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent ${
                    answer === String(i) ? "border-primary bg-accent" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="exam-mc"
                    value={i}
                    checked={answer === String(i)}
                    onChange={() => onAnswer(String(i))}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {question.questionType === "SHORT_ANSWER" && (
            <input
              type="text"
              value={answer || ""}
              onChange={(e) => onAnswer(e.target.value)}
              placeholder="Ketik jawaban..."
              className="w-full rounded-lg border border-input px-3 py-2"
            />
          )}

          {question.questionType === "ESSAY" && (
            <input
              type="number"
              step="any"
              value={answer || ""}
              onChange={(e) => onAnswer(e.target.value)}
              placeholder="Masukkan angka jawaban..."
              className="w-full rounded-lg border border-input px-3 py-2"
            />
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={onPrev}
              disabled={!canGoPrev}
            >
              ← Sebelumnya
            </Button>
            <Button
              variant="outline"
              onClick={onNext}
              disabled={!canGoNext}
            >
              Berikutnya →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
