# GUIDE.md
## AI Software Factory — Panduan Eksekusi SoaLatihan

Panduan ini menjelaskan langkah-langkah eksekusi pembangunan SoaLatihan menggunakan pendekatan AI agent bertahap. **Dokumen dulu, coding belakangan.**

---

## Urutan Global Eksekusi

```
Phase 0 → Setup project & struktur folder
Phase 1 → Dokumentasi global (product overview, coding standard, arsitektur, schema DB)
Phase 2 → Dokumentasi per modul (per fitur, urut dari AUTH dulu)
Phase 3 → Implementasi per modul (setelah dokumen modul selesai)
Phase 4 → Integrasi & deployment
```

---

## Phase 0 — Setup Project

### Langkah 1: Buat struktur folder

```bash
mkdir -p soalatihan/docs/global
mkdir -p soalatihan/docs/features/_template/{architecture,backend,web,qa,release}
mkdir -p soalatihan/docs/features/{auth,study-mode,exam-mode,content-processing,history-analytics,admin-dashboard}
touch soalatihan/AGENTS.md
touch soalatihan/docs/global/{product-overview,coding-standard,architecture-principles,database-schema}.md
```

### Langkah 2: Init Next.js project

```bash
cd soalatihan
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false
npm install prisma @prisma/client
npm install next-auth@beta
npm install zustand
npm install katex
npm install papaparse fast-xml-parser
npm install -D @types/papaparse
npx prisma init
```

### Langkah 3: Salin AGENTS.md ke root project

Sudah ada di repo ini. Pastikan selalu dibaca agent sebelum mulai.

---

## Phase 1 — Dokumentasi Global

Sebelum masuk ke modul apapun, selesaikan dokumen global ini terlebih dahulu.

### Prompt: Product Overview Agent

```
Baca AGENTS.md terlebih dahulu.

Kamu adalah Product Manager Agent untuk project SoaLatihan.
Tugasmu adalah membuat file `docs/global/product-overview.md` yang berisi:

1. Deskripsi singkat aplikasi (2-3 kalimat)
2. Target pengguna: Admin dan Siswa — jelaskan kebutuhan masing-masing
3. Daftar modul: AUTH, STUDY, EXAM, CONTENT, HISTORY, ADMIN
4. Alur utama pengguna (siswa): Register → Login → Pilih filter → Study/Exam → Lihat hasil
5. Alur utama admin: Login → Kelola soal → Kelola user → Monitor sistem
6. Constraint teknis: Web only, Next.js monorepo, Docker deployment

Tulis dalam Bahasa Indonesia. Output hanya file docs/global/product-overview.md.
```

### Prompt: Coding Standard Agent

```
Baca AGENTS.md terlebih dahulu.

Kamu adalah System Architect Agent untuk project SoaLatihan.
Tugasmu adalah membuat file `docs/global/coding-standard.md` yang berisi:

1. Konvensi penamaan: file, komponen, fungsi, variabel, tabel DB
2. Struktur folder Next.js App Router yang wajib diikuti
3. Aturan Server Component vs Client Component
4. Aturan penggunaan Zustand (hanya untuk UI state session, bukan data dari DB)
5. Aturan API Routes: format response standar (success/error), HTTP status codes
6. Aturan Prisma: tidak boleh query langsung di komponen, wajib lewat lib/db atau server action
7. Aturan environment variables: tidak boleh hardcode, semua di .env
8. Aturan KaTeX: cara render, komponen wrapper yang harus dibuat
9. Aturan gambar soal: path convention, ukuran maksimal, format yang diterima

Tech stack: Next.js 15, Tailwind, shadcn/ui, Zustand, NextAuth v5, PostgreSQL, Prisma, KaTeX.
Tulis dalam Bahasa Indonesia. Output hanya file docs/global/coding-standard.md.
```

### Prompt: Architecture Principles Agent

