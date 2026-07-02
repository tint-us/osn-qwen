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

## 16. API Key Encryption in AppConfig (ADMIN — Implemented)

**Rule:** Sensitive config values (API keys) are stored encrypted in the `AppConfig` table using AES-256-GCM. Non-sensitive config (Base URL, system prompt, batch size, timer settings) stored as plain text. API keys are never returned in full to the client — only a masked sentinel `"••••••••"` (or empty string if no key is set).

**Why:** AppConfig is a generic key-value store (`key`, `value`, `isEncrypted`). Without encryption, the API key would be stored in plaintext in the DB. The masking pattern prevents the key from leaking to the browser even to admin users (defense in depth).

**Encryption implementation (actual — `lib/admin/config.ts`):**
```typescript
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;   // GCM standard is 12, not 16
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const ENCRYPTED_KEYS = ["ai_api_key"];  // only this key gets encrypted

function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;  // reuse existing env var, no separate ENCRYPTION_KEY
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured");
  return crypto.scryptSync(secret, "soalatihan-salt", KEY_LENGTH);
}

function encryptValue(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
  // Format: base64(iv + authTag + ciphertext) — single compact string
}

function decryptValue(ciphertext: string): string {
  const key = getEncryptionKey();
  const data = Buffer.from(ciphertext, "base64");
  const iv = data.subarray(0, IV_LENGTH);          // subarray, not slice (Node Buffer)
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
```

**Key differences from earlier design docs (IMPORTANT — use the actual implementation, not the docs):**
- Uses `NEXTAUTH_SECRET` (already required by the project) with `scryptSync` key derivation — NOT a separate `ENCRYPTION_KEY` env var. scryptSync provides key stretching (more secure than raw `Buffer.from(key, "utf8")`).
- IV length is 12 (GCM standard), not 16.
- Storage format is `base64(iv + tag + ciphertext)` (single compact string), NOT `hex:hex:hex` colon-delimited.
- Uses `Buffer.subarray()` not `Buffer.slice()` (subarray is the modern Node.js API).

**Masked sentinel pattern (GET + PUT config):**
- GET config: decrypt stored value, then return `"••••••••"` if a key exists, `""` if not. Do NOT return last 4 chars — full masking is safer.
- PUT config: check `if (apiKey === "••••••••")` → skip update (sentinel means "unchanged"). Only encrypt+store when the value differs from the sentinel.
- `shouldEncrypt(key)` checks against `ENCRYPTED_KEYS` array — controls which keys get encrypted vs stored plaintext.
- `upsertManyConfig(updates)` uses `Promise.all(updates.map(upsertConfig))` for batch updates — NOT a transaction (config writes are independent).

**How to apply:**
- Config values use `prisma.appConfig.upsert()` (create-or-update by unique `key`)
- If `NEXTAUTH_SECRET` env var is missing → `getEncryptionKey()` throws, caught by route handler → 500 error. Do NOT fall back to plaintext storage.
- GET endpoint returns three things in parallel: `configs` (all entries), `aiConfig` (masked), `examConfig` (parsed with defaults)

## 17. Streak Milestone Popup with localStorage Dedup (HISTORY)

**Rule:** Streak milestones (3/7/14/30 days) trigger a celebratory popup. To prevent re-showing on page refresh, a localStorage flag is set when the popup first displays. This is client-side only — no server-side tracking.

**Why:** Server-side tracking would require an extra DB table and API call. localStorage is sufficient for UX deduplication. The acknowledged trade-off (documented in edge-cases EC-HIST-09) is that clearing localStorage re-triggers the popup — acceptable because it's non-critical UX, not a security feature.

**How to apply:**
```typescript
// On page load, check if current streak matches a milestone and hasn't been shown
const storageKey = `streak-milestone-${milestone}-shown`;
if (currentStreak === latestMilestone && !localStorage.getItem(storageKey)) {
  setShow(true);
  localStorage.setItem(storageKey, "true");
}
```
- Milestone data (emoji + message) is a hardcoded constant map keyed by milestone day (3→⭐, 7→🎉, 14→🏆, 30→👑)
- Popup visual: gradient-bordered card (`bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500`), emoji in a circle, `scaleIn` CSS keyframe animation (scale 0.9→1, 300ms ease-out). The `scaleIn` keyframe must be defined in `globals.css` — it is NOT a built-in Tailwind animation.
- z-index: 50, backdrop: `bg-black/50`, click-outside-to-dismiss
- Multiple tabs: race condition means both tabs show popup — acceptable (documented in EC-HIST-04)
- **IMPORTANT:** No confetti library or confetti div animation is used — the design spec mentioned confetti but the actual implementation uses a gradient popup with emoji only, keeping it lightweight with zero extra dependencies

