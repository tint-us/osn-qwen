# Feature Architecture — EXAM MODE Module

## 1. Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     EXAM MODE                              │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────┐  │
│  │  ExamSetup   │   │ ResumeModal  │   │ ExamSummary   │  │
│  │  (filter +   │   │ (active      │   │ (final scores │  │
│  │  config)     │   │  session)    │   │  + charts)    │  │
│  └──────┬───────┘   └──────┬───────┘   └───────────────┘  │
│         │                  │                                  │
│         ▼                  │                                  │
│  ┌──────────────────────────┴──────────────────────┐        │
│  │            ExamPage (layout)                   │        │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │        │
│  │  │ ExamNav  │  │ExamQues-│  │ BatchTimer  │  │        │
│  │  │ (soal    │  │  tion   │  │ (countdown) │  │        │
│  │  │ nav)     │  │ (render)│  │             │  │        │
│  │  └──────────┘  └──────────┘  └─────────────┘  │        │
│  └──────────────────────┬────────────────────────┘        │
│                         │                                   │
│                         ▼                                   │
│  ┌──────────────────────────────────────────────┐          │
│  │              BatchReview                     │          │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────┐ │          │
│  │  │ ScoreCard│  │ ReviewList│  │BatchAnalytics│        │
│  │  │ (skor +  │  │ (per soal│  │ (charts)  │ │          │
│  │  │ stats)   │  │ review)  │  │           │ │          │
│  │  └──────────┘  └──────────┘  └───────────┘ │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 2. Algoritma Distribusi Soal ke Batch

```typescript
// Server-side: examService.ts

function distributeQuestionsToBatches(
  questionIds: number[],
  batchSize: number
): number[][] {
  const batches: number[][] = [];
  for (let i = 0; i < questionIds.length; i += batchSize) {
    batches.push(questionIds.slice(i, i + batchSize));
  }
  return batches;
}

async function createExamSession(
  userId: number,
  filter: ExamFilter,
  batchSize: number,
  timerEnabled: boolean,
  timerDuration: number
): Promise<ExamSession> {
  // 1. Fetch all questions matching filter
  const questions = await prisma.question.findMany({
    where: {
      tingkat: filter.tingkat,
      level: filter.level,
      matpel: { in: filter.matpels },
    },
    select: { id: true, questionType: true, options: true, correctOption: true,
              acceptableAnswers: true },
  });

  // 2. Validate minimum
  if (questions.length < 10) {
    throw new ValidationError("Minimal 10 soal untuk memulai exam");
  }

  // 3. Shuffle question order (Fisher-Yates)
  const shuffledQuestions = fisherYatesShuffle(questions);

  // 4. Shuffle MC options per soal + remap correctOption
  const processedQuestions = shuffledQuestions.map(q => {
    if (q.questionType === "MULTIPLE_CHOICE" && q.options) {
      const { shuffledOptions, newCorrectIndex } = shuffleMCOptions(
        q.options, q.correctOption
      );
      return { ...q, options: shuffledOptions, correctOption: newCorrectIndex };
    }
    return q;
  });

  // 5. Update questions with shuffled options (persist to DB)
  //    OR store shuffled options in questionOrder metadata
  //    Decision: update options in DB so GET batch returns correct order
  await Promise.all(
    processedQuestions.map(q =>
      prisma.question.update({
        where: { id: q.id },
        data: { options: q.options, correctOption: q.correctOption },
      })
    )
  );

  // 6. Create ExamSession
  const session = await prisma.examSession.create({
    data: {
      userId,
      filter: filter as any,
      totalQuestions: processedQuestions.length,
      batchSize,
      status: "ACTIVE",
      questionOrder: processedQuestions.map(q => q.id),
      currentBatchIndex: 0,
    },
  });

  // 7. Distribute to batches
  const questionIds = processedQuestions.map(q => q.id);
  const batches = distributeQuestionsToBatches(questionIds, batchSize);

  // 8. Create ExamBatch records
  await prisma.examBatch.createMany({
    data: batches.map((batchQuestionIds, index) => ({
      sessionId: session.id,
      batchIndex: index,
      questionIds: batchQuestionIds,
      answers: {},
      startedAt: index === 0 ? new Date() : null, // only first batch starts
    })),
  });

  return session;
}
```

### Fisher-Yates Shuffle (reuse from Study Mode)

```typescript
function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

### MC Option Shuffle with correctOption Remapping (reuse from Study Mode)

```typescript
function shuffleMCOptions(
  options: string[],
  correctOption: number
): { shuffledOptions: string[]; newCorrectIndex: number } {
  const indexed = options.map((opt, originalIndex) => ({ opt, originalIndex }));
  const shuffled = fisherYatesShuffle(indexed);
  const shuffledOptions = shuffled.map(item => item.opt);
  const newCorrectIndex = shuffled.findIndex(
    item => item.originalIndex === correctOption
  );
  return { shuffledOptions, newCorrectIndex };
}
```

## 3. Zustand ExamState Structure

```typescript
// store/examStore.ts

