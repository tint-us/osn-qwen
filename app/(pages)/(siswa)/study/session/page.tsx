"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStudyStore } from "@/store/study-store";
import { QuestionCard } from "@/components/study/QuestionCard";
import { StudyProgress } from "@/components/study/StudyProgress";
import { StudySummary } from "@/components/study/StudySummary";
import { Button } from "@/components/ui/button";

export default function StudySessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const {
    questions,
    currentIndex,
    results,
    isAnswered,
    isSubmitting,
    isFinished,
    setQuestions,
    setSubmitting,
    addResult,
    nextQuestion,
    reset,
  } = useStudyStore();

  useEffect(() => {
    const tingkat = searchParams.get("tingkat");
    const level = searchParams.get("level");
    const matpel = searchParams.get("matpel");

    if (!tingkat || !level || !matpel) {
      router.push("/study");
      return;
    }

    async function fetchQuestions() {
      try {
        const res = await fetch(
          `/api/questions?tingkat=${tingkat}&level=${level}&matpel=${matpel}`
        );
        const data = await res.json();

        if (!data.success) {
          setError(data.error || "Gagal memuat soal");
          setLoading(false);
          return;
        }

        if (data.data.length === 0) {
          setError("Belum ada soal untuk filter ini");
          setLoading(false);
          return;
        }

        setQuestions(data.data);
        setLoading(false);
      } catch {
        setError("Koneksi terputus. Coba lagi.");
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [searchParams, router, setQuestions]);

  async function handleSubmit(answer: string) {
    const question = questions[currentIndex];
    if (!question) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/study/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          userAnswer: answer,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setSubmitting(false);
        return;
      }

      addResult({
        questionId: question.id,
        userAnswer: answer,
        isCorrect: data.data.isCorrect,
        correctAnswer: data.data.correctAnswer,
        explanation: data.data.explanation,
      });
    } catch {
      setSubmitting(false);
    }
  }

  function handleNext() {
    nextQuestion();
  }

  function handleBackToDashboard() {
    reset();
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Memuat soal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.push("/study")}>Ubah Filter</Button>
      </div>
    );
  }

  if (isFinished) {
    const correct = results.filter((r) => r.isCorrect).length;
    const wrong = results.length - correct;
    return (
      <div className="py-8">
        <StudySummary
          total={results.length}
          correct={correct}
          wrong={wrong}
          onBackToDashboard={handleBackToDashboard}
        />
      </div>
    );
  }

  const question = questions[currentIndex];
  const currentResult = results[currentIndex];
  const correctCount = results.filter((r) => r.isCorrect).length;
  const wrongCount = results.length - correctCount;

  return (
    <div className="py-4 max-w-3xl mx-auto">
      <StudyProgress
        currentIndex={currentIndex}
        total={questions.length}
        correctCount={correctCount}
        wrongCount={wrongCount}
      />

      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            reset();
            router.push("/dashboard");
          }}
        >
          ← Keluar
        </Button>
      </div>

      <QuestionCard
        question={question}
        isAnswered={isAnswered}
        isSubmitting={isSubmitting}
        result={currentResult}
        onSubmit={handleSubmit}
        onNext={handleNext}
        isLast={currentIndex + 1 >= questions.length}
      />
    </div>
  );
}