```
Baca AGENTS.md terlebih dahulu.

Kamu adalah System Architect Agent untuk project SoaLatihan.
Tugasmu adalah membuat file `docs/global/architecture-principles.md` yang berisi:

1. Diagram arsitektur teknis (dalam bentuk teks/ASCII):
   - Browser → Next.js App (SSR/RSC) → API Routes → Prisma → PostgreSQL
   - Zustand hanya di client untuk exam/study session state
   - NextAuth untuk session management

2. Penjelasan tiap layer dan tanggung jawabnya

3. Data flow untuk 3 skenario utama:
   - User mengerjakan soal (Study Mode)
   - User submit batch (Exam Mode)
   - Admin import soal (CSV/JSON/XML)

4. Keputusan arsitektur penting:
   - Kenapa monorepo (tidak pisah BE/FE)
   - Kenapa PostgreSQL (relational, soal punya relasi kompleks)
   - Kenapa Zustand (lightweight, cukup untuk session state)
   - Deployment via Docker Compose (satu command, VPS-friendly)

5. Integration points antar modul

Tulis dalam Bahasa Indonesia. Output hanya file docs/global/architecture-principles.md.
```

### Prompt: Global Database Schema Agent

```
Baca AGENTS.md terlebih dahulu.

Kamu adalah Database Engineer Agent untuk project SoaLatihan.
Tugasmu adalah membuat file `docs/global/database-schema.md` DAN `prisma/schema.prisma`.

Desain schema untuk semua modul:

**Tabel yang dibutuhkan:**
- User (id, name, email, password, role: ADMIN|SISWA, isActive, createdAt, streak, lastActiveDate)
- Question (id, tingkat: SD|SMP|SMA, level: OSNK|OSNP|SEMIFINAL|FINAL, matpel, questionType: MULTIPLE_CHOICE|SHORT_ANSWER|ESSAY, content, imageUrl, options: Json, correctOption, acceptableAnswers: String[], explanation, createdAt, updatedAt)
- ExamSession (id, userId, filter: Json, totalQuestions, batchSize, status: ACTIVE|COMPLETED|ABANDONED, questionOrder: Int[], currentBatchIndex, createdAt, updatedAt)
- ExamBatch (id, sessionId, batchIndex, questions: Json, answers: Json, score, totalCorrect, totalWrong, startedAt, submittedAt)
- StudyAttempt (id, userId, questionId, isCorrect, answeredAt)
- AppConfig (id, key, value, isEncrypted, updatedAt)
- StreakLog (id, userId, date, isActive)

Pastikan:
- Semua relasi dengan foreign key yang tepat
- Index pada field yang sering di-query (userId, tingkat, level, matpel)
- JSON fields untuk data yang fleksibel (options, filter, questionOrder)
- Prisma schema valid dan bisa langsung `prisma migrate dev`

Output: docs/global/database-schema.md (penjelasan + ERD teks) DAN prisma/schema.prisma (schema siap pakai).
```

---

## Phase 2 — Dokumentasi Per Modul

Urutan eksekusi modul: **AUTH → STUDY → EXAM → CONTENT → HISTORY → ADMIN**

Untuk setiap modul, jalankan agent dalam urutan berikut:

### Urutan Agent Per Modul

```
1. PM Agent          → prd.md + user-stories.md
2. Analyst Agent     → workflow.md + business-rules.md + edge-cases.md
3. Architect Agent   → architecture/*.md
4. API Agent         → api-contract.md
5. FE Architect      → ui-flow.md + component-guideline.md
```

---

### MODUL 1: AUTH

#### PM Agent — AUTH
```
Baca AGENTS.md terlebih dahulu. Baca juga docs/global/product-overview.md.

Kamu adalah Product Manager Agent. Buat dokumentasi untuk modul AUTH:
- docs/features/auth/prd.md
- docs/features/auth/user-stories.md

Scope AUTH:
- Login dengan email + password
- Logout
- RBAC: role ADMIN dan SISWA
- Tidak ada registrasi publik — admin yang buat akun siswa
- Session management via NextAuth v5
- Proteksi route: /admin/* hanya ADMIN, /study|/exam|/history hanya SISWA login
- Halaman publik: landing page + login saja

Tulis dalam Bahasa Indonesia. Sertakan acceptance criteria per user story.
```

