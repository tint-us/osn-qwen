"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/exam-store";
import { ExamQuestion } from "@/components/exam/ExamQuestion";
import { ExamNavigation } from "@/components/exam/ExamNavigation";
import { BatchTimer } from "@/components/exam/BatchTimer";
import { BatchReview } from "@/components/exam/BatchReview";
import { BatchAnalytics } from "@/components/exam/BatchAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Phase = "loading" | "answering" | "submitting" | "review" | "completed";

interface BatchQuestion {
  id: number;
  questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
  content: string;
  imageUrl: string | null;
  options: string[];
}

interface SubmitResult {
  batchIndex: number;
  score: number;
  totalCorrect: number;
  totalWrong: number;
  totalQuestions: number;
  gradedAnswers: Record<
    string,
    { userAnswer: string; isCorrect: boolean; correctAnswer: string }
  >;
  isLastBatch: boolean;
  sessionStatus: string;
  questions: BatchQuestion[];
  explanations: Record<string, string>;
  allBatchScores: {
    batchIndex: number;
    score: number;
    totalCorrect: number;
    totalWrong: number;
  }[];
}

const SYNC_INTERVAL_MS = 30_000;

export default function ExamSessionPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [batchIndex, setBatchIndex] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [questions, setQuestions] = useState<BatchQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(30);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef(answers);
  const currentIndexRef = useRef(currentIndex);
  const sessionIdRef = useRef(sessionId);
  const batchIndexRef = useRef(batchIndex);

  answersRef.current = answers;
  currentIndexRef.current = currentIndex;
  sessionIdRef.current = sessionId;
  batchIndexRef.current = batchIndex;

  const loadBatch = useCallback(
    async (sId: number, bIdx: number) => {
      setPhase("loading");
      setError("");
      try {
        const res = await fetch(
          `/api/exam/sessions/${sId}/batch/${bIdx}`,
          { method: "GET" }
        );
        const data = await res.json();

        if (!data.success) {
          setError(data.error || "Gagal memuat batch");
          setPhase("loading");
          return;
        }

        const batch = data.data;
        setQuestions(batch.questions);
        setAnswers(batch.answers || {});
        setCurrentIndex(0);
        setBatchIndex(batch.batchIndex);
        setTimerEnabled(batch.timer.enabled);
        setTimerDuration(batch.timer.duration);
        setStartedAt(batch.timer.startedAt);
        setPhase("answering");
      } catch {
        setError("Koneksi terputus. Coba lagi.");
        setPhase("loading");
      }
    },
    []
  );

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/exam/sessions/active");
        const data = await res.json();

        if (!data.success || !data.data) {
          router.push("/exam");
          return;
        }

        const s = data.data;
        setSessionId(s.id);
        setTotalBatches(s.totalBatches);
        await loadBatch(s.id, s.currentBatchIndex);
      } catch {
        setError("Gagal memuat sesi");
        setPhase("loading");
      }
    }
    init();
  }, [router, loadBatch]);

  const doSync = useCallback(async () => {
    const sId = sessionIdRef.current;
    if (!sId) return;
    try {
      await fetch(`/api/exam/sessions/${sId}/sync`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentBatchIndex: batchIndexRef.current,
          answers: answersRef.current,
          currentQuestionIndex: currentIndexRef.current,
        }),
      });
    } catch {
      // silent fail on sync
    }
  }, []);

  useEffect(() => {
    if (phase !== "answering") return;

    syncTimerRef.current = setInterval(doSync, SYNC_INTERVAL_MS);
    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [phase, doSync]);

  useEffect(() => {
    function handleBeforeUnload() {
      if (phase === "answering" && sessionIdRef.current) {
        navigator.sendBeacon(
          `/api/exam/sessions/${sessionIdRef.current}/sync`,
          JSON.stringify({
            currentBatchIndex: batchIndexRef.current,
            answers: answersRef.current,
            currentQuestionIndex: currentIndexRef.current,
          })
        );
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase]);

  async function handleSubmit() {
    if (!sessionId) return;
    setPhase("submitting");
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);

    await doSync();

    try {
      const res = await fetch(
        `/api/exam/sessions/${sessionId}/batch/${batchIndex}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        }
      );
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Gagal submit batch");
        setPhase("answering");
        return;
      }

      setSubmitResult(data.data);
      setPhase("review");
    } catch {
      setError("Koneksi terputus saat submit. Coba lagi.");
      setPhase("answering");
    }
  }

  function handleNextBatch() {
    if (!sessionId || !submitResult) return;
    if (submitResult.isLastBatch) {
      setPhase("completed");
    } else {
      setSubmitResult(null);
      loadBatch(sessionId, batchIndex + 1);
    }
  }

  function handleExit() {
    doSync();
    router.push("/exam");
  }

  function handleAnswer(value: string) {
    const q = questions[currentIndex];
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [String(q.id)]: value }));
  }

  if (phase === "loading" && !error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Memuat soal...</p>
      </div>
    );
  }

  if (error && phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.push("/exam")}>Kembali</Button>
      </div>
    );
  }

  if (phase === "completed") {
    return (
      <div className="py-8 max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <h2 className="text-2xl font-bold">Ujian Selesai! 🎉</h2>
            <p className="text-muted-foreground">
              Anda telah menyelesaikan semua batch dalam sesi ini.
            </p>
            {submitResult && (
              <div className="space-y-2">
                <p className="text-lg">
                  Skor batch terakhir:{" "}
                  <span className="font-bold">{submitResult.score}</span>
                </p>
                <BatchAnalytics
                  batchScores={submitResult.allBatchScores}
                  currentBatchIndex={submitResult.batchIndex}
                />
              </div>
            )}
            <Button onClick={() => router.push("/dashboard")}>
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "review" && submitResult) {
    return (
      <div className="py-4 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Hasil Batch {batchIndex + 1}</h2>
            <p className="text-sm text-muted-foreground">
              Skor: {submitResult.score} | Benar: {submitResult.totalCorrect} |
              Salah: {submitResult.totalWrong}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleExit}>
            Keluar
          </Button>
        </div>

        <BatchAnalytics
          batchScores={submitResult.allBatchScores}
          currentBatchIndex={submitResult.batchIndex}
        />

        <BatchReview
          questions={submitResult.questions}
          gradedAnswers={submitResult.gradedAnswers}
          explanations={submitResult.explanations}
        />

        <div className="flex justify-center">
          <Button onClick={handleNextBatch} size="lg">
            {submitResult.isLastBatch
              ? "Lihat Hasil Akhir"
              : "Lanjut ke Batch Berikutnya →"}
          </Button>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const answeredCount = Object.values(answers).filter(
    (v) => v && v !== ""
  ).length;

  return (
    <div className="py-4 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleExit}>
          ← Keluar
        </Button>
        {timerEnabled && (
          <BatchTimer
            enabled={timerEnabled}
            durationMinutes={timerDuration}
            startedAt={startedAt}
            onExpire={handleSubmit}
          />
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Terjawab: {answeredCount} / {questions.length}
      </div>

      {question && (
        <ExamQuestion
          question={question}
          index={currentIndex}
          total={questions.length}
          batchIndex={batchIndex}
          totalBatches={totalBatches}
          answer={answers[String(question.id)] || ""}
          onAnswer={handleAnswer}
          onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          onNext={() =>
            setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
          }
          canGoPrev={currentIndex > 0}
          canGoNext={currentIndex < questions.length - 1}
        />
      )}

      <ExamNavigation
        total={questions.length}
        currentIndex={currentIndex}
        answers={answers}
        questions={questions}
        onJump={setCurrentIndex}
      />

      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={phase === "submitting"}
        >
          {phase === "submitting" ? "Menyimpan..." : "Submit Batch"}
        </Button>
      </div>
    </div>
  );
}
