"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalQuestions: number;
  totalUsers: number;
  totalSiswa: number;
  totalAdmins: number;
  totalExamSessions: number;
  totalStudyAttempts: number;
  activeSessions: number;
  questionsByTingkat: { tingkat: string; count: number }[];
  recentUsers: {
    id: number;
    name: string;
    username: string;
    role: string;
    createdAt: string;
  }[];
}

export function AdminStatsOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Gagal memuat data");
        setStats(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="h-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "Total Soal", value: stats.totalQuestions, color: "text-blue-600" },
    { label: "Total User", value: stats.totalUsers, color: "text-green-600" },
    { label: "Siswa Aktif", value: stats.totalSiswa, color: "text-purple-600" },
    { label: "Sesi Ujian", value: stats.totalExamSessions, color: "text-orange-600" },
    { label: "Attempt Study", value: stats.totalStudyAttempts, color: "text-cyan-600" },
    { label: "Sesi Aktif", value: stats.activeSessions, color: "text-red-600" },
    { label: "Admin", value: stats.totalAdmins, color: "text-indigo-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-muted-foreground">
                {card.label}
              </p>
              <p className={cn("mt-1 text-3xl font-bold", card.color)}>
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Soal per Tingkat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.questionsByTingkat.map((item) => {
                const max = Math.max(
                  ...stats.questionsByTingkat.map((q) => q.count),
                  1
                );
                const pct = (item.count / max) * 100;
                return (
                  <div key={item.tingkat} className="flex items-center gap-3">
                    <span className="w-12 text-sm font-medium">
                      {item.tingkat}
                    </span>
                    <div className="h-6 flex-1 overflow-hidden rounded bg-muted">
                      <div
                        className="flex h-full items-center justify-end rounded bg-primary px-2 text-xs font-bold text-primary-foreground transition-all"
                        style={{ width: `${Math.max(pct, 10)}%` }}
                      >
                        {item.count}
                      </div>
                    </div>
                  </div>
                );
              })}
              {stats.questionsByTingkat.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Belum ada soal
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                  >
                    {user.role}
                  </Badge>
                </div>
              ))}
              {stats.recentUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Belum ada user terdaftar
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

