# Component Guidelines — HISTORY & ANALITIK Module

## Components List

| # | Component | Type | Location |
|---|---|---|---|
| 1 | SessionHistoryList | Client | `components/history/SessionHistoryList.tsx` |
| 2 | SessionDetailModal | Client | `components/history/SessionDetailModal.tsx` |
| 3 | BatchScoreChart | Client | `components/history/BatchScoreChart.tsx` |
| 4 | StatsCard | Client | `components/history/StatsCard.tsx` |
| 5 | StreakDisplay | Client | `components/history/StreakDisplay.tsx` |
| 6 | StreakMilestonePopup | Client | `components/history/StreakMilestonePopup.tsx` |
| 7 | SubjectAccuracyChart | Client | `components/history/SubjectAccuracyChart.tsx` |

---

## 1. SessionHistoryList

**Purpose:** Paginated table of user's exam sessions.

**Props:**
```typescript
interface SessionHistoryListProps {
  sessions: ExamSessionSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
  onSessionClick: (sessionId: number) => void;
  isLoading?: boolean;
}
```

**Behavior:**
- Table columns: Tanggal, Filter (tingkat/level/matpel), Total Soal, Skor Rata-rata, Status
- Status badges:
  - COMPLETED: green "✅ Selesai"
  - ACTIVE: blue "🔄 Sedang Berlangsung"
  - ABANDONED: gray "⛔ Ditinggalkan"
- Skor "—" if no batches submitted
- Click row → calls onSessionClick
- Pagination controls at bottom: First, Prev, page numbers, Next, Last
- "Menampilkan X-Y dari Z sesi"
- Loading: skeleton rows
- Empty: "Belum ada riwayat sesi" + CTA button

---

## 2. SessionDetailModal

**Purpose:** Modal showing detailed batch breakdown for a session.

**Props:**
```typescript
interface SessionDetailModalProps {
  sessionId: number;
  onClose: () => void;
}
```

**Behavior:**
- Fetches GET /api/history/sessions/[id] on mount
- Header: date, filter, status, avg score
- Batch list: each batch as a card with:
  - Batch index, score (progress bar), correct/wrong counts, submittedAt
  - Expand/collapse toggle per batch
- Expanded batch: shows per-question review (question content truncated, user answer, isCorrect, correct answer)
- Progress bar color: green (>70), yellow (50-70), red (<50)
- If session ACTIVE: "Lanjutkan Sesi" button → redirect to exam page
- Close: [✕] button or backdrop click
- Loading: skeleton inside modal
- Scrollable if content exceeds viewport

---

## 3. BatchScoreChart

**Purpose:** Line chart showing score progression across all batches.

**Props:**
```typescript
interface BatchScoreChartProps {
  data: Array<{
    index: number;
    batchIndex: number;
    score: number;
    submittedAt: string;
    sessionDate: string;
    sessionFilter: { tingkat: string; level: string; matpels: string[] };
  }>;
  onFilterChange?: (filter: { tingkat?: string; level?: string; matpel?: string }) => void;
  isLoading?: boolean;
}
```

**Behavior:**
- recharts LineChart (ResponsiveContainer)
- X-axis: batch index (chronological)
- Y-axis: score (0-100)
- Line: blue, strokeWidth=2, dot r=4
- Tooltip: session date, batch number, score, filter info
- Filter bar above chart:
  - Tingkat dropdown (SD/SMP/SMA/All)
  - Level dropdown (OSNK/OSNP/SEMIFINAL/FINAL/All)
  - Matpel dropdown (dynamic from available data)
  - "Reset Filter" button
- Empty state: "Belum cukup data untuk menampilkan grafik"
- Loading: skeleton block
- Mobile: chart height adjusts (200px vs 300px desktop)

---

## 4. StatsCard

**Purpose:** Display a single statistic with label and value.

**Props:**
```typescript
interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow";
  isLoading?: boolean;
}
```

**Behavior:**
- Card with: icon (optional), large value, label below
- Color variants:
  - blue: total questions
  - green: correct answers
  - red: wrong answers
  - yellow: accuracy %
- Loading: skeleton (pulsing gray block)
- Responsive: grid layout (4 cols desktop, 2 cols mobile)

---

## 5. StreakDisplay

**Purpose:** Show current streak count with fire emoji.

**Props:**
```typescript
interface StreakDisplayProps {
  streak: number;
  lastActiveDate: string | null;
  isLoading?: boolean;
}
```

**Behavior:**
- If streak > 0: "🔥 X hari streak"
- If streak = 0: "Mulai belajar hari ini untuk memulai streak! 🔥"
- Subtext: "Aktif terakhir: {date}" (formatted id-ID)
- Card with subtle gradient background (orange/red)
- Loading: skeleton

---

## 6. StreakMilestonePopup

**Purpose:** Eye-catchy pop-up celebrating streak milestones (3/7/14/30 days).

**Props:**
```typescript
interface StreakMilestonePopupProps {
  streak: number;
  emoji: string;
  message: string;
  onDismiss: () => void;
}
```