interface ExamState {
  // Session metadata
  sessionId: number | null;
  filter: ExamFilter | null;
  batchSize: number;
  timerEnabled: boolean;
  timerDuration: number; // in minutes

  // Batch metadata
  currentBatchIndex: number;
  totalBatches: number;
  batchStartedAt: Date | null;

  // Questions
  questions: ExamQuestion[];
  currentQuestionIndex: number;

  // Answers: { [questionId]: string }
  answers: Record<number, string>;

  // UI state
  isSubmitting: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  timeRemaining: number; // seconds remaining

  // Actions
  setSession: (session: ExamSessionData) => void;
  setBatch: (batch: BatchData) => void;
  setAnswer: (questionId: number, answer: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  setTimeRemaining: (seconds: number) => void;
  setSubmitting: (val: boolean) => void;
  setSyncing: (val: boolean) => void;
  setLastSync: (date: Date) => void;
  reset: () => void;
}

interface ExamQuestion {
  id: number;
  content: string;
  imageUrl: string | null;
  questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
  options: string[]; // for MC (already shuffled)
  // NOTE: correctOption & acceptableAnswers NOT included (security)
}
```

### State Transitions

```
┌──────────────────────────────────────────────────────────────┐
│                     EXAM STATE MACHINE                       │
│                                                              │
│  [IDLE]                                                      │
│     │                                                        │
│     │ setSession()                                           │
│     ▼                                                        │
│  [SESSION_READY]                                             │
│     │                                                        │
│     │ setBatch()                                             │
│     ▼                                                        │
│  [BATCH_ACTIVE]                                              │
│     │                                                        │
│     ├── setAnswer() → answers[qId] = val                     │
│     ├── nextQuestion() → currentQuestionIndex++              │
│     ├── prevQuestion() → currentQuestionIndex--              │
│     ├── jumpToQuestion(i) → currentQuestionIndex = i        │
│     ├── setTimeRemaining() → timeRemaining = sec             │
│     │                                                        │
│     │ setSubmitting(true)                                    │
│     ▼                                                        │
│  [SUBMITTING]                                                │
│     │                                                        │
│     ├── submit success → reset() or setBatch(next)         │
│     └── submit error → [BATCH_ACTIVE] (retry)               │
│                                                              │
│  [COMPLETED] — after last batch submit                       │
│     │                                                        │
│     │ reset()                                                │
│     ▼                                                        │
│  [IDLE]                                                      │
└──────────────────────────────────────────────────────────────┘
```

## 4. Mekanisme Sync DB (30-detik)

```typescript
// hooks/useExamSync.ts

function useExamSync(sessionId: number) {
  const { answers, currentBatchIndex, currentQuestionIndex } = useExamStore();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (Object.keys(answers).length === 0) return;

      setIsSyncing(true);
      try {
        await fetch(`/api/exam/sessions/${sessionId}/sync`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentBatchIndex,
            answers,
            currentQuestionIndex,
          }),
        });
        useExamStore.getState().setLastSync(new Date());
      } catch (error) {
        // Silent retry — next interval will try again
        console.warn("Sync failed, will retry");
      } finally {
        setIsSyncing(false);
      }
    }, 30_000); // 30 seconds

    return () => clearInterval(syncInterval);
  }, [sessionId, answers, currentBatchIndex, currentQuestionIndex]);

  // Final sync before submit or unmount
  const finalSync = useCallback(async () => {
    await fetch(`/api/exam/sessions/${sessionId}/sync`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentBatchIndex,
        answers,
        currentQuestionIndex,
      }),
    });
  }, [sessionId, answers, currentBatchIndex, currentQuestionIndex]);

  return { isSyncing, finalSync };
}
```

## 5. Auto-Submit Flow

```typescript
// hooks/useBatchTimer.ts

function useBatchTimer(
  sessionId: number,
  batchIndex: number,
  startedAt: Date | null,
  durationMinutes: number,
  onExpire: () => void
) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!startedAt) return;

    const endTime = startedAt.getTime() + durationMinutes * 60 * 1000;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onExpire(); // trigger auto-submit
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMinutes, onExpire]);

  return { timeRemaining };
}

// In ExamPage component:
const { timeRemaining } = useBatchTimer(
  sessionId,
  currentBatchIndex,
  batchStartedAt,
  timerDuration,
  () => handleAutoSubmit()
);

const handleAutoSubmit = async () => {
  // 1. Stop timer
  // 2. Show toast "Waktu habis! Mengirim jawaban..."
  // 3. Final sync
  await finalSync();
  // 4. Submit (no confirmation modal)
  await submitBatch();
};
```

## 6. Server-Side Timer Check (Safety Net)

```typescript
// In GET /api/exam/sessions/[id]/batch/[batchIndex] handler:

