"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SessionItem {
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
  avgScore: number;
  batchesSubmitted: number;
  totalBatches: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SessionHistoryListProps {
  onSelectSession: (sessionId: number) => void;
}

const STATUS_LABELS: Record<string, { text: string; variant: "default" | "secondary" | "destructive" | "success" | "outline" }> = {
  COMPLETED: { text: "Selesai", variant: "success" },
  ACTIVE: { text: "Aktif", variant: "default" },
  ABANDONED: { text: "Ditinggalkan", variant: "secondary" },
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

export function SessionHistoryList({ onSelectSession }: SessionHistoryListProps) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/history/sessions?page=${p}&limit=10`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Gagal memuat data");
        return;
      }
      setSessions(json.data.sessions);
      setPagination(json.data.pagination);
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(page);
  }, [page, fetchSessions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Riwayat Sesi Exam</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-destructive">
            {error}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Belum ada sesi exam. Mulai exam untuk melihat riwayat di sini.
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {sessions.map((session) => {
                const statusInfo = STATUS_LABELS[session.status] ?? {
                  text: session.status,
                  variant: "outline" as const,
                };
                return (
                  <button
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-accent"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.text}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(session.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">
                          {session.filter.tingkat} · {session.filter.level}
                        </span>
                        <span className="text-muted-foreground">
                          {" · "}
                          {session.filter.matpels.join(", ")}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.batchesSubmitted}/{session.totalBatches} batch ·{" "}
                        {session.totalQuestions} soal
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {session.avgScore > 0
                          ? `${session.avgScore}`
                          : "—"}
                      </div>
                      {session.avgScore > 0 && (
                        <div className="text-xs text-muted-foreground">
                          avg score
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
