---
name: soalatihan-design-patterns
description: Reusable design decisions and patterns for SoaLatihan module documentation — correct-answer security, MC shuffle remapping, grading, streak, Prisma conventions, exam timer/sync, content import sanitization, bulk insert, AI prompt
source: auto-skill
extracted_at: '2026-06-30T00:22:11.185Z'
---

# SoaLatihan Design Patterns

Established during Phase 1 + Phase 2A (AUTH + STUDY MODE). Apply these consistently when documenting/implementing EXAM, CONTENT, HISTORY, and ADMIN modules.

## 1. Correct-Answer Security (Critical for STUDY + EXAM)

**Rule:** Never send `correctOption` or `acceptableAnswers` to the client in GET responses. Only return the correct answer in the POST response *after* the attempt is saved to the database.

**Why:** Prevents answer leakage via network inspection / DevTools. The user specified "feedback instan setelah jawab" but not how to secure answers. This pattern was adopted in the STUDY MODE api-contract.md.

**How to apply:**
- GET `/api/questions` response: set `correctOption: null` and `acceptableAnswers: []` (stripped before sending)
- POST `/api/study/attempt` (or exam submit) response: return `{ isCorrect, correctAnswer, explanation }` — the server still has the original values in memory/DB
- EXAM mode batch submit should follow the same pattern: only reveal correct answers after all batch answers are submitted and graded

## 2. MC Shuffle with correctOption Remapping

**Rule:** When shuffling MULTIPLE_CHOICE options (server-side, Fisher-Yates), track original indices to remap `correctOption` to the new position.

**Why:** The user specified "urutan pilihan jawaban (MC) juga diacak" but didn't specify how to maintain correctOption correctness after shuffling. Naive shuffling would break the answer mapping.

**Algorithm:**
```
1. Build mapping: [{ text: option, originalIndex: i } for each option]
2. Shuffle the mapping array (Fisher-Yates)
3. newOptions = shuffled.map(item => item.text)
4. newCorrectOption = shuffled.findIndex(item => item.originalIndex === originalCorrect)
```

**How to apply:**
- Implement in `lib/services/study-service.ts` (and `exam-service.ts` for EXAM)
- Shuffle happens server-side, never client-side
- Shuffle per session/per fetch, not persisted to DB

## 3. Grading Normalization per Question Type

**Rule:** Each question type has specific normalization rules for comparing user answers to acceptable answers.

| Type | Normalization | Comparison |
|---|---|---|
| MULTIPLE_CHOICE | `parseInt(userAnswer)` | `=== question.correctOption` |
| SHORT_ANSWER | `trim().toLowerCase()` on both sides | Match against any item in `acceptableAnswers[]` |
| ESSAY | `parseFloat(userAnswer.replace(",", "."))` on both sides | Exact numeric match (no tolerance) |

**Why:** Indonesian locale uses comma as decimal separator. `parseFloat("3,14")` returns `3` in JS, which would cause wrong grading. The `.replace(",", ".")` normalization handles this.

**How to apply:**
- Same grading logic reused by both STUDY (per-question) and EXAM (batch auto-grade)
- For EXAM batch grading: iterate over all answers in the batch using the same logic
- `acceptableAnswers` for ESSAY contains the numeric answer as string (e.g., `"3.14"`)

## 4. Streak Calculation Pattern

**Rule:** Update streak on every answer submission (StudyAttempt or ExamBatch submit), using a per-day unique StreakLog entry.

**Algorithm:**
```
1. Check StreakLog for { userId, date: today }
2. If exists → skip (already counted today)
3. If not exists:
   a. Create StreakLog { userId, date: today, isActive: true }
   b. Compare User.lastActiveDate to yesterday:
      - If lastActiveDate == yesterday → streak = streak + 1 (consecutive)
      - If lastActiveDate != yesterday (or null) → streak = 1 (reset)
   c. Update User.lastActiveDate = today, User.streak = new value
```

**How to apply:**
- Both STUDY and EXAM modules call this after saving attempt/batch
- StreakLog has `@@unique([userId, date])` constraint — DB enforces one entry per user per day
- EXAM mode: update streak after batch submit, not per-question

