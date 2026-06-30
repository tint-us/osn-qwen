# Workflow — HISTORY & ANALITIK Module

## 1. History Page Load Flow

```
/history
  │
  ▼
Parallel fetch (useEffect):
  ├── GET /api/history/sessions?page=1&limit=10
  ├── GET /api/history/analytics
  ├── GET /api/history/streak
  └── GET /api/history/study-stats
  │
  ▼
Loading skeletons for all sections
  │
  ▼
Data received:
  ├── SessionHistoryList ← sessions data
  ├── StatsCard x4 ← analytics data
  ├── StreakDisplay ← streak data
  ├── BatchScoreChart ← analytics.batchScores (all sessions)
  └── SubjectAccuracyChart ← study-stats data
  │
  ▼
Check streak milestone:
  │ User.streak === 3 | 7 | 14 | 30?
  │ AND not already shown (localStorage flag)?
  │
  ├── Yes → Show StreakMilestonePopup
  └── No → Skip
```

## 2. Session Detail Flow

```
User klik sesi di SessionHistoryList
  │
  ▼
GET /api/history/sessions/[id]
  │
  ▼
Server:
  │ 1. Verify session belongs to user
  │ 2. Fetch session + all batches
  │ 3. Return: session metadata + batch details
  │
  ▼
Client: open SessionDetailModal
  │ - Session info: tanggal, filter, status, skor rata-rata
  │ - Batch list: batch index, questionIds.length, score,
  │   totalCorrect, totalWrong, submittedAt
  │ - Progress bar per batch (visual skor)
  │
  ▼
User expand batch (optional):
  │ - Show per-question review (gradedAnswers from ExamBatch.answers)
  │ - Each: question content (truncated), user answer, isCorrect, correct answer
  │
  ▼
User close modal → return to history list
```

## 3. Chart Filter Flow

```
User change filter on BatchScoreChart
  │ (dropdown: matpel / level / tingkat)
  │
  ▼
GET /api/history/analytics?matpel=Matematika&level=OSNP&tingkat=SMA
  │
  ▼
Server:
  │ 1. Fetch ExamBatch where:
  │    - session.userId === currentUser
  │    - session.filter matches query params
  │ 2. Sort by submittedAt ascending
  │ 3. Return: batch scores array
  │
  ▼
Client: re-render BatchScoreChart with filtered data
```

## 4. Streak Update Flow

```
User melakukan aktivitas (study attempt atau exam batch submit)
  │
  ▼
Backend (Study Mode / Exam Mode):
  │ 1. Check User.lastActiveDate
  │ 2. If lastActiveDate === today → already logged, skip
  │ 3. If lastActiveDate === yesterday → streak++, create StreakLog
  │ 4. If lastActiveDate < yesterday → streak = 1, create StreakLog
  │ 5. Update User.streak + User.lastActiveDate = today
  │
  ▼
Saat user buka /history:
  │ GET /api/history/streak
  │ → Return { currentStreak, lastActiveDate }
  │
  ▼
Check milestone:
  │ currentStreak ∈ {3, 7, 14, 30}?
  │ localStorage.getItem(`milestone_${currentStreak}_shown`) !== 'true'?
  │
  ├── Yes → Show StreakMilestonePopup
  │         localStorage.setItem(`milestone_${currentStreak}_shown`, 'true')
  └── No → Skip
```

## 5. Milestone Popup Flow

```
StreakMilestonePopup triggered
  │
  ▼
Render:
  │ 1. Backdrop overlay (semi-transparent)
  │ 2. Modal card:
  │    - Scale animation: scale(0) → scale(1) (300ms ease-out)
  │    - Confetti effect: CSS keyframe particles falling
  │    - Emoji besar sesuai milestone
  │    - Pesan motivasi sesuai milestone
  │    - Tombol "Lanjut Belajar!"
  │ 3. Auto-dismiss timer: 10 seconds
  │
  ▼
Dismiss:
  │ - User klik "Lanjut Belajar!" → close
  │ - OR auto-dismiss after 10s → close
  │ - Cleanup: clear confetti animation, clear timer
  │
  ▼
Set localStorage flag:
  │ localStorage.setItem(`milestone_${streak}_shown`, 'true')
```

## 6. Analytics Aggregation Flow

```
GET /api/history/analytics
  │
  ▼
Server:
  │ 1. Fetch all ExamBatch for user (via ExamSession):
  │    - Sum totalCorrect → totalCorrectExam
  │    - Sum totalWrong → totalWrongExam
  │    - Collect batch scores for chart
  │
  │ 2. Fetch all StudyAttempt for user:
  │    - Count where isCorrect=true → totalCorrectStudy
  │    - Count where isCorrect=false → totalWrongStudy
  │    - Group by question.matpel for subject accuracy
  │
  │ 3. Aggregate:
  │    - totalQuestions = totalCorrectExam + totalWrongExam + totalStudyAttempts
  │    - totalCorrect = totalCorrectExam + totalCorrectStudy
  │    - totalWrong = totalWrongExam + totalWrongStudy
  │    - accuracy = (totalCorrect / (totalCorrect + totalWrong)) * 100
  │
  │ 4. Return: { totalQuestions, totalCorrect, totalWrong, accuracy, batchScores[] }
  │
  ▼
Client: populate StatsCards + BatchScoreChart
```

## 7. Subject Accuracy Flow

```
GET /api/history/study-stats
  │
  ▼
Server:
  │ 1. Fetch all StudyAttempt for user, join with Question for matpel
  │ 2. Group by matpel:
  │    - For each matpel: { total, correct, accuracy }
  │    - accuracy = (correct / total) * 100
  │ 3. Sort by accuracy descending
  │ 4. Return: array of { matpel, totalAttempts, totalCorrect, accuracy }
  │
  ▼
Client: render SubjectAccuracyChart (bar chart)
```