## 18. Chart Implementation — Pure SVG/CSS, No Chart Library (HISTORY)

**Rule:** Charts are implemented with pure SVG (line chart) and CSS bars (accuracy chart). `recharts` is NOT installed in the project and should NOT be added — the design docs mentioned recharts but actual implementation uses zero-dependency charts.

**Why:** Adding `recharts` would increase bundle size significantly (~400KB). For the two chart types needed (line + horizontal bars), hand-rolled SVG/CSS is simpler, has no runtime overhead, and avoids `--legacy-peer-deps` conflicts. The `package.json` has no chart library and the project philosophy is minimal dependencies.

**LineChart (BatchScoreChart) — score journey, pure SVG:**
- `<svg viewBox="0 0 600 220">` with manual padding (top:20, right:20, bottom:30, left:40)
- Y-axis grid: 5 horizontal lines at [0, 25, 50, 75, 100], dashed (except 0 baseline)
- Line path: `M x0 y0 L x1 y1 ...` built by mapping data points through `getX(i)` / `getY(score)` functions
- Area fill: append `L x_last y_base L x_first y_base Z` to the line path, `opacity:0.08`
- Data points: `<circle r=4>` with `<title>` for native browser tooltip (no custom tooltip component needed)
- X-axis labels: `<text>` elements, skip labels when >10 points to avoid clutter (`i % Math.ceil(len/8)`)
- Colors use `hsl(var(--primary))` and `hsl(var(--border))` — theme-aware via CSS variables
- Container: `overflow-x-auto` with `minWidth: 400px` for mobile horizontal scroll
- Empty state: text message in a `flex h-[200px] items-center justify-center` div

**BarChart (SubjectAccuracyChart) — horizontal bars, pure CSS:**
- Each bar: `<div className="h-3 w-full rounded-full bg-secondary">` container + inner `<div>` with `style={{ width: \`${accuracy}%\` }}`
- Dynamic color via class: green-500 >= 70%, yellow-500 >= 50%, red-500 < 50%
- Layout: `space-y-4`, each item has label row (matpel + stats) + bar row
- Sorted by `totalAttempts DESC` from the API (not by accuracy)
- Empty state: same pattern as line chart

**Shared color threshold function** (reused by CSS bars and could be used in SVG):
```typescript
function getBarColor(accuracy: number): string {
  if (accuracy >= 70) return "bg-green-500";
  if (accuracy >= 50) return "bg-yellow-500";
  return "bg-red-500";
}
```

**How to apply:**
- Never `npm install recharts` — use SVG `<path>`/`<circle>`/`<line>` for line charts, CSS `width:%` for bars
- SVG `viewBox` makes charts responsive — pair with `className="w-full"` and `overflow-x-auto` wrapper
- Use CSS variables (`hsl(var(--primary))`) in SVG attributes for theme consistency
- Loading state: skeleton block (`animate-pulse rounded-lg bg-muted`), NOT spinner

## 18a. GradedAnswers Storage in ExamBatch (HISTORY + EXAM cross-module)

**Rule:** When `submitBatch()` in `lib/exam/session.ts` persists the batch results, it stores the full `gradedAnswers` object (with `userAnswer`, `isCorrect`, `correctAnswer` per question) in `ExamBatch.answers` — NOT just the raw `cleanAnswers` (which was `{ questionId: userAnswer }`).

**Why:** The HISTORY module's session detail endpoint (`GET /api/history/sessions/[id]`) needs per-question grading results to display correct/wrong indicators in the SessionDetailModal. If only raw answers were stored, the history service would need to re-fetch all questions and re-grade them — duplicating grading logic and requiring `correctOption`/`acceptableAnswers` to be re-read from the DB. Storing graded results once at submit time is the single source of truth.

