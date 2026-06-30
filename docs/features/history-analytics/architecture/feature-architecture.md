# Feature Architecture — HISTORY & ANALITIK Module

## 1. Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    HISTORY & ANALITIK                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   /history (Layout)                       │    │
│  │                                                            │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │    │
│  │  │ StatsCard 1 │  │ StatsCard 2 │  │ StatsCard 3 │        │    │
│  │  │ Total Soal  │  │ Benar       │  │ Salah       │        │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │    │
│  │  ┌─────────────┐                                          │    │
│  │  │ StatsCard 4 │  ┌──────────────┐                        │    │
│  │  │ Akurasi %   │  │ StreakDisplay│                        │    │
│  │  └─────────────┘  └──────────────┘                        │    │
│  │                                                            │    │
│  │  ┌──────────────────────────────────────────────────┐      │    │
│  │  │  BatchScoreChart (LineChart)                     │      │    │
│  │  │  ┌──────────────┐  ┌──────────────────────┐     │      │    │
│  │  │  │ FilterBar    │  │  Line chart area     │     │      │    │
│  │  │  │ (matpel/level│  │  (recharts)          │     │      │    │
│  │  │  │  /tingkat)   │  │                      │     │      │    │
│  │  │  └──────────────┘  └──────────────────────┘     │      │    │
│  │  └──────────────────────────────────────────────────┘      │    │
│  │                                                            │    │
│  │  ┌──────────────────────────────────────────────────┐      │    │
│  │  │  SubjectAccuracyChart (BarChart)                 │      │    │
│  │  │  (horizontal bars per matpel)                    │      │    │
│  │  └──────────────────────────────────────────────────┘      │    │
│  │                                                            │    │
│  │  ┌──────────────────────────────────────────────────┐      │    │
│  │  │  SessionHistoryList                              │      │    │
│  │  │  (table: date, filter, total, avg score, status) │      │    │
│  │  │  pagination 10/page                              │      │    │
│  │  └──────────────────────────────────────────────────┘      │    │
│  │                                                            │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────┐                        │
│  │  StreakMilestonePopup (overlay)      │                        │
│  │  (conditional: streak = 3/7/14/30)   │                        │
│  └──────────────────────────────────────┘                        │
│                                                                  │
│  ┌──────────────────────────────────────┐                        │
│  │  SessionDetailModal (overlay)        │                        │
│  │  (on session click)                  │                        │
│  └──────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Data Flow

```
/history page load
  │
  ├── GET /api/history/sessions
  │     → SessionHistoryList
  │
  ├── GET /api/history/analytics
  │     → StatsCards (total, correct, wrong, accuracy)
  │     → BatchScoreChart (batch scores across sessions)
  │
  ├── GET /api/history/streak
  │     → StreakDisplay
  │     → StreakMilestonePopup (conditional)
  │
  └── GET /api/history/study-stats
        → SubjectAccuracyChart

User click session → GET /api/history/sessions/[id]
  → SessionDetailModal
```

## 3. Analytics Aggregation Query

```typescript
// lib/services/historyService.ts

async function getAnalytics(userId: number, filter?: AnalyticsFilter) {
  // 1. Exam data: join ExamSession → ExamBatch
  const examBatches = await prisma.examBatch.findMany({
    where: {
      session: {
        userId,
        ...(filter && {
          filter: {
            path: ["tingkat"],
            equals: filter.tingkat,
          },
        }),
      },
    },
    include: {
      session: { select: { filter: true, createdAt: true } },
    },
    orderBy: { submittedAt: "asc" },
  });

  const examCorrect = examBatches.reduce((sum, b) => sum + b.totalCorrect, 0);
  const examWrong = examBatches.reduce((sum, b) => sum + b.totalWrong, 0);

  // 2. Study data
  const studyAttempts = await prisma.studyAttempt.findMany({
    where: { userId },
    include: {
      question: { select: { matpel: true } },
    },
  });

  const studyCorrect = studyAttempts.filter(a => a.isCorrect).length;
  const studyWrong = studyAttempts.filter(a => !a.isCorrect).length;

  // 3. Aggregate
  const totalQuestions = examCorrect + examWrong + studyAttempts.length;
  const totalCorrect = examCorrect + studyCorrect;
  const totalWrong = examWrong + studyWrong;
  const accuracy =
    totalCorrect + totalWrong > 0
      ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 1000) / 10
      : 0;

  // 4. Batch scores for chart
  const batchScores = examBatches
    .filter(b => b.submittedAt)
    .map((b, i) => ({
      index: i,
      batchIndex: b.batchIndex,
      score: b.score,
      submittedAt: b.submittedAt,
      sessionFilter: b.session.filter,
      sessionDate: b.session.createdAt,
    }));

  return {
    totalQuestions,
    totalCorrect,
    totalWrong,
    accuracy,
    batchScores,
  };
}
```

## 4. Subject Accuracy Query

