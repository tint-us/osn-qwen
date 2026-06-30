# Web Architecture — EXAM MODE Module

## 1. Page Structure

```
app/(pages)/exam/
  layout.tsx                              → Exam layout (SessionProvider wrapper)
  page.tsx                                 → Exam home (filter + setup OR resume modal)
  session/
    [id]/
      batch/
        [batchIndex]/
          page.tsx                         → Batch execution page (Client)
      review/
        [batchIndex]/
          page.tsx                         → Batch review + analytics (Client)
      summary/
        page.tsx                           → Final summary (Client)
```

### Layout Tree

```
RootLayout (app/layout.tsx)
  └── SessionProvider (NextAuth)
      └── ExamLayout (app/(pages)/exam/layout.tsx)
          ├── RoleGuard (role="SISWA")
          │   └── children
          │       ├── ExamHomePage (filter + setup)
          │       ├── BatchExecutionPage
          │       ├── BatchReviewPage
          │       └── ExamSummaryPage
```

## 2. Zustand Store

```typescript
// store/examStore.ts

import { create } from "zustand";

interface ExamState {
  // Session
  sessionId: number | null;
  filter: { tingkat: string; level: string; matpels: string[] } | null;
  batchSize: number;
  timerEnabled: boolean;
  timerDuration: number; // minutes
  totalQuestions: number;
  totalBatches: number;

  // Batch
  currentBatchIndex: number;
  batchStartedAt: Date | null;
  questions: ExamQuestion[];
  currentQuestionIndex: number;
  answers: Record<number, string>;

  // UI state
  isSubmitting: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;

  // Actions
  setSession: (data: SessionData) => void;
  setBatch: (data: BatchData) => void;
  setAnswer: (questionId: number, answer: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  setSubmitting: (val: boolean) => void;
  setSyncing: (val: boolean) => void;
  setLastSync: (date: Date) => void;
  reset: () => void;
}

export const useExamStore = create<ExamState>((set) => ({
  sessionId: null,
  filter: null,
  batchSize: 10,
  timerEnabled: false,
  timerDuration: 30,
  totalQuestions: 0,
  totalBatches: 0,

  currentBatchIndex: 0,
  batchStartedAt: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},

  isSubmitting: false,
  isSyncing: false,
  lastSyncAt: null,

  setSession: (data) => set({
    sessionId: data.id,
    filter: data.filter,
    batchSize: data.batchSize,
    timerEnabled: data.timerEnabled,
    timerDuration: data.timerDuration,
    totalQuestions: data.totalQuestions,
    totalBatches: data.totalBatches,
    currentBatchIndex: data.currentBatchIndex,
  }),

  setBatch: (data) => set({
    questions: data.questions,
    batchStartedAt: data.startedAt,
    currentBatchIndex: data.batchIndex,
    answers: data.existingAnswers || {},
    currentQuestionIndex: data.currentQuestionIndex || 0,
  }),

  setAnswer: (questionId, answer) => set((state) => ({
    answers: { ...state.answers, [questionId]: answer },
  })),

  nextQuestion: () => set((state) => ({
    currentQuestionIndex: Math.min(
      state.currentQuestionIndex + 1,
      state.questions.length - 1
    ),
  })),

  prevQuestion: () => set((state) => ({
    currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
  })),

  jumpToQuestion: (index) => set({ currentQuestionIndex: index }),

  setSubmitting: (val) => set({ isSubmitting: val }),
  setSyncing: (val) => set({ isSyncing: val }),
  setLastSync: (date) => set({ lastSyncAt: date }),

  reset: () => set({
    sessionId: null, filter: null, batchSize: 10, timerEnabled: false,
    timerDuration: 30, totalQuestions: 0, totalBatches: 0,
    currentBatchIndex: 0, batchStartedAt: null, questions: [],
    currentQuestionIndex: 0, answers: {}, isSubmitting: false,
    isSyncing: false, lastSyncAt: null,
  }),
}));
```

## 3. Client-Side Data Flow

### Page Load Flow (Batch Execution)

```
1. User navigates to /exam/session/[id]/batch/[batchIndex]
2. Page component (Client Component) mounts
3. useEffect → GET /api/exam/sessions/[id]/batch/[batchIndex]
4. Response: { questions[], answers, timer }
5. examStore.setBatch({ questions, answers, startedAt, batchIndex })
6. If timerEnabled:
   - useBatchTimer hook starts
   - Calculates endTime = startedAt + timerDuration
   - Updates timeRemaining every second
7. useExamSync hook starts
   - setInterval 30s → PATCH /api/exam/sessions/[id]/sync
8. Render ExamQuestion component for questions[currentQuestionIndex]
```

### Answer Flow

```
1. User types answer in AnswerInput component
2. onChange → examStore.setAnswer(questionId, value)
3. Zustand state updates → re-render
4. Sync interval will pick up changes every 30s
5. If user navigates to next question:
   - nextQuestion() → currentQuestionIndex++
   - New question renders from questions array
```

### Submit Flow

```
1. User clicks "Submit Batch" OR timer hits 00:00
2. If manual: show confirmation modal
3. On confirm (or auto): setSubmitting(true)
4. Final sync: PATCH /api/exam/sessions/[id]/sync
5. POST /api/exam/sessions/[id]/batch/[batchIndex]/submit
   Body: { answers: examStore.answers }
6. Response: { score, totalCorrect, totalWrong, allBatches }
7. If isLastBatch: redirect to /exam/session/[id]/summary
8. Else: redirect to /exam/session/[id]/review/[batchIndex]
```

## 4. KaTeX Integration

Same pattern as Study Mode:

```typescript
// components/shared/KatexRenderer.tsx (shared component)
// Used in ExamQuestion (render soal) and BatchReview (render soal + pembahasan)
// Renders $...$ and $$...$$ notation
```

## 5. Resume Integration

```
/exam (ExamHomePage)
  │
  ▼
useEffect: GET /api/exam/sessions/active
  │
  ├── null → render filter + setup form
  │
  └── session found → render ResumeSessionModal
      ├── [Resume] → router.push(/exam/session/[id]/batch/[currentBatchIndex])
      └── [Mulai Baru] → DELETE /api/exam/sessions/[id]/abandon → re-render
```

## 6. Route Protection

```typescript
// middleware.ts (shared with AUTH module)
// /exam/* routes require:
//   - User is authenticated
//   - User role === SISWA
//   - Redirect to /login if not authenticated
//   - Redirect to /admin if role === ADMIN
```

## 7. Timer Display Logic

```typescript
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getTimerColor(seconds: number): string {
  if (seconds < 60) return "text-red-500";       // < 1 minute
  if (seconds < 300) return "text-yellow-500";   // < 5 minutes
  return "text-green-500";
}
```

## 8. Analytics Chart Integration

```typescript
// BatchReviewPage uses chart library (recharts or chart.js)
// Line chart: batch scores [batch1.score, batch2.score, ...]
// Bar chart: correct vs wrong per batch
// Both charts are Client Components

interface BatchScore {
  batchIndex: number;
  score: number;
  totalCorrect: number;
  totalWrong: number;
}

// Data comes from submit response: allBatches[]
// or from GET /api/exam/sessions/[id] (includes all batches)
```
