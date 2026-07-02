"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionDisplay } from "@/components/shared/QuestionDisplay";

interface GradedAnswer {
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
}

interface BatchReviewProps {
  questions: {
    id: number;
    content: string;
    imageUrl: string | null;
    questionType: string;
    options: string[];
  }[];
  gradedAnswers: Record<string, GradedAnswer>;
  explanations: Record<string, string>;
}

export function BatchReview({
  questions,
  gradedAnswers,
  explanations,
}: BatchReviewProps) {
  return (
    <div className="space-y-4">
      {questions.map((q, i) => {
        const graded = gradedAnswers[String(q.id)];
        if (!graded) return null;

        return (
          <Card
            key={q.id}
            className={
              graded.isCorrect ? "border-green-500" : "border-red-500"
            }
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <span
                  className={`text-xl ${graded.isCorrect ? "text-green-600" : "text-red-600"}`}
                >
                  {graded.isCorrect ? "✓" : "✗"}
                </span>
                <div className="flex-1 space-y-2">
                  <div className="text-sm font-medium">
                    Soal {i + 1}
                  </div>
                  <div className="text-base">
                    <QuestionDisplay content={q.content} />
                  </div>

                  {q.imageUrl && (
                    <img
                      src={q.imageUrl}
                      alt="Gambar soal"
                      className="max-w-full rounded-lg border"
                      loading="lazy"
                    />
                  )}

                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Jawaban Anda: </span>
                      <span className={graded.isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {graded.userAnswer || "(kosong)"}
                      </span>
                    </p>
                    {!graded.isCorrect && (
                      <p>
                        <span className="text-muted-foreground">Jawaban Benar: </span>
                        <span className="font-medium">{graded.correctAnswer}</span>
                      </p>
                    )}
                    <div className="pt-2 text-muted-foreground">
                      <p className="font-medium text-foreground">Pembahasan:</p>
                      <div className="mt-1">
                        <QuestionDisplay content={explanations[String(q.id)] || ""} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