```typescript
async function getStudyStats(userId: number) {
  const attempts = await prisma.studyAttempt.findMany({
    where: { userId },
    include: {
      question: { select: { matpel: true } },
    },
  });

  // Group by matpel
  const byMatpel: Record<string, { total: number; correct: number }> = {};

  for (const attempt of attempts) {
    const matpel = attempt.question?.matpel;
    if (!matpel) continue; // skip if question deleted

    if (!byMatpel[matpel]) {
      byMatpel[matpel] = { total: 0, correct: 0 };
    }
    byMatpel[matpel].total++;
    if (attempt.isCorrect) byMatpel[matpel].correct++;
  }

  // Calculate accuracy + sort
  const result = Object.entries(byMatpel)
    .map(([matpel, data]) => ({
      matpel,
      totalAttempts: data.total,
      totalCorrect: data.correct,
      accuracy: Math.round((data.correct / data.total) * 1000) / 10,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  return result;
}
```

## 5. Streak Milestone Logic

```typescript
// hooks/useStreakMilestone.ts

const MILESTONES = [3, 7, 14, 30] as const;

const MILESTONE_DATA: Record<number, { emoji: string; message: string }> = {
  3: { emoji: "🔥", message: "Hebat! 3 hari berturut-turut belajar. Teruskan semangatnya! 🔥" },
  7: { emoji: "⭐", message: "Luar biasa! 1 minggu penuh konsisten! Kamu sedang membentuk kebiasaan! ⭐" },
  14: { emoji: "💪", message: "2 minggu! Kamu sungguh pantang menyerah. OSN menanti! 💪" },
  30: { emoji: "🏆", message: "SEKUAT TENAGA! 30 hari streak! Kamu adalah juara sejati! 🏆" },
};

function useStreakMilestone(streak: number) {
  const [showPopup, setShowPopup] = useState(false);
  const [milestoneData, setMilestoneData] = useState<{ emoji: string; message: string } | null>(null);

  useEffect(() => {
    if (!MILESTONES.includes(streak as any)) {
      setShowPopup(false);
      return;
    }

    const flagKey = `milestone_${streak}_shown`;
    const alreadyShown = localStorage.getItem(flagKey) === "true";

    if (alreadyShown) {
      setShowPopup(false);
      return;
    }

    const data = MILESTONE_DATA[streak];
    if (data) {
      setMilestoneData(data);
      setShowPopup(true);
      localStorage.setItem(flagKey, "true");

      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => setShowPopup(false), 10_000);
      return () => clearTimeout(timer);
    }
  }, [streak]);

  const dismiss = useCallback(() => setShowPopup(false), []);

  return { showPopup, milestoneData, dismiss };
}
```

## 6. Confetti Animation (CSS Keyframes)

```css
/* components/history/StreakMilestonePopup.css */

@keyframes confetti-fall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

@keyframes popup-scale {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes confetti-piece {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
}

.confetti-piece {
  position: absolute;
  width: 10px;
  height: 10px;
  animation: confetti-fall 3s linear infinite,
             confetti-piece 0.5s ease-in-out infinite;
}

.popup-card {
  animation: popup-scale 300ms ease-out;
}
```

## 7. Recharts Integration

### Line Chart (BatchScoreChart)

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Data shape: [{ index: 0, score: 80, date: "2025-01-15", matpel: "Matematika" }, ...]

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={batchScores}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="index" label={{ value: "Batch", position: "insideBottom" }} />
    <YAxis domain={[0, 100]} label={{ value: "Skor", angle: -90, position: "insideLeft" }} />
    <Tooltip
      content={({ active, payload }) => {
        if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
            <div className="bg-white p-2 shadow rounded border">
              <p>Sesi: {new Date(data.sessionDate).toLocaleDateString("id-ID")}</p>
              <p>Batch: {data.batchIndex + 1}</p>
              <p>Skor: {data.score}</p>
            </div>
          );
        }
        return null;
      }}
    />
    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
  </LineChart>
</ResponsiveContainer>
```

### Bar Chart (SubjectAccuracyChart)

```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Data shape: [{ matpel: "Matematika", accuracy: 85.5, totalAttempts: 40, totalCorrect: 34 }, ...]

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={subjectStats} layout="vertical">
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis type="number" domain={[0, 100]} unit="%" />
    <YAxis type="category" dataKey="matpel" width={100} />
    <Tooltip
      content={({ active, payload }) => {
        if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
            <div className="bg-white p-2 shadow rounded border">
              <p>{data.matpel}</p>
              <p>Akurasi: {data.accuracy}%</p>
              <p>Benar: {data.totalCorrect} / {data.totalAttempts}</p>
            </div>
          );
        }
        return null;
      }}
    />
    <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
      {subjectStats.map((entry, index) => (
        <Cell key={index} fill={getAccuracyColor(entry.accuracy)} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 70) return "#22c55e"; // green
  if (accuracy >= 50) return "#eab308"; // yellow
  return "#ef4444"; // red
}
```
