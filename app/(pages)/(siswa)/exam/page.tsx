"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExamSetup } from "@/components/exam/ExamSetup";
import { ResumeSessionModal } from "@/components/exam/ResumeSessionModal";

interface ActiveSession {
  id: number;
  filter: {
    tingkat?: string;
    level?: string;
    matpels?: string[];
    timerEnabled?: boolean;
    timerDuration?: number;
  };
  totalBatches: number;
  currentBatchIndex: number;
}

export default function ExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null
  );

  useEffect(() => {
    async function checkActiveSession() {
      try {
        const res = await fetch("/api/exam/sessions/active");
        const data = await res.json();
        if (data.success && data.data) {
          setActiveSession(data.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    checkActiveSession();
  }, []);

  async function handleStart(config: {
    filter: { tingkat: string; level: string; matpels: string[] };
    batchSize: number;
    timerEnabled: boolean;
    timerDuration: number;
  }) {
    setCreating(true);
    try {
      const res = await fetch("/api/exam/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/exam/session");
      } else {
        alert(data.error || "Gagal memulai ujian");
      }
    } catch {
      alert("Koneksi terputus. Coba lagi.");
    } finally {
      setCreating(false);
    }
  }

  async function handleAbandon() {
    if (!activeSession) return;
    try {
      const res = await fetch(
        `/api/exam/sessions/${activeSession.id}/abandon`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        setActiveSession(null);
      }
    } catch {
      alert("Gagal membatalkan sesi");
    }
  }

  function handleResume() {
    router.push("/exam/session");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Exam Mode</h1>
        <p className="text-muted-foreground mt-2">
          Sesi ujian dengan batch dan auto-grade
        </p>
      </div>

      {activeSession ? (
        <ResumeSessionModal
          filter={activeSession.filter}
          currentBatch={activeSession.currentBatchIndex}
          totalBatches={activeSession.totalBatches}
          onResume={handleResume}
          onAbandon={handleAbandon}
        />
      ) : (
        <ExamSetup onStart={handleStart} isLoading={creating} />
      )}
    </div>
  );
}