#### Analyst Agent — AUTH
```
Baca AGENTS.md. Baca docs/features/auth/prd.md dan user-stories.md.

Kamu adalah System Analyst Agent. Buat:
- docs/features/auth/workflow.md (flow login, logout, redirect berdasarkan role)
- docs/features/auth/business-rules.md (aturan session, aturan akses, aturan password)
- docs/features/auth/edge-cases.md (token expired, akun nonaktif, akses unauthorized, dll)
```

#### Architect Agent — AUTH
```
Baca AGENTS.md. Baca semua docs/features/auth/*.md dan docs/global/architecture-principles.md.

Kamu adalah System Architect Agent. Buat:
- docs/features/auth/architecture/feature-architecture.md
- docs/features/auth/architecture/backend-architecture.md (NextAuth config, middleware, callbacks)
- docs/features/auth/architecture/web-architecture.md (halaman login, redirect logic, session provider)
```

#### API Agent — AUTH
```
Baca AGENTS.md. Baca docs/features/auth/architecture/*.md dan docs/global/coding-standard.md.

Kamu adalah API Designer Agent. Buat docs/features/auth/backend/api-contract.md.

Endpoint yang dibutuhkan:
- POST /api/auth/[...nextauth] (NextAuth handler)
- GET /api/auth/session
- POST /api/admin/users (buat akun siswa — hanya ADMIN)
- PATCH /api/admin/users/[id] (ubah role/status)

Sertakan: method, path, request body, response sukses, response error, HTTP status codes.
```

#### FE Architect Agent — AUTH
```
Baca AGENTS.md. Baca docs/features/auth/ semua file.

Kamu adalah Frontend Architect Agent. Buat:
- docs/features/auth/web/ui-flow.md (flow halaman: landing → login → dashboard berdasarkan role)
- docs/features/auth/web/component-guideline.md (LoginForm, SessionProvider wrapper, RoleGuard component)

Gunakan shadcn/ui components. Sertakan layout dan state yang dibutuhkan tiap komponen.
```

---

### MODUL 2: STUDY MODE

#### PM Agent — STUDY
```
Baca AGENTS.md. Baca docs/global/product-overview.md dan docs/global/database-schema.md.

Kamu adalah Product Manager Agent. Buat:
- docs/features/study-mode/prd.md
- docs/features/study-mode/user-stories.md

Scope STUDY MODE:
- Siswa memilih filter wajib: tingkat (SD/SMP/SMA) + level OSN (OSNK/OSNP/SEMIFINAL/FINAL) + matpel (multi-select checkbox)
- Soal ditampilkan satu per satu, urutan dan pilihan jawaban (MC) diacak
- Feedback instan: jawaban benar + pembahasan muncul segera setelah menjawab
- Tipe soal: MULTIPLE_CHOICE (pilih opsi), SHORT_ANSWER (ketik jawaban), ESSAY (ketik angka final)
- Short answer: case-insensitive, cocokkan dengan acceptableAnswers[]
- Tidak ada sesi/batch — bebas berhenti kapan saja
- Progress tidak perlu disimpan (bebas)
- Setiap jawaban dicatat di StudyAttempt untuk analitik
```

#### Analyst Agent — STUDY
```
Baca AGENTS.md. Baca docs/features/study-mode/prd.md dan user-stories.md.

Buat:
- docs/features/study-mode/workflow.md
- docs/features/study-mode/business-rules.md
- docs/features/study-mode/edge-cases.md

Edge cases penting: tidak ada soal di filter yang dipilih, koneksi putus saat mengerjakan, LaTeX gagal render, soal memiliki gambar yang broken.
```