## 5. Prisma Schema Conventions

Established in Phase 1 (`prisma/schema.prisma`):

- **Cascade deletes:** All FK relations use `onDelete: Cascade` — deleting a User removes their StudyAttempts, ExamSessions (→ ExamBatches), StreakLogs. Deleting a Question removes StudyAttempts referencing it.
- **Composite indexes:** Chosen based on expected query patterns:
  - `[tingkat, level, matpel]` on Question — primary filter for both Study and Exam
  - `[userId, status]` on ExamSession — resume check (find active session for user)
  - `[userId, answeredAt]` on StudyAttempt — analytics queries
  - `[sessionId, batchIndex]` unique on ExamBatch — prevents duplicate batch indexes
- **JSON defaults:** `options` defaults to `"[]"`, `answers` defaults to `"{}"` — prevents null handling in frontend
- **Enum at DB level:** All enums (Role, Tingkat, Level, QuestionType, ExamSessionStatus) are PostgreSQL enums, not strings — type safety at DB level

## 6. API Response Format

**Standard for all API routes** (from coding-standard.md):
```json
// Success
{ "success": true, "data": { ... } }

// Success with pagination
{ "success": true, "data": [...], "pagination": { "page": 1, "pageSize": 20, "total": 150, "totalPages": 8 } }

// Error
{ "success": false, "error": "Human-readable message" }
```

## 7. Zustand Scope Boundary

**Rule:** Zustand stores only hold UI session state (current question index, selected answers before submit, timer state). Never store DB data in Zustand.

**How to apply:**
- STUDY: `questions[]` fetched once → stored in Zustand → client-side navigation. Reset on exit/refresh.
- EXAM: `currentBatchIndex`, `selectedAnswers` per batch, `timerState` in Zustand. ExamSession persisted to DB for resume.
- Data that must survive refresh → DB (ExamSession), not Zustand

## 8. Module Documentation File Order

When documenting a new module, create files in this order (per AGENTS.md workflow):
1. `prd.md` (PM)
2. `user-stories.md` (PM)
3. `workflow.md` (Analyst)
4. `business-rules.md` (Analyst)
5. `edge-cases.md` (Analyst)
6. `architecture/feature-architecture.md` (Architect)
7. `architecture/backend-architecture.md` (Architect)
8. `architecture/web-architecture.md` (Architect)
9. `backend/api-contract.md` (API Designer)
10. `web/ui-flow.md` (FE Architect)
11. `web/component-guideline.md` (FE Architect)

## 9. Exam Session Lifecycle & Timer Safety Net (EXAM)

**Rule:** Only 1 ACTIVE ExamSession per user. Timer is checked server-side on every GET batch request — if `now() > startedAt + timerDuration` and `submittedAt === null`, the server auto-submits using the last synced answers.

**Why:** The client-side timer stops when the user loses connectivity. Without a server-side check, a disconnected user could reconnect after timer expiry and still answer. The server-side check is the authoritative safety net.

**How to apply:**
- On `GET /api/exam/sessions/[id]/batch/[batchIndex]`:
  1. Fetch batch, check `startedAt` and `submittedAt`
  2. If timer enabled + startedAt set + not submitted + expired → call `autoSubmitBatch()` with `batch.answers` (last sync), return `{ autoSubmitted: true, redirect: review }`
  3. If not expired: set `startedAt = now()` if null (first access), return questions + timer info
- Session status transitions: `ACTIVE → COMPLETED` (all batches done) or `ACTIVE → ABANDONED` (user starts new session)
- `createSession()` must check for existing ACTIVE session → reject with "resume or abandon first"
- `batchSize` and `timerDuration` are stored on ExamSession (immutable per session) — admin config changes don't affect in-progress sessions

## 10. Periodic Sync Mechanism (EXAM)

**Rule:** Client-side Zustand state syncs to DB every 30 seconds via `PATCH .../sync`. On failure, silent retry at next interval. Final sync happens before submit.

**Why:** Exam answers must survive disconnects. Zustand is volatile (lost on refresh), so DB is the source of truth for resume. 30s interval balances data safety vs server load.