async function getBatch(sessionId: number, batchIndex: number, userId: number) {
  const session = await examService.getSession(sessionId, userId);
  const batch = await examService.getBatch(sessionId, batchIndex);

  // Server-side timer check
  if (
    session.timerEnabled &&
    batch.startedAt &&
    !batch.submittedAt
  ) {
    const endTime = batch.startedAt.getTime() + session.timerDuration * 60 * 1000;
    if (Date.now() > endTime) {
      // Timer expired while user was away — auto-submit
      await examService.autoSubmitBatch(sessionId, batchIndex, batch.answers);
      return { redirect: `/exam/session/${sessionId}/review/${batchIndex}` };
    }
  }

  // Set startedAt if first access
  if (!batch.startedAt && batchIndex === session.currentBatchIndex) {
    await examService.setBatchStartedAt(sessionId, batchIndex);
    batch.startedAt = new Date();
  }

  // Fetch questions by IDs (not by filter)
  const questions = await questionService.findByIds(batch.questionIds);
  // Strip correct answers
  const safeQuestions = stripCorrectAnswers(questions);

  return {
    questions: safeQuestions,
    answers: batch.answers,
    timer: {
      enabled: session.timerEnabled,
      duration: session.timerDuration,
      startedAt: batch.startedAt,
    },
  };
}
```

## 7. Grading Algorithm (reuse from Study Mode)

```typescript
// lib/services/examService.ts

function gradeAnswer(
  userAnswer: string,
  question: Question
): boolean {
  if (!userAnswer || userAnswer.trim() === "") return false;

  switch (question.questionType) {
    case "MULTIPLE_CHOICE":
      return parseInt(userAnswer) === question.correctOption;

    case "SHORT_ANSWER":
      const normalized = userAnswer.trim().toLowerCase();
      return question.acceptableAnswers.some(
        ans => ans.trim().toLowerCase() === normalized
      );

    case "ESSAY":
      const userNum = parseFloat(userAnswer.replace(",", "."));
      const correctNum = parseFloat(question.acceptableAnswers[0].replace(",", "."));
      return !isNaN(userNum) && !isNaN(correctNum) &&
             Math.abs(userNum - correctNum) < 0.001;

    default:
      return false;
  }
}

async function submitBatch(
  sessionId: number,
  batchIndex: number,
  userAnswers: Record<number, string>
) {
  const batch = await examService.getBatch(sessionId, batchIndex);

  // Prevent double submit
  if (batch.submittedAt) {
    throw new ValidationError("Batch sudah di-submit");
  }

  // Fetch questions with correct answers
  const questions = await questionService.findByIds(batch.questionIds);

  // Grade each answer
  const gradedAnswers: Record<number, {
    userAnswer: string;
    isCorrect: boolean;
    correctAnswer: string;
  }> = {};

  let totalCorrect = 0;
  for (const q of questions) {
    const userAnswer = userAnswers[q.id] || "";
    const isCorrect = gradeAnswer(userAnswer, q);
    if (isCorrect) totalCorrect++;

    gradedAnswers[q.id] = {
      userAnswer,
      isCorrect,
      correctAnswer: getCorrectAnswerText(q),
    };
  }

  const totalWrong = questions.length - totalCorrect;
  const score = Math.round((totalCorrect / questions.length) * 10000) / 100;

  // Save to DB
  await examService.updateBatch(sessionId, batchIndex, {
    answers: gradedAnswers,
    score,
    totalCorrect,
    totalWrong,
    submittedAt: new Date(),
  });

  // Update session
  const isLastBatch = batchIndex + 1 >= session.totalBatches;
  await examService.updateSession(sessionId, {
    currentBatchIndex: batchIndex + 1,
    status: isLastBatch ? "COMPLETED" : "ACTIVE",
  });

  // Update streak
  await streakService.updateStreak(session.userId);

  return { score, totalCorrect, totalWrong, gradedAnswers };
}
```

## 8. Data Flow: Exam Mode

```
┌──────────┐     POST /api/exam/sessions      ┌────────────┐
│  Client  │ ──────────────────────────────▶  │  Server    │
│ (Setup)  │                                  │            │
└──────────┘                                  │  1. Fetch  │
     │                                        │  questions  │
     │ Redirect to /exam/session/[id]/batch/0 │  2. Shuffle │
     ▼                                        │  3. Divide  │
┌──────────┐     GET /api/exam/.../batch/0   │  4. Create  │
│  Client  │ ◀──────────────────────────────  │  session   │
│ (Batch)  │                                  └────────────┘
│          │     PATCH /api/exam/.../sync (30s)
│          │ ──────────────────────────────▶  ┌────────────┐
│          │                                  │  Update    │
│          │                                  │  batch.    │
│          │                                  │  answers   │
│          │     POST /api/exam/.../submit   └────────────┘
│          │ ──────────────────────────────▶  ┌────────────┐
│          │                                  │  1. Grade   │
│          │                                  │  2. Score   │
│          │     Response: results            │  3. Update  │
│          │ ◀──────────────────────────────  │  4. Streak  │
└──────────┘                                  └────────────┘
     │
     ▼  Redirect to review page
┌──────────┐
│  Review  │ → BatchAnalytics → Next Batch or Summary
└──────────┘
```