#### Architect + API + FE Architect Agent — STUDY
```
[Ikuti pola yang sama dengan AUTH — baca semua dokumen sebelumnya, lalu buat file architecture, api-contract, ui-flow, component-guideline untuk modul study-mode]

Komponen kunci yang perlu didefinisikan:
- FilterForm (tingkat, level, matpel)
- QuestionCard (render soal + gambar + KaTeX)
- AnswerInput (MC: radio buttons, Short Answer: text input, Essay: number input)
- FeedbackPanel (muncul setelah jawab: benar/salah + pembahasan)
- StudyProgress (nomor soal, total soal dari filter)
```

---

### MODUL 3: EXAM MODE

#### PM Agent — EXAM
```
Baca AGENTS.md. Baca docs/global/database-schema.md dan docs/features/study-mode/.

Kamu adalah Product Manager Agent. Buat:
- docs/features/exam-mode/prd.md
- docs/features/exam-mode/user-stories.md

Scope EXAM MODE:
- Filter sama dengan Study Mode (wajib lengkap)
- Setup exam: pilih ukuran batch (10-30 soal, default 10), aktifkan/nonaktifkan countdown timer, set durasi timer (jika aktif)
- Sistem sesi: seluruh soal dari filter diacak dan dibagi ke batch-batch, tidak ada pengulangan soal dalam 1 sesi
- Resume sesi: jika disconnect, saat login kembali ditawarkan resume atau mulai baru
- Selama ujian: jawaban dan pembahasan tersembunyi
- Submit per batch: baru muncul skor batch + review soal + pembahasan
- Analitik setelah setiap batch: skor batch, benar vs salah, perbandingan dengan batch sebelumnya
- Countdown timer: per batch, jika habis auto-submit
```

#### Analyst + Architect + API + FE Architect Agent — EXAM
```
[Ikuti pola yang sama — baca semua dokumen sebelumnya]

Komponen kunci:
- ExamSetup (filter + config batch + timer toggle)
- ResumeSessionModal (tawaran resume/mulai baru)
- ExamQuestion (tanpa feedback, soal diacak)
- BatchTimer (countdown, auto-submit jika habis)
- BatchReview (setelah submit: daftar soal, jawaban user, jawaban benar, pembahasan)
- BatchAnalytics (skor, benar/salah, perbandingan batch)
- ExamState (Zustand store: currentBatch, answers, timeLeft, sessionId)
```

---

### MODUL 4: CONTENT PROCESSING

#### PM Agent — CONTENT
```
Baca AGENTS.md. Baca docs/global/database-schema.md.

Buat:
- docs/features/content-processing/prd.md
- docs/features/content-processing/user-stories.md

Scope CONTENT PROCESSING:
- Admin bisa import soal via CSV, JSON, atau XML
- Setiap format memiliki template yang bisa didownload
- Ada halaman import dengan: upload file → preview data yang akan diimport → validasi → konfirmasi simpan
- Validasi: field mandatory, format tipe soal, format pilihan ganda, format acceptableAnswers
- Error handling: tampilkan baris mana yang error + alasannya
- Static AI prompt tersedia di UI (tombol "Copy Prompt") untuk membantu user convert PDF ke format import menggunakan AI eksternal (ChatGPT, Claude, dll)
- Prompt tersebut menjelaskan format CSV/JSON yang diharapkan dan contohnya
- LaTeX dalam konten soal tetap disimpan apa adanya (tidak diproses saat import)
- Gambar soal: import via URL atau upload terpisah (imageUrl field)
```