**Behavior:**
- Overlay backdrop: semi-transparent black (bg-black/50)
- Pop-up card:
  - CSS animation: `popup-scale` (scale 0→1, 300ms ease-out)
  - Large emoji (text-6xl)
  - Motivational message (text-lg, centered)
  - "Lanjut Belajar!" button (primary, gradient)
- Confetti effect:
  - 30 confetti pieces (div elements with random colors)
  - CSS keyframe animation: `confetti-fall` (3s linear infinite)
  - Random: left position, animation-delay, color, size
- Auto-dismiss: 10 seconds (setTimeout in parent hook)
- On dismiss: fade out 200ms, then remove from DOM
- z-index: 50 (above everything)

### CSS Keyframes

```css
@keyframes popup-scale {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes confetti-fall {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

@keyframes popup-fade-out {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
```

### Confetti Generation

```typescript
function generateConfetti(count: number) {
  const colors = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
    size: 8 + Math.random() * 8,
  }));
}
```

---

## 7. SubjectAccuracyChart

**Purpose:** Horizontal bar chart showing accuracy per matpel.

**Props:**
```typescript
interface SubjectAccuracyChartProps {
  data: Array<{
    matpel: string;
    totalAttempts: number;
    totalCorrect: number;
    accuracy: number;
  }>;
  isLoading?: boolean;
}
```

**Behavior:**
- recharts BarChart (layout="vertical" for horizontal bars)
- X-axis: accuracy % (0-100)
- Y-axis: matpel names (category)
- Bar color: dynamic based on accuracy:
  - >= 70%: green (#22c55e)
  - 50-70%: yellow (#eab308)
  - < 50%: red (#ef4444)
- Tooltip: matpel, total attempts, total correct, accuracy %
- Sorted by accuracy descending (data pre-sorted from API)
- Empty state: "Belum ada data belajar" + CTA to Study Mode
- Loading: skeleton
- Mobile: chart height adjusts, Y-axis labels may truncate

---

## Hook: useStreakMilestone

**Purpose:** Hook to manage milestone popup display logic.

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
      return;
    }

    const flagKey = `milestone_${streak}_shown`;
    if (localStorage.getItem(flagKey) === "true") {
      return;
    }

    const data = MILESTONE_DATA[streak];
    if (data) {
      setMilestoneData(data);
      setShowPopup(true);
      localStorage.setItem(flagKey, "true");

      const timer = setTimeout(() => setShowPopup(false), 10_000);
      return () => clearTimeout(timer);
    }
  }, [streak]);

  const dismiss = useCallback(() => setShowPopup(false), []);

  return { showPopup, milestoneData, dismiss };
}
```

---

## Chart Library: recharts

**Required dependency:** `recharts`

**Why recharts:**
- React-native (built for React)
- Responsive by default (ResponsiveContainer)
- Supports LineChart and BarChart
- Custom tooltips via content prop
- Dynamic cell colors

**Installation note:** Add `recharts` to package.json dependencies when implementation begins.

---

## Page Integration

### /history page structure

```typescript
// app/(pages)/history/page.tsx (Client Component)

export default function HistoryPage() {
  const { data: sessionsData, isLoading: sessionsLoading } = useFetch("/api/history/sessions");
  const { data: analytics, isLoading: analyticsLoading } = useFetch("/api/history/analytics");
  const { data: streak, isLoading: streakLoading } = useFetch("/api/history/streak");
  const { data: studyStats, isLoading: statsLoading } = useFetch("/api/history/study-stats");

  const { showPopup, milestoneData, dismiss } = useStreakMilestone(streak?.currentStreak || 0);

  return (
    <div>
      <StreakDisplay streak={streak?.currentStreak || 0} lastActiveDate={streak?.lastActiveDate} isLoading={streakLoading} />

      <div className="grid grid-cols-4 gap-4">
        <StatsCard label="Total Soal" value={analytics?.totalQuestions} color="blue" isLoading={analyticsLoading} />
        <StatsCard label="Benar" value={analytics?.totalCorrect} color="green" isLoading={analyticsLoading} />
        <StatsCard label="Salah" value={analytics?.totalWrong} color="red" isLoading={analyticsLoading} />
        <StatsCard label="Akurasi" value={`${analytics?.accuracy}%`} color="yellow" isLoading={analyticsLoading} />
      </div>

      <BatchScoreChart data={analytics?.batchScores} isLoading={analyticsLoading} />

      <SubjectAccuracyChart data={studyStats} isLoading={statsLoading} />

      <SessionHistoryList
        sessions={sessionsData?.sessions}
        pagination={sessionsData?.pagination}
        onPageChange={(page) => refetch({ page })}
        onSessionClick={(id) => setSelectedSessionId(id)}
        isLoading={sessionsLoading}
      />

      {selectedSessionId && (
        <SessionDetailModal sessionId={selectedSessionId} onClose={() => setSelectedSessionId(null)} />
      )}

      {showPopup && milestoneData && (
        <StreakMilestonePopup
          streak={streak.currentStreak}
          emoji={milestoneData.emoji}
          message={milestoneData.message}
          onDismiss={dismiss}
        />
      )}
    </div>
  );
}
```
