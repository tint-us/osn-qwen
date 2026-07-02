"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionDisplay } from "@/components/shared/QuestionDisplay";
import { AnswerInput } from "@/components/study/AnswerInput";
import { FeedbackPanel } from "@/components/study/FeedbackPanel";

interface QuestionCardProps {
  question: {
    id: number;
    questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
    content: string;
    imageUrl: string | null;
    options: string[];
    acceptableAnswers: string[];
    explanation: string;
  };
  isAnswered: boolean;
  isSubmitting: boolean;
  result?: {
    questionId: number;
    userAnswer: string;
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
  };
  onSubmit: (answer: string) => void;
  onNext: () => void;
  isLast: boolean;
}

export function QuestionCard({
  question,
  isAnswered,
  isSubmitting,
  result,
  onSubmit,
  onNext,
  isLast,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  function handleSubmit() {
    if (selectedAnswer === null || isSubmitting) return;
    onSubmit(selectedAnswer);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <Badge variant="secondary" className="mb-2">
            {question.questionType === "MULTIPLE_CHOICE"
              ? "Pilihan Ganda"
              : question.questionType === "SHORT_ANSWER"
              ? "Isian Singkat"
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
          <AnswerInput
            type={question.questionType}
            options={question.options}
            value={selectedAnswer}
            onChange={setSelectedAnswer}
            disabled={isAnswered}
          />

          {!isAnswered ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Memeriksa..." : "Submit Jawaban"}
            </Button>
          ) : result ? (
            <FeedbackPanel
              result={result}
              onNext={onNext}
              isLast={isLast}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