**The schema change is transparent:** `ExamBatch.answers` is a `Json` field (default `"{}"`), so it accepts any structure. The format changed from:
```json
{ "101": "1/3", "102": "0" }
```
to:
```json
{ "101": { "userAnswer": "1/3", "isCorrect": true, "correctAnswer": "1/3" },
  "102": { "userAnswer": "0", "isCorrect": false, "correctAnswer": "2" } }
```
The `submitBatch()` return value already used `gradedAnswers` for the response — the change was only in the `prisma.examBatch.update()` `data.answers` field (one line: `cleanAnswers` → `gradedAnswers`).

**How to apply:**
- The `__optionMap__` key (used during answering for MC shuffle remapping) is stripped before storing graded answers — the submit function already filters it out
- HISTORY's `getSessionDetail()` reads `batch.answers` only when `submittedAt !== null` (unsubmitted batches return `{}`)
- The `gradedAnswers` structure is also used by the exam review screen (`BatchReview` component), so both EXAM and HISTORY modules consume the same format

## 18b. Prisma JSON Path Filtering for Analytics (HISTORY)

**Rule:** The analytics endpoint filters exam sessions by `tingkat`/`level`/`matpel` stored inside the `ExamSession.filter` JSON field using Prisma's JSON path operators — not by joining to the Question table.

**Why:** `ExamSession.filter` is a `Json` field storing `{ tingkat, level, matpels, timerEnabled, timerDuration }`. Filtering by these values requires querying inside the JSON, since they're denormalized (the session's filter is captured at creation time, not a FK to Question). Prisma supports this natively via `path` + `equals` / `array_contains` operators.

**How to apply:**
```typescript
const jsonConditions: Prisma.ExamSessionWhereInput["filter"][] = [];
if (filter?.tingkat) {
  jsonConditions.push({ path: ["tingkat"], equals: filter.tingkat });
}
if (filter?.level) {
  jsonConditions.push({ path: ["level"], equals: filter.level });
}
if (filter?.matpel) {
  jsonConditions.push({ path: ["matpels"], array_contains: filter.matpel });
}
if (jsonConditions.length > 0) {
  sessionWhere.AND = jsonConditions.map((f) => ({ filter: f }));
}
```
- `array_contains` checks if a string exists in the `matpels` JSON array — single matpel filter only (the API contract specifies single `matpel` query param, not multi-select)
- When no filter is provided, no JSON conditions are added → returns all user sessions
- This pattern is PostgreSQL-specific (uses `@>` operator under the hood) — consistent with the project's PostgreSQL-only deployment

## 18c. Raw SQL Aggregation via $queryRawUnsafe (HISTORY)

**Rule:** The study-stats endpoint (`GET /api/history/study-stats`) uses `prisma.$queryRawUnsafe()` with parameterized queries to aggregate study attempts by matpel — Prisma's fluent API cannot express `GROUP BY` with `COUNT(CASE WHEN ...)`.

**Why:** The query joins `StudyAttempt` to `Question` (for `matpel`), groups by `matpel`, and counts correct/total. Prisma's `groupBy()` doesn't support cross-table joins or conditional aggregation (`COUNT(CASE WHEN sa."isCorrect" THEN 1 END)`). Raw SQL is the only option.

**How to apply — strictly parameterized, no string concatenation:**
```typescript
let query = `
  SELECT q."matpel",
         COUNT(*)::int AS "totalAttempts",
         COUNT(CASE WHEN sa."isCorrect" THEN 1 END)::int AS "totalCorrect"
  FROM "StudyAttempt" sa
  JOIN "Question" q ON sa."questionId" = q.id
  WHERE sa."userId" = $1
`;
if (filter?.tingkat) {
  query += ` AND q."tingkat" = $${paramIdx}`;
  params.push(filter.tingkat);
  paramIdx++;
}
query += ` GROUP BY q."matpel" ORDER BY "totalAttempts" DESC`;

const rows = await prisma.$queryRawUnsafe<
  { matpel: string; totalAttempts: number; totalCorrect: number }[]
>(query, ...params);
```
- **Security (per SECURITY.md):** Always use `$1`, `$2` positional parameters — NEVER interpolate user input directly into the SQL string. The `$queryRawUnsafe` name is misleading; it's safe as long as you use parameterized placeholders.
- The `::int` cast is required because PostgreSQL `COUNT(*)` returns `bigint`, which Prisma maps to `string` — casting to `int` ensures numeric typing in TypeScript.
- The typed generic `<Row[]>` tells Prisma the return shape for type safety.

