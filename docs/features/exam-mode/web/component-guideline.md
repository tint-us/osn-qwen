# Component Guidelines — EXAM MODE Module

## Components List

| # | Component | Type | Location |
|---|---|---|---|
| 1 | ExamSetup | Client | `components/exam/ExamSetup.tsx` |
| 2 | ResumeSessionModal | Client | `components/exam/ResumeSessionModal.tsx` |
| 3 | ExamQuestion | Client | `components/exam/ExamQuestion.tsx` |
| 4 | BatchTimer | Client | `components/exam/BatchTimer.tsx` |
| 5 | ExamNavigation | Client | `components/exam/ExamNavigation.tsx` |
| 6 | BatchReview | Client | `components/exam/BatchReview.tsx` |
| 7 | BatchAnalytics | Client | `components/exam/BatchAnalytics.tsx` |
| 8 | ExamSummary | Client | `components/exam/ExamSummary.tsx` |
| 9 | SubmitConfirmModal | Client | `components/exam/SubmitConfirmModal.tsx` |

---

## 1. ExamSetup

**Purpose:** Filter selection + exam configuration (batch size, timer).

**Props:**
```typescript
interface ExamSetupProps {
  onStart: (config: {
    filter: { tingkat: string; level: string; matpels: string[] };
    batchSize: number;
    timerEnabled: boolean;
    timerDuration: number;
  }) => void;
  isLoading?: boolean;
}
```

**State:**
```typescript
const [tingkat, setTingkat] = useState<string>("");
const [level, setLevel] = useState<string>("");
const [matpels, setMatpels] = useState<string[]>([]);
const [batchSize, setBatchSize] = useState<number>(10);
const [timerEnabled, setTimerEnabled] = useState<boolean>(false);
const [timerDuration, setTimerDuration] = useState<number>(30);
const [errors, setErrors] = useState<Record<string, string>>({});
```

**Behavior:**
- Tingkat: radio buttons (SD, SMP, SMA) — required
- Level: radio buttons (OSNK, OSNP, SEMIFINAL, FINAL) — required, filtered by tingkat
- Matpel: checkboxes (multi-select) — min 1 required
- Batch size: slider or dropdown, range 10-30, default 10
- Timer toggle: switch (on/off)
- If timer on: duration input (number, min 1, max 180, default 30)
- "Mulai Ujian" button: validates all fields, calls onStart
- Validation errors displayed inline below each field

**UI:**
```
┌─────────────────────────────────────┐
│ Step 1: Pilih Filter                │
│                                      │
│ Tingkat: [SD] [SMP] [SMA]          │
│ Level:  [OSNK] [OSNP] [SEMIFINAL]  │
│         [FINAL]                     │
│ Matpel: ☐ Matematika                │
│         ☐ Fisika                   │
│         ☐ Kimia                    │
│         ...                         │
│                                      │
│ Step 2: Konfigurasi                 │
│                                      │
│ Batch Size: [====10====] 10 soal   │
│ Timer: [OFF]                        │
│ Duration: 30 menit (if timer on)   │
│                                      │
│ [Mulai Ujian]                       │
└─────────────────────────────────────┘
```

---

## 2. ResumeSessionModal

**Purpose:** Show active session info, offer resume or start new.

**Props:**
```typescript
interface ResumeSessionModalProps {
  session: {
    id: number;
    filter: { tingkat: string; level: string; matpels: string[] };
    currentBatchIndex: number;
    totalBatches: number;
  };
  onResume: () => void;
  onAbandon: () => void;
}
```

**Behavior:**
- Auto-shows when GET /api/exam/sessions/active returns data
- Display: filter summary, batch progress
- "Resume" button: calls onResume → router.push to batch page
- "Mulai Baru" button: calls onAbandon → DELETE /api/exam/sessions/[id]/abandon
- Modal cannot be dismissed without choosing (no close button)
- Loading state on both buttons while request is in flight