#### Analyst + Architect + API + FE Architect Agent — CONTENT
```
[Ikuti pola yang sama]

Format template yang harus didefinisikan:

CSV columns: tingkat,level,matpel,questionType,content,imageUrl,optionA,optionB,optionC,optionD,correctOption,acceptableAnswers,explanation

JSON format:
{
  "questions": [{
    "tingkat": "SD",
    "level": "OSNK",
    "matpel": "Matematika",
    "questionType": "MULTIPLE_CHOICE",
    "content": "Soal ...",
    "imageUrl": "",
    "options": ["A", "B", "C", "D"],
    "correctOption": 0,
    "acceptableAnswers": [],
    "explanation": "Pembahasan ..."
  }]
}

Static AI Prompt (untuk ditampilkan di UI):
"Konversikan soal-soal dari dokumen ini ke format JSON berikut: [sertakan format JSON di atas]. Pastikan:
- Tipe soal: MULTIPLE_CHOICE (pilihan ganda), SHORT_ANSWER (isian singkat), ESSAY (uraian angka)
- acceptableAnswers berisi array semua variasi jawaban yang diterima (untuk SHORT_ANSWER)
- correctOption adalah index pilihan jawaban yang benar (0=A, 1=B, 2=C, 3=D) untuk MULTIPLE_CHOICE
- Rumus matematika gunakan format LaTeX: $...$ untuk inline, $$...$$ untuk display
- Jika ada gambar/diagram, isi imageUrl dengan nama file gambar tersebut"
```

---

### MODUL 5: HISTORY & ANALITIK

#### PM Agent — HISTORY
```
Baca AGENTS.md. Baca docs/global/database-schema.md.

Buat:
- docs/features/history-analytics/prd.md
- docs/features/history-analytics/user-stories.md

Scope HISTORY & ANALITIK:
- Halaman riwayat: daftar semua sesi exam yang pernah dilakukan (tanggal, filter yang dipilih, total soal, skor rata-rata)
- Detail sesi: daftar batch dalam sesi, skor per batch, bisa klik untuk review ulang
- Grafik skor: line chart perjalanan skor per batch (across semua sesi) — "journey dari bodoh jadi pintar"
- Filter grafik: per matpel / level / tingkat
- Statistik kumulatif: total soal dikerjakan, total benar, total salah, akurasi keseluruhan
- Streak harian: berapa hari berturut-turut user aktif (belajar atau exam)
- Pop-up milestone streak: muncul saat mencapai streak 3, 7, 14, 30 hari — desain eye-catchy
- Analitik Study Mode: distribusi benar/salah per matpel dari StudyAttempt
```

#### Analyst + Architect + API + FE Architect Agent — HISTORY
```
[Ikuti pola yang sama]

Komponen kunci:
- SessionHistoryList (tabel riwayat sesi)
- BatchScoreChart (recharts LineChart — skor per batch)
- StatsCard (total soal, akurasi, streak)
- StreakMilestonePopup (animasi eye-catchy, muncul saat milestone)
- SubjectAccuracyChart (bar chart per matpel)
- SessionDetailModal (detail satu sesi + semua batch)
```

---

### MODUL 6: ADMIN DASHBOARD

#### PM Agent — ADMIN
```
Baca AGENTS.md. Baca semua docs/global/ dan docs/features/ yang sudah ada.

Buat:
- docs/features/admin-dashboard/prd.md
- docs/features/admin-dashboard/user-stories.md

Scope ADMIN DASHBOARD:
- Manajemen Bank Soal: CRUD soal (buat manual, edit, hapus, lihat daftar dengan filter + pagination)
- Manajemen User: lihat daftar user, buat akun siswa baru, ubah role, nonaktifkan akun
- Import Soal: terintegrasi dengan modul Content Processing
- Konfigurasi AI: form untuk simpan API Key (encrypted), Base URL, System Prompt — tersimpan di AppConfig
- Diagnostik DB: health check koneksi DB, stats (total soal per matpel/level, total user, total sesi aktif)
- Konfigurasi Exam: set default batch size (10-30)
- Dashboard home: ringkasan statistik platform
```

#### Analyst + Architect + API + FE Architect Agent — ADMIN
```
[Ikuti pola yang sama]

Komponen kunci:
- AdminLayout (sidebar navigasi)
- QuestionTable (daftar soal + filter + pagination)
- QuestionForm (buat/edit soal — support KaTeX preview live + upload gambar)
- UserTable (daftar user + aksi)
- AIConfigForm (API key tersimpan encrypted, field base URL + system prompt)
- DBHealthCard (status koneksi + stats)
- AdminStatsOverview (total soal, user, sesi — di dashboard home)
```