## 19. Admin Self-Protection Rules (ADMIN)

**Rule:** An admin cannot deactivate their own account or change their own role. This is enforced at both client-side (button disabled + tooltip) and server-side (400 error).

**Why:** If the last active admin deactivates themselves or demotes themselves, they lose access with no way to undo it from the UI. Even with multiple admins, self-demotion is a footgun.

**How to apply:**
- Client: compare `userId === currentUserId` → disable toggle buttons, show tooltip "Tidak dapat menonaktifkan akun sendiri" / "Tidak dapat mengubah role sendiri"
- Server: in `updateUser()`, check `if (userId === currentUserId && data.isActive === false) throw 400` and `if (userId === currentUserId && data.role) throw 400`
- No restriction on deactivating/demoting OTHER admins — admin is trusted to manage peers
- No "minimum 1 admin" enforcement — acceptable risk (documented in EC-ADMIN-09)

## 20. DB Diagnostics Pattern (ADMIN — Implemented)

**Rule:** DB health check runs parallel `prisma.*.count()` queries inside a try/catch, measuring wall-clock latency around the entire batch. The client uses a manual "Refresh" button — NO auto-refresh interval. Returns a structured health object, NOT an HTTP error on failure.

**Why (differences from earlier design docs):** The design docs specified `prisma.$queryRaw\`SELECT 1\`` + 30s auto-refresh. Actual implementation uses count queries (which also test DB connectivity AND return useful stats in one call) and a manual refresh button (auto-refresh adds unnecessary load and the admin typically checks diagnostics on-demand, not continuously).

**Actual implementation (`lib/admin/stats.ts`):**
```typescript
export async function getDBHealth(): Promise<DBHealthStatus> {
  const start = Date.now();
  try {
    const [totalQuestions, totalUsers, totalExamSessions] = await Promise.all([
      prisma.question.count(),
      prisma.user.count(),
      prisma.examSession.count(),
    ]);
    const latency = Date.now() - start;
    return {
      connected: true,
      latency,         // number (ms), not string
      error: null,
      stats: { totalQuestions, totalUsers, totalExamSessions },
    };
  } catch (error) {
    const latency = Date.now() - start;
    return {
      connected: false,
      latency,
      error: error instanceof Error ? error.message : "Unknown database error",
      stats: { totalQuestions: 0, totalUsers: 0, totalExamSessions: 0 },
    };
  }
}
```

**How to apply:**
- The diagnostics endpoint (`GET /api/admin/diagnostics`) always returns HTTP 200 with `{ success: true, data: DBHealthStatus }` — even when DB is disconnected. The `connected: false` + `error` field communicates the failure, NOT an HTTP 500.
- Client component (`DBHealthCard`): green/red status dot, latency display, 3 stat tiles. Manual "Refresh" button calls `fetchHealth()` — no `setInterval`.
- Loading state: skeleton blocks (`animate-pulse rounded bg-muted`), not spinner.
- Error state: shows the error message in `text-destructive` below the red status dot.

## 20a. AdminLayout Sidebar Pattern (ADMIN — Implemented)

**Rule:** The admin section uses a client-component sidebar layout (`AdminLayout.tsx`) that replaces the original server-component header nav. The server layout (`app/(pages)/(admin)/layout.tsx`) handles only auth guard + redirect, then renders `<AdminLayout>{children}</AdminLayout>`.

**Why:** The sidebar provides persistent navigation for 6 admin sections (Dashboard, Bank Soal, Users, Config, Diagnostics, Import). Active link state requires `usePathname()` (client-side), which a server component cannot use. Splitting auth guard (server) from sidebar UI (client) keeps each component simple.

**How to apply:**
- `layout.tsx` (server): `await auth()` → redirect if not ADMIN → `<AdminLayout>{children}</AdminLayout>`. No nav markup here.
- `AdminLayout.tsx` (client): `usePathname()` to determine active link. Active = exact match for `/admin`, `startsWith` for all others.
- Sidebar: `hidden md:flex md:flex-col` (hidden on mobile, header has logo + logout only on mobile).
- Nav items: hardcoded array of `{ href, label, icon }` where icon is an SVG path data string.
- Active state: `bg-primary text-primary-foreground` vs `text-muted-foreground hover:bg-accent`.
- Logout: `<form action="/api/auth/signout" method="post">` — no JS needed, server-side signout.

