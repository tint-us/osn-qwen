# Workflow — EXAM MODE Module

## 1. Exam Setup & Session Creation Flow

```
/study atau /exam
  │
  ▼
Pilih filter: tingkat + level + matpel (multi-select)
  │
  ▼
Halaman Setup:
  │ - batchSize: 10-30 (default 10)
  │ - timer: on/off
  │ - timerDuration: menit (default 30)
  │
  ▼ klik "Mulai Ujian"
POST /api/exam/sessions
  │ Body: { filter, batchSize, timerEnabled, timerDuration }
  │
  ▼
Server:
  │ 1. Fetch semua soal sesuai filter
  │ 2. Shuffle urutan soal (Fisher-Yates)
  │ 3. Shuffle MC options per soal
  │ 4. Bagi soal ke batch:
  │    batch[0] = questions[0..batchSize-1]
  │    batch[1] = questions[batchSize..2*batchSize-1]
  │    ...
  │    batch[last] = questions[sisa] (mungkin < batchSize)
  │ 5. Create ExamSession:
  │    - userId, filter, totalQuestions, batchSize
  │    - status: ACTIVE
  │    - questionOrder: [id1, id2, ...] (urutan acak)
  │    - currentBatchIndex: 0
  │ 6. Create ExamBatch records:
  │    - sessionId, batchIndex, questionIds[]
  │    - batch[0].startedAt = now()
  │ 7. Return session + batch[0] data
  │
  ▼
Redirect ke /exam/session/[id]/batch/0
```

## 2. Batch Execution Flow

```
/exam/session/[id]/batch/[batchIndex]
  │
  ▼
GET /api/exam/sessions/[id]/batch/[batchIndex]
  │
  ▼
Server:
  │ 1. Verify session exists, belongs to user, status=ACTIVE
  │ 2. Verify batchIndex === currentBatchIndex
  │ 3. If batch.startedAt is null: set startedAt = now()
  │ 4. Fetch questions for this batch (questionIds[])
  │ 5. Fetch sync data (answers from ExamBatch.answers JSON)
  │ 6. Return: questions[] + existing answers + timer info
  │
  ▼
Client:
  │ 1. Load questions + answers into Zustand
  │ 2. Start timer (if timerEnabled):
  │    - endTime = batch.startedAt + timerDuration
  │    - tick every 1 second
  │ 3. Start sync interval (30 seconds):
  │    - PATCH /api/exam/sessions/[id]/sync
  │ 4. Render first question
  │
  ▼
┌──────────────────────────────────────────┐
│  Loop: per soal dalam batch              │
│                                          │
│  1. Render soal (content + image + LaTeX)│
│  2. Render input sesuai questionType     │
│  3. User isi jawaban → Zustand update    │
│  4. Navigasi: Berikutnya / Sebelumnya    │
│  5. TIDAK ADA feedback                   │
│                                          │
│  Timer berjalan di background            │
│  Sync ke DB tiap 30 detik di background │
│                                          │
│  ── User klik "Submit Batch" ──         │
│  ATAU                                    │
│  ── Timer habis (auto-submit) ──        │
│                                          │
└──────────────────────────────────────────┘
```

## 3. Submit Batch Flow

```
User klik "Submit Batch" atau timer = 00:00
  │
  ▼
Modal konfirmasi (jika manual submit):
  │ "Submit batch ini? Soal belum dijawab: X"
  │ [Batal] [Submit]
  │
  ▼ (jika auto-submit: skip modal)
Final sync: PATCH /api/exam/sessions/[id]/sync (kirim semua jawaban)
  │
  ▼
POST /api/exam/sessions/[id]/batch/[batchIndex]/submit
  │ Body: { answers: { questionId: userAnswer, ... } }
  │
  ▼
Server:
  │ 1. Verify session, user, batchIndex
  │ 2. Verify batch belum di-submit (submittedAt === null)
  │ 3. Fetch all questions for this batch
  │ 4. Auto-grade setiap jawaban:
  │    - MC: parseInt(userAnswer) === correctOption
  │    - SA: trim+toLowerCase match against acceptableAnswers[]
  │    - ESSAY: parseFloat match against acceptableAnswers[]
  │ 5. Calculate: totalCorrect, totalWrong, score
  │ 6. Save ExamBatch:
  │    - answers: { questionId: { userAnswer, isCorrect, correctAnswer } }
  │    - score, totalCorrect, totalWrong
  │    - submittedAt = now()
  │ 7. Update ExamSession:
  │    - currentBatchIndex++
  │    - If last batch: status = COMPLETED
  │ 8. Update StreakLog
  │ 9. Return: batch results + all previous batch scores
  │
  ▼
Redirect ke /exam/session/[id]/review/[batchIndex]
```

