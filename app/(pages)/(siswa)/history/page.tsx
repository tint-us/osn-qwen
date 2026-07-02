"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatsCard } from "@/components/history/StatsCard";
import { BatchScoreChart } from "@/components/history/BatchScoreChart";
import { SubjectAccuracyChart } from "@/components/history/SubjectAccuracyChart";
import { StreakDisplay } from "@/components/history/StreakDisplay";
import { StreakMilestonePopup } from "@/components/history/StreakMilestonePopup";
import { SessionHistoryList } from "@/components/history/SessionHistoryList";
import { SessionDetailModal } from "@/components/history/SessionDetailModal";

interface AnalyticsData {
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
  batchScores: {
    index: number;
    batchIndex: number;
    score: number;
    submittedAt: string;
    sessionDate: string;
    sessionFilter: {
      tingkat: string;
      level: string;
      matpels: string[];
    };
  }[];
}

interface StreakData {
  currentStreak: number;
  lastActiveDate: string | null;
  milestones: Record<string, boolean>;
}

interface StudyStatItem {
  matpel: string;
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
}

const TINGKAT_OPTIONS = ["", "SD", "SMP", "SMA"];
const LEVEL_OPTIONS = ["", "OSNK", "OSNP", "SEMIFINAL", "FINAL"];

export default function HistoryPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [studyStats, setStudyStats] = useState<StudyStatItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterTingkat, setFilterTingkat] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterMatpel, setFilterMatpel] = useState("");

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );

  const fetchAnalytics = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterTingkat) params.set("tingkat", filterTingkat);
    if (filterLevel) params.set("level", filterLevel);
    if (filterMatpel) params.set("matpel", filterMatpel);

    const res = await fetch(`/api/history/analytics?${params}`);
    const json = await res.json();
    if (json.success) {
      setAnalytics(json.data);
    }
  }, [filterTingkat, filterLevel, filterMatpel]);

  const fetchStudyStats = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterTingkat) params.set("tingkat", filterTingkat);
    if (filterLevel) params.set("level", filterLevel);

    const res = await fetch(`/api/history/study-stats?${params}`);
    const json = await res.json();
    if (json.success) {
      setStudyStats(json.data);
    }
  }, [filterTingkat, filterLevel]);

  const fetchStreak = useCallback(async () => {
    const res = await fetch("/api/history/streak");
    const json = await res.json();
    if (json.success) {
      setStreak(json.data);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchAnalytics(), fetchStudyStats(), fetchStreak()]).finally(
      () => setLoading(false)
    );
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchStudyStats();
  }, [fetchAnalytics, fetchStudyStats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Riwayat & Analitik</h1>
        <p className="text-sm text-muted-foreground">
          Pantau perjalanan belajar dan perkembanganmu
        </p>
      </div>

      {streak && (
        <>
          <StreakDisplay
            currentStreak={streak.currentStreak}
            lastActiveDate={streak.lastActiveDate}
            milestones={streak.milestones}
          />
          <StreakMilestonePopup
            currentStreak={streak.currentStreak}
            milestones={streak.milestones}
          />
        </>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))
        ) : (
          <>
            <StatsCard
              label="Total Soal"
              value={analytics?.totalQuestions ?? 0}
              icon={<span className="text-lg">📝</span>}
            />
            <StatsCard
              label="Jawaban Benar"
              value={analytics?.totalCorrect ?? 0}
              icon={<span className="text-lg">✅</span>}
            />
            <StatsCard
              label="Jawaban Salah"
              value={analytics?.totalWrong ?? 0}
              icon={<span className="text-lg">❌</span>}
            />
            <StatsCard
              label="Akurasi"
              value={`${analytics?.accuracy ?? 0}%`}
              icon={<span className="text-lg">🎯</span>}
            />
          </>
        )}
      </div>

      {/* Filter bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Analitik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="filter-tingkat">Tingkat</Label>
              <select
                id="filter-tingkat"
                value={filterTingkat}
                onChange={(e) => setFilterTingkat(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TINGKAT_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t || "Semua Tingkat"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-level">Level</Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {l || "Semua Level"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-matpel">Mata Pelajaran</Label>
              <Input
                id="filter-matpel"
                value={filterMatpel}
                onChange={(e) => setFilterMatpel(e.target.value)}
                placeholder="Cth: Matematika"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BatchScoreChart data={analytics?.batchScores ?? []} />
        <SubjectAccuracyChart data={studyStats} />
      </div>

      {/* Session history */}
      <SessionHistoryList onSelectSession={setSelectedSessionId} />

      {/* Session detail modal */}
      <SessionDetailModal
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </div>
  );
}