---

## 3. ExamQuestion

**Purpose:** Render a single question with answer input.

**Props:**
```typescript
interface ExamQuestionProps {
  question: {
    id: number;
    content: string;
    imageUrl: string | null;
    questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
    options: string[];
  };
  currentAnswer: string;
  onAnswer: (answer: string) => void;
  questionNumber: number;
  totalQuestions: number;
  batchIndex: number;
  totalBatches: number;
}
```

**Behavior:**
- Renders question content with KaTeX (via KatexRenderer)
- Renders image if `imageUrl` is present
- Header: "Soal {questionNumber} dari {totalQuestions} (Batch {batchIndex+1} dari {totalBatches})"
- Answer input depends on questionType:
  - MULTIPLE_CHOICE: radio button list with shuffled options
  - SHORT_ANSWER: text input
  - ESSAY: number input (numeric answer)
- onChange calls onAnswer immediately
- No feedback shown (no correct/incorrect indicator)
- Answer value from Zustand store (currentAnswer)

---

## 4. BatchTimer

**Purpose:** Countdown timer display with auto-submit on expiry.

**Props:**
```typescript
interface BatchTimerProps {
  startedAt: Date | null;
  durationMinutes: number;
  onExpire: () => void;
  isPaused?: boolean;
}
```

**State:**
```typescript
const [timeRemaining, setTimeRemaining] = useState<number>(0);
```

**Behavior:**
- If startedAt is null: show "—" (timer not started)
- Calculate: `endTime = startedAt + durationMinutes * 60 * 1000`
- Interval: update timeRemaining every 1 second
- timeRemaining = max(0, floor((endTime - now) / 1000))
- When timeRemaining === 0: call onExpire(), clearInterval
- Display format:
  - > 1 hour: "H:MM:SS"
  - < 1 hour: "MM:SS"
- Color:
  - > 5 min: green-500
  - 1-5 min: yellow-500
  - < 1 min: red-500 + pulse animation
- If isPaused: show "Paused" (gray)

**Cleanup:** `useEffect` return clears interval on unmount.

---

## 5. ExamNavigation

**Purpose:** Question navigation panel (sidebar on desktop, bottom bar on mobile).

**Props:**
```typescript
interface ExamNavigationProps {
  totalQuestions: number;
  currentIndex: number;
  answeredQuestions: Set<number>;
  onJump: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
}
```

**Behavior:**
- Grid of numbered buttons (1 to totalQuestions)
- Button states:
  - Current: highlighted (ring-2 ring-blue-500)
  - Answered: green background
  - Unanswered: gray background
- Click number: calls onJump(index)
- "← Sebelumnya" button: disabled if currentIndex === 0
- "Berikutnya →" button: disabled if currentIndex === totalQuestions - 1
- Desktop: left sidebar (vertical)
- Mobile: horizontal scrollable bar at bottom
- Buttons are always enabled (can navigate to any question in current batch)

---

## 6. BatchReview

**Purpose:** Display batch results — score, per-question review with correct answers and explanations.

**Props:**
```typescript
interface BatchReviewProps {
  batchIndex: number;
  score: number;
  totalCorrect: number;
  totalWrong: number;
  gradedAnswers: Record<number, {
    userAnswer: string;
    isCorrect: boolean;
    correctAnswer: string;
  }>;
  questions: Question[];
  isLastBatch: boolean;
  isAutoSubmitted?: boolean;
  onNextBatch?: () => void;
  onFinish?: () => void;
}
```

**Behavior:**
- Header: "Batch {batchIndex+1} Review"
- If isAutoSubmitted: show badge "Waktu habis" (red)
- Score card: large number "80/100" with color (green > 70, yellow 50-70, red < 50)
- Stats row: Benar (green), Salah (red), Total Soal
- Review list: collapsible per-question cards
  - Each card:
    - Header: "Soal {n}" + ✓/✗ icon
    - Question content (with KaTeX)
    - User answer (highlighted green if correct, red if wrong)
    - Correct answer
    - Pembahasan (with KaTeX)
  - Cards collapsible (accordion style)
  - "Collapse All" / "Expand All" toggle
