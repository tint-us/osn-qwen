"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SessionDetailBatch {
  batchIndex: number;
  questionCount: number;
  score: number;
  totalCorrect: number;
  totalWrong: number;
  submittedAt: string | null;
  answers: Record<string, unknown>;
}

interface SessionDetailData {
  id: number;
  createdAt: string;
  filter: {
    tingkat: string;
    level: string;
    matpels: string[];
  };
  totalQuestions: number;
  batchSize: number;
  status: string;
  currentBatchIndex: number;
  timerEnabled: boolean;
  timerDuration: number;
  avgScore: number;
  batches: SessionDetailBatch[];
}

interface SessionDetailModalProps {
  sessionId: number | null;
  onClose: () => void;
}

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "outline"
> = {
  COMPLETED: "success",
  ACTIVE: "default",
  ABANDONED: "secondary",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SessionDetailModal({
  sessionId,
  onClose,
}: SessionDetailModalProps) {
  const [data, setData] = useState<SessionDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<number | null>(null);

  useEffect(() => {
    if (sessionId === null) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/history/sessions/${sessionId}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.success) {
          setError(json.error || "Gagal memuat data");
          return;
        }
        setData(json.data);
      })
      .catch(() => {
        if (!cancelled) setError("Gagal terhubung ke server");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (sessionId === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b bg-background p-4">
          <h2 className="text-lg font-semibold">Detail Sesi Exam</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-destructive">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Session info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{formatDate(data.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={STATUS_VARIANTS[data.status] ?? "outline"}>
                    {data.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Tingkat & Level</p>
                  <p className="font-medium">
                    {data.filter.tingkat} · {data.filter.level}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mata Pelajaran</p>
                  <p className="font-medium">
                    {data.filter.matpels.join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Soal</p>
                  <p className="font-medium">{data.totalQuestions}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Batch Size</p>
                  <p className="font-medium">{data.batchSize} soal/batch</p>
                </div>
                {data.timerEnabled && (
                  <div>
                    <p className="text-muted-foreground">Timer</p>
                    <p className="font-medium">{data.timerDuration} menit/batch</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Avg Score</p>
                  <p className="text-lg font-bold text-primary">
                    {data.avgScore}
                  </p>
                </div>
              </div>

              {/* Batch breakdown */}
              <div>
                <h3 className="mb-2 text-sm font-semibold">
                  Detail per Batch ({data.batches.length} batch)
                </h3>
                <div className="space-y-2">
                  {data.batches.map((batch) => {
                    const isExpanded = expandedBatch === batch.batchIndex;
                    const hasAnswers =
                      batch.submittedAt !== null &&
                      Object.keys(batch.answers).length > 0;

                    return (
                      <Card key={batch.batchIndex} className="overflow-hidden">
                        <CardContent className="p-3">
                          <button
                            className="flex w-full items-center justify-between text-left"
                            onClick={() =>
                              setExpandedBatch(
                                isExpanded ? null : batch.batchIndex
                              )
                            }
                            disabled={!hasAnswers}
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                                {batch.batchIndex + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium">
                                  Batch {batch.batchIndex + 1}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {batch.questionCount} soal
                                  {batch.submittedAt
                                    ? ` · ${formatDate(batch.submittedAt)}`
                                    : " · Belum di-submit"}
                                </p>
                              </div>
                            </div>
                            {batch.submittedAt ? (
                              <div className="text-right">
                                <span
                                  className={`text-lg font-bold ${
                                    batch.score >= 70
                                      ? "text-green-600"
                                      : batch.score >= 50
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                  }`}
                                >
                                  {batch.score}
                                </span>
                                <p className="text-xs text-muted-foreground">
                                  {batch.totalCorrect}/{batch.totalCorrect + batch.totalWrong} benar
                                </p>
                              </div>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </button>

                          {isExpanded && hasAnswers && (
                            <div className="mt-3 space-y-1 border-t pt-3">
                              <p className="text-xs font-medium text-muted-foreground">
                                Jawaban per Soal:
                              </p>
                              {Object.entries(batch.answers).map(
                                ([qId, ansData]) => {
                                  const ans = ansData as {
                                    userAnswer: string;
                                    isCorrect: boolean;
                                    correctAnswer: string;
                                  };
                                  return (
                                    <div
                                      key={qId}
                                      className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-xs"
                                    >
                                      <span className="font-mono text-muted-foreground">
                                        Soal #{qId}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">
                                          Jawaban: {ans.userAnswer || "(kosong)"}
                                        </span>
                                        {ans.isCorrect ? (
                                          <Badge variant="success">✓ Benar</Badge>
                                        ) : (
                                          <Badge variant="destructive">
                                            ✗ Salah
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