**How to apply:**
- `useExamSync` hook: `setInterval(30_000)` → `PATCH` with `{ currentBatchIndex, answers, currentQuestionIndex }`
- Sync target: `ExamBatch.answers` (JSON field) — stores a map of `{ questionId: userAnswer }`
- On resume: `GET batch` returns `answers` from DB → Zustand repopulated
- On submit: call `finalSync()` then `POST .../submit` — ensures latest answers are graded
- Sync failures are non-blocking (toast "Gagal sync, akan mencoba lagi", retry next interval)
- Browser refresh: Zustand lost, but `GET batch` repopulates from last sync (max 30s progress loss)

## 11. Content Import Validation & Sanitization (CONTENT)

**Rule:** All imported question content is sanitized by stripping HTML tags (`/<[^>]*>/g`) while preserving LaTeX notation (`$...$` and `$$...$$`). Validation happens twice: once during preview parse, once before confirm insert.

**Why:** XSS prevention — imported files are untrusted. But LaTeX uses `$` delimiters not `< >`, so the HTML strip regex doesn't touch it. Double validation (preview + confirm) guards against client-side checkbox tampering.

**How to apply:**
- Sanitization function: `str.replace(/<[^>]*>/g, "").trim()` — applied to content, options[], explanation, acceptableAnswers[]
- LaTeX is automatically preserved (no `<` or `>` in `$...$` notation)
- Validation rules per questionType (enforced server-side on both preview AND confirm):
  - MC: `options.length >= 2`, `correctOption` is valid 0-based index `< options.length`
  - SA: `acceptableAnswers.length >= 1`
  - ESSAY: `acceptableAnswers.length >= 1`, `acceptableAnswers[0]` must be parseable as number
- `imageUrl` is NOT settable via import — always `null` for imported questions
- Invalid rows in preview are shown with error messages but NOT auto-excluded — admin can toggle which to import

## 12. Bulk Insert Transaction (CONTENT)

**Rule:** Mass question inserts use `prisma.$transaction()` with `createMany()` — all-or-nothing. If any question fails DB-level insertion, the entire batch rolls back.

**Why:** Partial imports create inconsistent state — admin wouldn't know which questions were saved. Transaction ensures atomicity.