## 20b. Question CRUD Validation Pattern (ADMIN — Implemented)

**Rule:** Question create/update goes through `validateQuestionInput()` in `lib/admin/questions.ts` BEFORE the Prisma write. Validation enforces enum values, sanitizes all text fields via `sanitizeText()`, and applies type-specific rules. The route handler returns `400` with joined error strings if validation fails.

**Why:** Import validation (Section 11) covers bulk import, but admin CRUD is a separate code path. Both must validate consistently, but admin CRUD also handles `imageUrl` (settable via form, unlike import where it's always null). The validation function returns a structured result `{ isValid, errors[], data | null }` — the `data` field is the sanitized/normalized input ready for Prisma.

**How to apply:**
- Enums validated via `["SD","SMP","SMA"].includes(tingkat)` etc. — case-normalized with `.toUpperCase().trim()` first.
- `sanitizeText()` applied to: content, explanation, matpel, imageUrl, each option, each acceptableAnswer.
- MC validation: `options.length >= 2`, `correctOption` is valid index `< options.length`.
- SA/ESSAY validation: `acceptableAnswers.length >= 1`.
- Validation returns sanitized `data` with fields conditionally cleared: MC gets `options: []` cleared for non-MC, `acceptableAnswers: []` cleared for MC.
- Route handler: `if (!result.isValid) return 400 with result.errors.join("; ")`.
- `contentPreview` (80-char truncation) is computed in `getQuestions()` list endpoint, NOT stored in DB.

## 20c. Live KaTeX Preview in Admin Forms (ADMIN — Implemented)

**Rule:** The `QuestionForm` component renders a live KaTeX preview of both the question content and explanation using the shared `QuestionDisplay` component. The preview updates on every keystroke (controlled input → state → re-render).

**Why:** Admin needs to verify LaTeX renders correctly before saving. Using the same `QuestionDisplay` component that students see ensures WYSIWYG consistency.

**How to apply:**
- Preview container: `<div className="rounded-md border bg-muted/30 p-3">` with a label "Preview (KaTeX)".
- Content input: `<textarea>` bound to `form.content` state.
- Preview render: `{form.content ? <QuestionDisplay content={form.content} /> : <span>Preview akan muncul di sini...</span>}`.
- Same pattern for explanation preview (second preview box below the explanation textarea).
- The `QuestionDisplay` component parses `$...$` (inline) and `$$...$$` (display) segments and renders each via `KatexRenderer`.
- No debounce needed — KaTeX rendering is fast enough for typical question-length text.

## Implementation Build Fixes (Phase 3A — AUTH + STUDY MODE coded)

Non-obvious issues hit during `next build` and their fixes. Apply proactively when implementing EXAM, CONTENT, HISTORY, ADMIN modules.

### 21. NextAuth v5 Edge Runtime Config Split (Critical)

**Problem:** `middleware.ts` imported `auth` from `lib/auth.ts`, which imports `bcryptjs` and `@prisma/client`. Next.js middleware runs in the Edge Runtime, which cannot use Node.js-native modules. Build fails or middleware throws at runtime.

**Fix:** Split NextAuth config into two files:
- `auth.config.ts` (root) — Edge-safe: only `pages`, `callbacks` (jwt/session), empty `providers: []`. No imports of Prisma or bcrypt. Uses `satisfies NextAuthConfig`.
- `lib/auth.ts` — Full config: imports `authConfig` from `auth.config.ts`, spreads it (`...authConfig`), adds `Credentials` provider with DB/bcrypt logic, adds `session` config.

`middleware.ts` creates its own `auth` via `NextAuth(authConfig)` (edge-safe), NOT via `lib/auth.ts`.

**How to apply:** Any future module that needs auth in middleware or edge contexts must import from `auth.config.ts`, never `lib/auth.ts`.

### 22. Middleware `req.auth` Type Cast

**Problem:** `req.auth` in middleware doesn't pick up the `next-auth/jwt` JWT augmentation (the `role` field). Build fails: `Property 'role' does not exist on type 'Session'`.

**Fix:** Cast explicitly: `const token = req.auth as { role?: string } | null;`

**Why:** NextAuth v5 beta's middleware types don't fully propagate custom JWT augmentation. The cast is safe because the callback always sets `token.role`.

### 23. TypeScript `baseUrl` Deprecation as Hard Build Error

**Problem:** Next.js build treats the `baseUrl` deprecation warning as a hard error: `Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0`.

**Fix:** Add `"ignoreDeprecations": "6.0"` to `tsconfig.json` `compilerOptions` (alongside `baseUrl`).

**Why:** The project uses `baseUrl: "."` + `paths: {"@/*": ["./*"]}` for the `@/` alias. Removing `baseUrl` would require switching to `paths`-only resolution, which has edge cases with Next.js. Silencing the deprecation is the pragmatic fix.

### 24. CSS Module Type Declaration

**Problem:** Build fails on CSS imports (`import "katex/dist/katex.min.css"`) with: `Cannot find module '...' or its corresponding type declarations`.

**Fix:** Create `types/css.d.ts` with: `declare module "*.css";`

**Why:** Next.js's own `next-env.d.ts` doesn't always include CSS module declarations, especially for CSS imported from `node_modules`. A standalone declaration file covers all CSS imports.

### 25. Prisma `DateTime` Field Comparison

**Problem:** `User.lastActiveDate` is `DateTime?` (Prisma), but streak service initially compared it to a string (`"2026-06-30"`), causing a type error: `Operator '===' cannot be applied to types 'Date' and 'string'`.

**Fix:** Convert `Date | null` to a comparable form before comparison:
```typescript
function isSameDay(a: Date | null, b: Date): boolean {
  if (!a) return false;
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
```
And create StreakLog entries with `Date` objects (start-of-day), not strings.

**How to apply:** Any code comparing Prisma `DateTime` fields must handle `Date` objects, not strings. The `toISOString().split("T")[0]` pattern works for creating log entries but NOT for comparing to a `DateTime` field returned from Prisma.

### 26. `react` Missing from package.json

**Problem:** `next build` failed with "Cannot find module 'react'". The project had `react-dom` in dependencies but not `react` itself.

**Fix:** `npm install react@^19 --legacy-peer-deps`

**Why:** The `--legacy-peer-deps` flag is required throughout this project because Next 15's peer dependency on React 19 conflicts with older transitive dependencies.

### 27. Import Statement Ordering

**Problem:** `Badge` import was accidentally placed at the bottom of `QuestionCard.tsx` (after the component function), causing potential issues.

**Fix:** Move all imports to the top of the file before any component definitions.

**How to apply:** Always verify import placement after large file generation — imports at the bottom work in some bundlers but are not idiomatic and can cause issues with strict linting.

## Cross-Module Dependencies (All Modules Now Documented — Phase 2 Complete)

- **STUDY** (Phase 2A): question fetching + shuffle, grading per type, correct-answer security, streak update, filter system.
- **AUTH** (Phase 2A): NextAuth credentials provider, JWT strategy, RBAC (ADMIN/SISWA), middleware route protection.
- **EXAM** (Phase 2B): reuses question fetching + shuffle, grading, correct-answer security, streak update, filter. Adds: session lifecycle, timer safety net, 30s sync, batch distribution, double-submit prevention.
- **CONTENT** (Phase 2B): must validate question fields match grading expectations (MC needs options+correctOption, SA/ESSAY need acceptableAnswers). Adds: file parsing (CSV/JSON/XML), HTML sanitization preserving LaTeX, bulk insert transaction, templates, static AI prompt.
- **HISTORY** (Phase 2C): reads from StudyAttempt (STUDY), ExamBatch (EXAM), StreakLog (both). Aggregates: examCorrect/Wrong from ExamBatch, studyCorrect/Wrong from StudyAttempt. Score journey chart from ExamBatch.submittedAt across sessions. Subject accuracy from StudyAttempt join Question.matpel. Streak milestone popup with localStorage dedup + CSS confetti.
- **ADMIN** (Phase 2C): reuses AUTH's user management (role/isActive toggles), Question CRUD, EXAM's AppConfig for batch size default. Adds: API key encryption (AES-256-GCM) in AppConfig, DB diagnostics ($queryRaw + parallel counts), admin self-protection rules, KaTeX live preview in question form, DataTable for question/user lists.
