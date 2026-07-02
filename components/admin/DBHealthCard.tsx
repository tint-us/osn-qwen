"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DBHealthStatus {
  connected: boolean;
  latency: number | null;
  error: string | null;
  stats: {
    totalQuestions: number;
    totalUsers: number;
    totalExamSessions: number;
  };
}

export function DBHealthCard() {
  const [health, setHealth] = useState<DBHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchHealth() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/diagnostics");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal memuat data");
      setHealth(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Kesehatan Database</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loading}>
            {loading ? "Memeriksa..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-2">
            <div className="h-6 animate-pulse rounded bg-muted" />
            <div className="h-6 animate-pulse rounded bg-muted" />
            <div className="h-6 animate-pulse rounded bg-muted" />
          </div>
        )}

        {error && !loading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-red-500" />
              <Badge variant="destructive">Koneksi Gagal</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {health && !loading && !error && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-3 w-3 rounded-full",
                  health.connected ? "bg-green-500" : "bg-red-500"
                )}
              />
              <Badge variant={health.connected ? "success" : "destructive"}>
                {health.connected ? "Terhubung" : "Terputus"}
              </Badge>
              {health.latency !== null && (
                <span className="text-sm text-muted-foreground">
                  Latency: {health.latency}ms
                </span>
              )}
            </div>

            {health.error && (
              <p className="text-sm text-destructive">{health.error}</p>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-md border p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Soal</p>
                <p className="mt-1 text-xl font-bold">
                  {health.stats.totalQuestions}
                </p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-xs text-muted-foreground">Total User</p>
                <p className="mt-1 text-xl font-bold">
                  {health.stats.totalUsers}
                </p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-xs text-muted-foreground">Sesi Ujian</p>
                <p className="mt-1 text-xl font-bold">
                  {health.stats.totalExamSessions}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