**How to apply:**
```typescript
const count = await prisma.$transaction(async (tx) => {
  return tx.question.createMany({ data: sanitizedQuestions });
});
```
- Re-validate each question server-side before insert (don't trust client selection)
- No duplicate check — identical questions are allowed (content can repeat across imports)
- Performance target: 1000 questions in < 5s via single `createMany`

## 13. Static AI Prompt Pattern (CONTENT)

**Rule:** The AI conversion prompt is a hardcoded constant in the `AIPromptHelper` component, NOT stored in AppConfig DB. Copied to clipboard via `navigator.clipboard.writeText()`.

**Why:** The prompt is part of the application's fixed UX, not admin-configurable. Storing in DB would add unnecessary complexity (encryption, admin UI for editing). The prompt includes the JSON schema, per-type rules, LaTeX escaping instructions, and example output.

**How to apply:**
- `const STATIC_AI_PROMPT = "..."` in component file
- Read-only `<textarea>` displays the prompt
- "Copy AI Prompt" button → clipboard → toast "Prompt berhasil disalin"
- Prompt must specify: JSON array output, field schema, questionType rules, LaTeX escaping (`\\frac` in JSON), and 3 examples (MC, SA, ESSAY)

## 14. Batch Distribution Algorithm (EXAM)

**Rule:** Questions are shuffled (Fisher-Yates), then sliced into batches by `batchSize`. The last batch may be smaller.

**How to apply:**
```typescript
const batches: number[][] = [];
for (let i = 0; i < questionIds.length; i += batchSize) {
  batches.push(questionIds.slice(i, i + batchSize));
}
```
- Minimum 10 questions to start exam (enforces at least 1 full batch)
- Batch count = `Math.ceil(totalQuestions / batchSize)`
- Timer duration is the same for all batches (including the smaller last batch)
- Score = `(totalCorrect / totalQuestionsInBatch) * 100` — denominator is per-batch question count

## 15. Double-Submit Prevention (EXAM)

**Rule:** Prevent double batch submission via both client-side (button disable + `isSubmitting` flag) and server-side (`submittedAt !== null` check → 400 "Batch sudah di-submit").

**Why:** Network latency could allow a user to click "Submit" twice before the first request completes.

**How to apply:**
- Client: `setSubmitting(true)` on click, disable button
- Server: check `batch.submittedAt` before grading — if already set, return 400
- Multiple tabs: if tab A submits, tab B gets 400 when it tries (acceptable trade-off, no locking)

## 16. API Key Encryption in AppConfig (ADMIN)

**Rule:** Sensitive config values (API keys) are stored encrypted in the `AppConfig` table using AES-256-GCM. Non-sensitive config (Base URL, system prompt, batch size) stored as plain text. API keys are never returned in full to the client — only a masked representation (`••••••••` + last 4 chars).

**Why:** AppConfig is a generic key-value store (`key`, `value`, `isEncrypted`). Without encryption, the API key would be stored in plaintext in the DB. The masking pattern prevents the key from leaking to the browser even to admin users (defense in depth).

**Encryption implementation:**
```typescript
const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 char string

function encrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY, "utf8");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}
// Format: iv:authTag:encrypted (all hex)
```

**How to apply:**
- GET config: decrypt the stored value, then mask before returning to client: `••••••••${apiKey.slice(-4)}`
- PATCH config: if `apiKey` field is empty string → keep existing (do nothing). If non-empty → encrypt and store new value.
- If `ENCRYPTION_KEY` env var is missing → return 500 error, do NOT fall back to plaintext storage
- Config values use `prisma.appConfig.upsert()` (create-or-update by unique `key`)

## 17. Streak Milestone Popup with localStorage Dedup (HISTORY)

**Rule:** Streak milestones (3/7/14/30 days) trigger a celebratory popup with confetti animation. To prevent re-showing on page refresh, a localStorage flag (`milestone_{N}_shown`) is set when the popup first displays. This is client-side only — no server-side tracking.

**Why:** Server-side tracking would require an extra DB table and API call. localStorage is sufficient for UX deduplication. The acknowledged trade-off (documented in edge-cases EC-HIST-09) is that clearing localStorage re-triggers the popup — acceptable because it's non-critical UX, not a security feature.

**How to apply:**
```typescript
const flagKey = `milestone_${streak}_shown`;
if (localStorage.getItem(flagKey) === "true") return; // already shown
setShowPopup(true);
localStorage.setItem(flagKey, "true");
setTimeout(() => setShowPopup(false), 10_000); // auto-dismiss
```
- Milestone data (emoji + message) is a hardcoded constant map, not DB-driven
- Confetti: 30 div elements with random color/position/delay, CSS `confetti-fall` keyframe (3s linear infinite)
- Popup card: CSS `popup-scale` keyframe (scale 0→1.1→1, 300ms ease-out)
- z-index: 50, backdrop: `bg-black/50`
- Multiple tabs: race condition means both tabs show popup — acceptable (documented in EC-HIST-04)

## 18. recharts Integration Patterns (HISTORY)

**Rule:** Charts use `recharts` with `ResponsiveContainer`. Two chart types are established:

**LineChart (BatchScoreChart) — score journey:**
- X-axis: batch index (chronological), Y-axis: score (0-100 domain)
- Line: blue (#3b82f6), strokeWidth=2, dot r=4
- Custom tooltip via `content` prop (session date, batch number, score, filter info)
- Filter bar above chart (Tingkat/Level/Matpel dropdowns + Reset button)

**BarChart (SubjectAccuracyChart) — per-matpel accuracy:**
- `layout="vertical"` for horizontal bars
- X-axis: accuracy % (0-100), Y-axis: matpel names (category type)
- Dynamic bar color via `<Cell>`: green (#22c55e) >= 70%, yellow (#eab308) >= 50%, red (#ef4444) < 50%
- Data pre-sorted by accuracy descending from API

**Shared color threshold function** (reused by BarChart cells and progress bars):
```typescript
function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 70) return "#22c55e";
  if (accuracy >= 50) return "#eab308";
  return "#ef4444";
}
```

**How to apply:**
- Always wrap in `<ResponsiveContainer width="100%" height={300}>`
- Mobile: reduce height to 200px
- Empty state: "Belum cukup data" or "Belum ada data belajar" with CTA button
- Loading: skeleton block (not spinner)

## 19. Admin Self-Protection Rules (ADMIN)

**Rule:** An admin cannot deactivate their own account or change their own role. This is enforced at both client-side (button disabled + tooltip) and server-side (400 error).

**Why:** If the last active admin deactivates themselves or demotes themselves, they lose access with no way to undo it from the UI. Even with multiple admins, self-demotion is a footgun.

**How to apply:**
- Client: compare `userId === currentUserId` → disable toggle buttons, show tooltip "Tidak dapat menonaktifkan akun sendiri" / "Tidak dapat mengubah role sendiri"
- Server: in `updateUser()`, check `if (userId === currentUserId && data.isActive === false) throw 400` and `if (userId === currentUserId && data.role) throw 400`
- No restriction on deactivating/demoting OTHER admins — admin is trusted to manage peers
- No "minimum 1 admin" enforcement — acceptable risk (documented in EC-ADMIN-09)

## 20. DB Diagnostics Pattern (ADMIN)

**Rule:** DB health check uses `prisma.$queryRaw\`SELECT 1\`` with latency measurement. Stats are fetched in parallel via `Promise.all`. Results auto-refresh every 30 seconds on the client.

**Why:** A simple `SELECT 1` is the lightest possible DB round-trip. Measuring wall-clock time around it gives a reasonable latency estimate. Parallel counts avoid sequential round-trips.

**How to apply:**
```typescript
const startTime = Date.now();
try {
  await prisma.$queryRaw`SELECT 1`;
  const latency = Date.now() - startTime;
  const [q, u, s, a] = await Promise.all([
    prisma.question.count(), prisma.user.count(),
    prisma.examSession.count(), prisma.studyAttempt.count(),
  ]);
  return { status: "connected", latency: `${latency}ms`, stats: { ... } };
} catch {
  return { status: "disconnected", latency: "—", stats: { /* all "—" */ } };
}
```
- Client: `setInterval(() => refetch(), 30_000)` for auto-refresh
- Disconnected state: red status, "—" for all values, retry button
- The entire diagnostics endpoint is wrapped in try/catch — a DB failure returns 200 with `status: "disconnected"`, NOT a 500 error

## Cross-Module Dependencies (All Modules Now Documented — Phase 2 Complete)

- **STUDY** (Phase 2A): question fetching + shuffle, grading per type, correct-answer security, streak update, filter system.
- **AUTH** (Phase 2A): NextAuth credentials provider, JWT strategy, RBAC (ADMIN/SISWA), middleware route protection.
- **EXAM** (Phase 2B): reuses question fetching + shuffle, grading, correct-answer security, streak update, filter. Adds: session lifecycle, timer safety net, 30s sync, batch distribution, double-submit prevention.
- **CONTENT** (Phase 2B): must validate question fields match grading expectations (MC needs options+correctOption, SA/ESSAY need acceptableAnswers). Adds: file parsing (CSV/JSON/XML), HTML sanitization preserving LaTeX, bulk insert transaction, templates, static AI prompt.
- **HISTORY** (Phase 2C): reads from StudyAttempt (STUDY), ExamBatch (EXAM), StreakLog (both). Aggregates: examCorrect/Wrong from ExamBatch, studyCorrect/Wrong from StudyAttempt. Score journey chart from ExamBatch.submittedAt across sessions. Subject accuracy from StudyAttempt join Question.matpel. Streak milestone popup with localStorage dedup + CSS confetti.
- **ADMIN** (Phase 2C): reuses AUTH's user management (role/isActive toggles), Question CRUD, EXAM's AppConfig for batch size default. Adds: API key encryption (AES-256-GCM) in AppConfig, DB diagnostics ($queryRaw + parallel counts), admin self-protection rules, KaTeX live preview in question form, DataTable for question/user lists.