---

## Phase 3 — Implementasi Per Modul

Setelah semua dokumen modul selesai, jalankan agent implementasi:

### Backend Developer Agent — Per Modul

```
Baca AGENTS.md. Baca docs/global/coding-standard.md dan docs/global/database-schema.md.
Baca docs/features/[modul]/backend/api-contract.md dan docs/features/[modul]/architecture/backend-architecture.md.

Kamu adalah Backend Developer Agent. Implementasikan semua API routes untuk modul [NAMA MODUL]:

- Buat file di app/api/[path sesuai api-contract]/route.ts
- Gunakan Prisma client dari lib/prisma.ts
- Ikuti format response standar dari coding-standard.md
- Semua logic di lib/ atau server action — tidak langsung di route handler
- Validasi input di setiap endpoint
- Handle error dengan response yang informatif

Jangan ubah file di luar app/api/ dan lib/.
```

### Frontend Developer Agent — Per Modul

```
Baca AGENTS.md. Baca docs/global/coding-standard.md.
Baca docs/features/[modul]/web/ui-flow.md dan component-guideline.md.
Baca docs/features/[modul]/backend/api-contract.md (untuk tahu endpoint yang tersedia).

Kamu adalah Frontend Developer Agent. Implementasikan UI untuk modul [NAMA MODUL]:

- Buat halaman di app/(pages)/[path]/page.tsx
- Buat komponen di components/[modul]/
- Gunakan shadcn/ui untuk komponen dasar
- Gunakan Tailwind untuk styling
- Untuk soal matematika: buat wrapper komponen KaTeX yang reusable di components/shared/KatexRenderer.tsx
- Zustand store hanya untuk: exam session state, study session state
- Fetch data via server component atau API route — tidak langsung query DB di client
- Responsive design: mobile-first

Jangan ubah file di luar app/(pages)/, components/, hooks/, store/.
```

---

## Phase 4 — Docker & Deployment

### Release Agent

```
Baca AGENTS.md. Baca docs/global/ semua file. Pastikan semua modul sudah DONE (Definition of Done terpenuhi).

Kamu adalah Release Agent. Buat file deployment:

1. Dockerfile (multi-stage build: builder + runner)
2. docker-compose.yml dengan 2 service:
   - app: Next.js (port 3000), depends on db, env_file: .env
   - db: PostgreSQL 16 (port 5432), volume untuk data persistent

3. .env.example dengan semua variable yang dibutuhkan:
   - DATABASE_URL
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL
   - (tambahkan yang lain sesuai kebutuhan)

4. docs/features/admin-dashboard/release/deployment-checklist.md:
   - Langkah deploy ke VPS baru (step by step)
   - Langkah update aplikasi (rolling update)
   - Backup database
   - Troubleshooting umum

Pastikan: docker compose up -d cukup untuk menjalankan seluruh aplikasi.
```

---

## Ringkasan Urutan Eksekusi

```
[Project Brief]
      ↓
[Phase 0] Setup folder & init Next.js
      ↓
[Phase 1] Dokumentasi Global
  → product-overview.md
  → coding-standard.md
  → architecture-principles.md
  → database-schema.md + prisma/schema.prisma
      ↓
[Phase 2] Dokumentasi Per Modul (urut: AUTH → STUDY → EXAM → CONTENT → HISTORY → ADMIN)
  Per modul:
  PM Agent → Analyst Agent → Architect Agent → API Agent → FE Architect Agent
      ↓
[Phase 3] Implementasi Per Modul
  Per modul:
  BE Developer Agent → FE Developer Agent → QA Agent
      ↓
[Phase 4] Docker & Deployment
  Release Agent
      ↓
[DONE] docker compose up -d → aplikasi jalan 🚀
```
