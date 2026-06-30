# Architecture Principles — SoaLatihan

## 1. Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                             │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ Server Comp │  │ Client Comp │  │ Zustand     │  │ KaTeX     │ │
│  │ (RSC/SSR)   │  │ ("use       │  │ (UI state   │  │ Renderer  │ │
│  │             │  │  client")   │  │  only)      │  │           │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘  └───────────┘ │
│         │                │                                           │
└─────────┼────────────────┼───────────────────────────────────────────┘
          │                │
          │ HTML/JS/CSS    │ fetch() / server actions
          ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS (SERVER)                                │
│                                                                     │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐    │
│  │  App Router Pages   │    │  API Routes (/app/api/...)       │    │
│  │  (RSC / SSR)        │    │                                  │    │
│  │                     │    │  /api/auth/*        (AUTH)       │    │
│  │  /(auth)/login      │    │  /api/questions/*    (STUDY/EXAM) │    │
│  │  /(siswa)/study     │    │  /api/exam-sessions/*(EXAM)      │    │
│  │  /(siswa)/exam      │    │  /api/study-attempts/*(STUDY)    │    │
│  │  /(siswa)/history   │    │  /api/import/*       (CONTENT)   │    │
│  │  /(admin)/admin/*   │    │  /api/admin/*        (ADMIN)     │    │
│  └──────────┬──────────┘    └──────────────┬───────────────────┘    │
│             │                               │                       │
│             │   ┌────────────────────┐      │                       │
│             └──►│  lib/services/      │◄─────┘                       │
│                 │  (Business Logic +   │                              │
│                 │   Prisma Queries)    │                              │
│                 └──────────┬──────────┘                              │
│                            │                                         │
│                 ┌──────────┴──────────┐                              │
│                 │  lib/prisma.ts        │                             │
│                 │  (Prisma Client       │                             │
│                 │   Singleton)          │                             │
│                 └──────────┬──────────┘                              │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             │ SQL (parameterized queries via Prisma)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL                                     │
│                                                                     │
│  ┌────────┐  ┌──────────┐  ┌────────────┐  ┌──────────────┐       │
│  │ User   │  │ Question │  │ ExamSession│  │ ExamBatch    │       │
│  ├────────┤  ├──────────┤  ├────────────┤  ├──────────────┤       │
│  │ StudyAt│  │AppConfig │  │ StreakLog  │  │              │       │
│  │ tempt  │  │          │  │            │  │              │       │
│  └────────┘  └──────────┘  └────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Layer dan Tanggung Jawab

### Layer 1: Browser (Client)
| Komponen | Tanggung Jawab |
|---|---|
| **Server Components (RSC)** | Render halaman dengan data yang sudah di-fetch di server. Tidak ada interaktivitas. Mengirim HTML ke browser. |
| **Client Components** | Komponen interaktif: form, timer, soal dengan pilihan jawab, chart analitik. Menggunakan `"use client"`. |
| **Zustand Store** | Menyimpan UI session state sementara: current question index, selected answers (belum submit), timer state. Tidak menyimpan data dari DB. |
| **KaTeX Renderer** | Client-side rendering dari LaTeX dalam konten soal. Diisolasi di `components/shared/KatexRenderer.tsx`. |

### Layer 2: Next.js Server
| Komponen | Tanggung Jawab |
|---|---|
| **App Router Pages** | Routing, RBAC check (via middleware), render Server/Client Components. Halaman memanggil service layer untuk ambil data. |
| **API Routes** | Endpoint REST untuk operasi CRUD, import soal, exam session management. Menerima request, validasi input (Zod), panggil service layer, return standard response. |
| **Middleware** | Route protection: cek session + role. Redirect jika tidak authorized. Blokir akses `/admin/*` untuk non-admin, `/study/*`, `/exam/*` untuk non-siswa. |
| **lib/services/** | Business logic. Semua Prisma queries ada di sini. Dipanggil oleh pages (server-side) dan API routes. Validasi business rules. |
| **lib/prisma.ts** | Prisma Client singleton. Mencegah multiple connections di development (hot reload). |

### Layer 3: PostgreSQL
| Komponen | Tanggung Jawab |
|---|---|
| **Tables** | Persisten storage untuk users, questions, exam sessions, batches, study attempts, config, streak logs. |
| **Indexes** | Optimasi query pada userId, tingkat, level, matpel (filter soal), sessionId (batch lookup). |
| **Enums** | Type safety di database level: Role (ADMIN/SISWA), Tingkat (SD/SMP/SMA), Level (OSNK/OSNP/SEMIFINAL/FINAL), QuestionType (MULTIPLE_CHOICE/SHORT_ANSWER/ESSAY). |
| **Relations** | Foreign key constraints untuk data integrity: ExamSession → User, ExamBatch → ExamSession, StudyAttempt → User + Question. |

## 3. Data Flow — 3 Skenario

### Skenario A: Siswa Kerjakan Soal Study Mode

```
User jawab soal di browser
  │
  ▼
[Client Component: QuestionCard]
  │ User pilih jawaban / ketik jawaban
  │ Zustand: simpan selectedAnswer sementara
  │
  ▼
[POST /api/study-attempts]
  │ Body: { questionId, userAnswer }
  │
  ▼
[API Route Handler]
  │ Validasi input (Zod)
  │ Cek auth session (NextAuth)
  │
  ▼
[lib/services/study-service.ts]
  │ 1. Ambil question dari DB (questionId)
  │ 2. Cek jawaban:
  │    - MULTIPLE_CHOICE: bandingkan userAnswer dengan correctOption
  │    - SHORT_ANSWER: bandingkan userAnswer dengan acceptableAnswers[] (case-insensitive, trim)
  │    - ESSAY: extract angka dari userAnswer, bandingkan dengan acceptableAnswers[]
  │ 3. Simpan StudyAttempt ke DB (userId, questionId, userAnswer, isCorrect, answeredAt)
  │ 4. Update streak: cek StreakLog untuk hari ini
  │ 5. Return: { isCorrect, correctAnswer, explanation }
  │
  ▼
[API Route] → Response: { success: true, data: { isCorrect, correctAnswer, explanation } }
  │
  ▼
[Client Component]
  │ Tampilkan feedback: jawaban benar/salah + pembahasan
  │ Tampilkan tombol "Soal Berikutnya"
  │ Zustand: reset selectedAnswer, increment questionIndex
```

### Skenario B: Siswa Submit Batch Exam Mode

```
User klik "Submit Batch" di browser
  │
  ▼
[Client Component: ExamBatchView]
  │ Kumpulkan semua selectedAnswers dari Zustand
  │ Body: { sessionId, batchId, answers: { questionId: userAnswer, ... } }
  │
  ▼
[POST /api/exam-sessions/{sessionId}/batches/{batchId}/submit]
  │
  ▼
[API Route Handler]
  │ Validasi: batchId milik sessionId? batch belum di-submit? user adalah owner?
  │
  ▼
[lib/services/exam-service.ts]
  │ 1. Ambil semua questions untuk batch ini (questionIds[])
  │ 2. Auto-grade setiap jawaban:
  │    - MULTIPLE_CHOICE: correctOption index
  │    - SHORT_ANSWER: acceptableAnswers[] match
  │    - ESSAY: angka jawaban final
  │ 3. Hitung: totalCorrect, totalWrong, score
  │ 4. Simpan ke ExamBatch: answers (JSON), score, totalCorrect, totalWrong, submittedAt
  │ 5. Update ExamSession: currentBatchIndex++
  │ 6. Jika batch terakhir: set status = COMPLETED
  │ 7. Update StreakLog untuk hari ini
  │ 8. Return: { score, totalCorrect, totalWrong, answers: [...with correct answers + explanation] }
  │
  ▼
[API Route] → Response: { success: true, data: { score, totalCorrect, totalWrong, batchResults } }
  │
  ▼
[Client Component]
  │ Tampilkan hasil batch: skor, benar vs salah, pembahasan per soal
  │ Tampilkan analitik: line chart skor per batch
  │ Tampilkan tombol: "Batch Berikutnya" atau "Selesai"
  │ Zustand: reset exam state untuk batch berikutnya
```

### Skenario C: Admin Import Soal CSV

```
Admin upload file CSV di browser
  │
  ▼
[Client Component: ImportForm]
  │ File CSV dipilih
  │ POST multipart/form-data ke /api/import
  │
  ▼
[POST /api/import]
  │
  ▼
[API Route Handler]
  │ Cek auth: role === ADMIN
  │ Terima file upload
  │
  ▼
[lib/services/import-service.ts]
  │ 1. Parse CSV dengan papaparse
  │    - Kolom wajib: tingkat, level, matpel, questionType, content
  │    - Kolom kondisional: options, correctOption, acceptableAnswers, explanation, imageUrl
  │ 2. Validasi setiap row:
  │    - tingkat: SD/SMP/SMA
  │    - level: OSNK/OSNP/SEMIFINAL/FINAL
  │    - questionType: MULTIPLE_CHOICE/SHORT_ANSWER/ESSAY
  │    - MULTIPLE_CHOICE wajib: options[], correctOption
  │    - SHORT_ANSWER wajib: acceptableAnswers[]
  │    - ESSAY wajib: acceptableAnswers[] (angka jawaban final)
  │ 3. Return preview: daftar soal yang valid + daftar error
  │
  ▼
[API Route] → Response: { success: true, data: { valid: [...], errors: [...] } }
  │
  ▼
[Client Component]
  │ Tampilkan preview: tabel soal valid + tabel error
  │ Admin review → klik "Konfirmasi Simpan"
  │
  ▼
[POST /api/import/confirm]
  │ Body: { questions: [...] } (hanya yang valid)
  │
  ▼
[lib/services/import-service.ts]
  │ prisma.question.createMany({ data: questions })
  │
  ▼
[API Route] → Response: { success: true, data: { imported: count } }
  │
  ▼
[Client Component]
  │ Tampilkan: "X soal berhasil diimport"
  │ Reset form
```

## 4. Keputusan Arsitektur

### Kenapa Monorepo (Frontend + Backend + DB Schema dalam 1 project Next.js)
- **Konteks:** Tim kecil, project single-purpose, tidak ada tim frontend/backend terpisah.
- **Benefit:** Deployment sederhana (satu container), sharing types antara frontend-backend, tidak perlu API gateway, development setup cepat.
- **Trade-off:** Tidak bisa scale frontend dan backend independently. Acceptable karena traffic Siswa tidak akan massive.
- **Next.js App Router** sudah mendukung RSC + API Routes dalam satu project, jadi tidak perlu backend terpisah.

### Kenapa PostgreSQL
- **Relational data:** Soal, sesi, batch, attempt punya relasi yang jelas (foreign key, join query).
- **JSON support:** Field `options`, `answers`, `filter` disimpan sebagai JSON — PostgreSQL mendukung `Json` type native di Prisma.
- **Array support:** Field `acceptableAnswers` (String[]) dan `questionOrder` (Int[]) — PostgreSQL array type.
- **Enum support:** Role, Tingkat, Level, QuestionType sebagai database-level enum untuk type safety.
- **Maturity:** Battle-tested, ACID compliance, excellent Docker support.
- **Alternative dipertimbangkan:** MongoDB (kurang cocok untuk relasi), SQLite (kurang scalable untuk concurrent users).

### Kenapa Zustand (bukan Redux/Context API)
- **Minimal boilerplate:** Tidak perlu actions, reducers, dispatch. Langsung set state.
- **Scope yang jelas:** Hanya untuk UI session state (exam state, study state). Bukan global app state.
- **Performance:** Tidak cause unnecessary re-renders seperti Context API.
- **Ukuran kecil:** ~1KB, tidak menambah bundle size signifikan.
- **Tidak untuk data DB:** Data dari database selalu lewat Server Components → service layer → Prisma. Zustand tidak menjadi cache DB.

### Kenapa Docker Compose
- **Simplicity:** Satu command `docker compose up -d` untuk menjalankan app + database.
- **VPS-friendly:** Tidak perlu Kubernetes atau orchestration kompleks. Cukup VPS murah.
- **Isolation:** App dan DB jalan di container terpisah, network terisolasi.
- **Reproducible:** Environment sama di development dan production.
- **Persistent data:** Volume `pgdata` memastikan data tidak hilang saat container di-rebuild.
- **Support Cloudflare Tunnel:** App jalan di HTTP port 3000 di belakang tunnel, tidak perlu SSL di level app.

## 5. Integration Points Antar Modul

```
                    ┌─────────┐
                    │  AUTH   │
                    │         │
                    └────┬────┘
                         │
            Session + Role → semua modul butuh ini
                         │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌───────────┐
    │  STUDY   │   │   EXAM   │   │  ADMIN    │
    │          │   │          │   │           │
    └────┬─────┘   └────┬─────┘   └─────┬─────┘
         │              │               │
         │   ┌──────────┘               │
         │   │                          │
         ▼   ▼                          │
    ┌──────────┐                        │
    │ HISTORY  │◄───────────────────────┘
    │          │  (Admin lihat semua user's history)
    └──────────┘
         ▲
         │
    ┌──────────┐
    │ CONTENT  │
    │          │
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │ Question │  ← STUDY & EXAM baca Question
    │  (DB)    │  ← CONTENT & ADMIN tulis Question
    └──────────┘
```

### Detail Integration Points

| Dari | Ke | Interaksi |
|---|---|---|
| **AUTH → ALL** | Semua modul | NextAuth session menyediakan `userId` dan `role`. Middleware cek akses per route. Semua API route butuh valid session. |
| **STUDY → Question** | DB | Study Mode membaca soal dari tabel Question berdasarkan filter (tingkat, level, matpel). |
| **STUDY → HISTORY** | DB | Setiap StudyAttempt disimpan → muncul di analitik History. StreakLog diupdate. |
| **EXAM → Question** | DB | Exam Mode membaca soal dari Question, membagi ke batch. ExamSession menyimpan questionOrder (acak). |
| **EXAM → HISTORY** | DB | Setiap ExamBatch submit → skor masuk ke analitik. ExamSession status update. StreakLog diupdate. |
| **CONTENT → Question** | DB | Import menulis ke tabel Question (createMany). Validasi sebelum simpan. |
| **ADMIN → Question** | DB | CRUD soal manual (bukan import). |
| **ADMIN → User** | DB | Manajemen user: ubah role, nonaktifkan. |
| **ADMIN → AppConfig** | DB | Simpan konfigurasi AI (API Key, Base URL, System Prompt) — terenkripsi. |
| **ADMIN → HISTORY** | Read-only | Admin bisa lihat history semua user untuk monitoring. |
| **AUTH → StudyAttempt/ExamSession** | DB | Saat login, cek apakah ada ExamSession dengan status ACTIVE → tawarkan resume. |

### Key Integration Rules
1. **AUTH adalah gateway:** Tidak ada modul yang bisa diakses tanpa auth (kecuali landing page + login).
2. **Question adalah shared resource:** STUDY dan EXAM membaca, CONTENT dan ADMIN menulis. Tidak ada modul yang punya kepemilikan eksklusif.
3. **HISTORY adalah read-only aggregator:** Tidak menulis data, hanya membaca dari StudyAttempt + ExamBatch + StreakLog.
4. **CONTENT dipanggil oleh ADMIN:** Import soal hanya bisa dilakukan oleh Admin. CONTENT adalah tool untuk ADMIN.
5. **EXAM resume butuh AUTH:** Saat siswa login ulang, AUTH modul cek ExamSession status ACTIVE untuk user tersebut, tawarkan resume.