## 4. Batch Review Flow

```
/exam/session/[id]/review/[batchIndex]
  │
  ▼
Render BatchReview:
  │ 1. Skor: X/100
  │ 2. Total benar, total salah
  │ 3. Review per soal:
  │    - Nomor soal
  │    - Konten soal (+ KaTeX)
  │    - Jawaban user (highlighted: green/red)
  │    - Jawaban benar
  │    - Pembahasan (+ KaTeX)
  │ 4. Analytics:
  │    - Line chart: skor per batch (1..N)
  │    - Bar chart: benar vs salah per batch
  │    - Skor rata-rata
  │
  ▼
Tombol:
  │ ├── Bukan batch terakhir → "Batch Berikutnya"
  │ │   └── Redirect ke /exam/session/[id]/batch/[batchIndex+1]
  │ │
  │ └── Batch terakhir → "Selesai"
  │     └── Redirect ke /exam/session/[id]/summary
```

## 5. Resume Flow

```
Siswa login → buka /exam
  │
  ▼
GET /api/exam/sessions/active
  │
  ▼
Server: cek ExamSession where userId AND status=ACTIVE
  │
  ├── Tidak ada → halaman normal (filter + setup)
  │
  └── Ada sesi ACTIVE
      │
      ▼
      Modal: "Anda memiliki sesi ujian yang belum selesai."
      │ "Batch tersisa: X dari Y"
      │ [Mulai Baru] [Resume]
      │
      ├── Resume
      │   └── Redirect ke /exam/session/[id]/batch/[currentBatchIndex]
      │       └── Load sync data dari DB ke Zustand
      │
      └── Mulai Baru
          └── DELETE /api/exam/sessions/[id]/abandon
              └── Set status = ABANDONED
              └── Redirect ke filter page
```

## 6. Sync Flow

```
Zustand state berubah (user jawab soal)
  │
  ▼
Setiap 30 detik (setInterval):
  │
  ▼
PATCH /api/exam/sessions/[id]/sync
  │ Body: {
  │   currentBatchIndex,
  │   answers: { questionId: userAnswer, ... },
  │   currentQuestionIndex
  │ }
  │
  ▼
Server:
  │ 1. Verify session exists, status=ACTIVE
  │ 2. Update ExamBatch.answers (JSON) untuk batch saat ini
  │ 3. Return { success: true }
  │
  ▼ Jika gagal
  Retry di interval berikutnya (30 detik)
  Tampilkan toast "Progress tersimpan" (subtle, tidak mengganggu)
```

## 7. Auto-Submit Flow (Timer Habis)

```
Timer countdown mencapai 00:00
  │
  ▼
Client:
  │ 1. Stop timer
  │ 2. Tampilkan toast "Waktu habis! Mengirim jawaban..."
  │ 3. Trigger submit (sama seperti manual submit, tanpa konfirmasi modal)
  │ 4. Kirim semua jawaban yang sudah diisi
  │    Jawaban kosong tetap dikirim (kosong = salah)
  │
  ▼
POST /api/exam/sessions/[id]/batch/[batchIndex]/submit
  │ (sama dengan manual submit flow)
  │
  ▼
Redirect ke review page
  │
  ▼
Review page menampilkan badge "Waktu habis"
```

## 8. Exit Flow

```
User navigasi away dari exam page
  │
  ▼
Cleanup:
  │ 1. Final sync ke DB (jika ada perubahan)
  │ 2. Clear timer interval
  │ 3. Clear sync interval
  │ 4. Zustand state tetap (tidak di-reset — untuk resume)
  │
  ▼
Sesi tetap ACTIVE di DB
User bisa resume nanti
```