- Footer buttons:
  - Not last batch: "Batch Berikutnya →" calls onNextBatch
  - Last batch: "Selesai" calls onFinish → redirect to summary

---

## 7. BatchAnalytics

**Purpose:** Charts showing score progression across batches.

**Props:**
```typescript
interface BatchAnalyticsProps {
  batchScores: Array<{
    batchIndex: number;
    score: number;
    totalCorrect: number;
    totalWrong: number;
  }>;
  currentBatchIndex: number;
}
```

**Behavior:**
- Line chart: x-axis = batch index (1, 2, 3...), y-axis = score (0-100)
  - Current batch point highlighted
  - Previous batches shown as completed points
- Bar chart (stacked): correct (green) vs wrong (red) per batch
- Average score: displayed below charts
- Trend indicator: "↑ Naik" / "↓ Turun" / "→ Stabil" (compare last 2 batches)
- Uses chart library (recharts recommended)

**Note:** Chart library must be verified in package.json. Recommended: `recharts` (React-friendly, responsive).

---

## 8. ExamSummary

**Purpose:** Final summary after all batches completed.

**Props:**
```typescript
interface ExamSummaryProps {
  session: {
    id: number;
    filter: { tingkat: string; level: string; matpels: string[] };
    totalQuestions: number;
  };
  batchScores: Array<{
    batchIndex: number;
    score: number;
    totalCorrect: number;
    totalWrong: number;
  }>;
}
```

**Behavior:**
- Header: "Exam Selesai! 🎉"
- Summary card:
  - Average score across all batches
  - Total correct / total questions
  - Total wrong / total questions
- Line chart: all batch scores
- Bar chart: correct vs wrong per batch
- "Kembali ke Dashboard" button → router.push("/dashboard")
- Session status is COMPLETED (no resume possible)

---

## 9. SubmitConfirmModal

**Purpose:** Confirmation modal before submitting a batch.

**Props:**
```typescript
interface SubmitConfirmModalProps {
  unansweredCount: number;
  unansweredQuestionNumbers: number[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**Behavior:**
- Shows: "Submit batch ini?"
- If unansweredCount > 0: "Anda belum menjawab {count} soal. Soal: {numbers}"
- Warning: "Setelah submit, jawaban tidak dapat diubah."
- Buttons: "Batal" (secondary) and "Submit Batch" (primary, destructive style)
- If isLoading: disable both buttons, show spinner on submit
- Not shown for auto-submit (timer expiry) — auto-submit skips this modal

---

## Zustand Store Integration

### ExamStore Usage per Component

| Component | Reads | Writes |
|---|---|---|
| ExamSetup | — | setSession (via onStart) |
| ResumeSessionModal | — | (triggers API, router redirect) |
| ExamQuestion | questions[currentIndex], answers[qId] | setAnswer |
| BatchTimer | batchStartedAt, timerDuration, timerEnabled | (calls onExpire → submit) |
| ExamNavigation | currentQuestionIndex, questions.length, answers | nextQuestion, prevQuestion, jumpToQuestion |
| BatchReview | — | reset (on finish) |
| BatchAnalytics | — | — |
| ExamSummary | — | reset |
| SubmitConfirmModal | answers, questions | setSubmitting |

### Sync Hook

```typescript
// hooks/useExamSync.ts
// Used in BatchExecutionPage
// Auto-syncs examStore.answers to DB every 30 seconds
// Provides finalSync() for use before submit
```

### Timer Hook

```typescript
// hooks/useBatchTimer.ts
// Used in BatchExecutionPage
// Calculates time remaining from startedAt + duration
// Calls onExpire when timer hits 0
// Updates every 1 second
```
