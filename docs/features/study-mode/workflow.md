# Workflow — STUDY MODE Module

## 1. Study Mode Overall Flow

```
Siswa login → /dashboard
  │
  ▼
Klik "Study Mode"
  │
  ▼
/study → halaman filter
  │
  ▼
Pilih filter: tingkat + level + matpel (multi)
  │
  ▼
Klik "Mulai Latihan"
  │
  ▼
GET /api/questions?tingkat=&level=&matpel=matpel1,matpel2
  │
  ▼
Server:
  │ 1. Query Question dengan filter
  │ 2. Acak urutan soal (Fisher-Yates shuffle)
  │ 3. Untuk MULTIPLE_CHOICE: acak urutan options per soal
  │ 4. Return array soal
  │
  ▼
Client: simpan urutan soal di Zustand
  │
  ▼
Tampilkan soal pertama (index 0)
  │
  ▼
┌──────────────────────────────────────────┐
│  Loop: per soal                          │
│                                          │
│  1. Render soal (content + image + LaTeX)│
│  2. Render input sesuai questionType:    │
│     - MC: radio buttons                  │
│     - SA: text input                     │
│     - ESSAY: number input                │
│  3. User isi jawaban                     │
│  4. Klik "Submit Jawaban"                │
│  5. POST /api/study/attempt              │
│  6. Server: grade jawaban               │
│  7. Simpan StudyAttempt ke DB            │
│  8. Update StreakLog                     │
│  9. Return { isCorrect, explanation }    │
│ 10. Tampilkan feedback                   │
│ 11. Klik "Soal Berikutnya" / "Selesai"   │
│                                          │
│ └─→ next soal (index++)                  │
└──────────────────────────────────────────┘
  │
  ▼ (selesai atau keluar)
Kembali ke /dashboard
```

## 2. Grading Flow (Server-side)

```
POST /api/study/attempt
  │ Body: { questionId, userAnswer }
  │
  ▼
Validasi input (Zod)
  │ ── invalid → 400
  │
  ▼
Cek auth session (SISWA)
  │ ── no session → 401
  │
  ▼
Fetch question dari DB by questionId
  │ ── not found → 404
  │
  ▼
Grade berdasarkan questionType:
  │
  ├── MULTIPLE_CHOICE
  │   │ userAnswer = index pilihan (string)
  │   │ Bandingkan: parseInt(userAnswer) === question.correctOption
  │   └── correct/incorrect
  │
  ├── SHORT_ANSWER
  │   │ userAnswer = text (string)
  │   │ Normalize: trim + toLowerCase
  │   │ Bandingkan dengan setiap item di acceptableAnswers[]
  │   │   (juga di-trim + toLowerCase)
  │   └── match found → correct; no match → incorrect
  │
  └── ESSAY
      │ userAnswer = number (string)
      │ Parse: parseFloat(userAnswer)
      │ Bandingkan dengan setiap item di acceptableAnswers[]
      │   (juga di-parse sebagai float)
      │   Toleransi: tidak ada (exact match numerik)
      └── match found → correct; no match → incorrect
  │
  ▼
Simpan StudyAttempt:
  │ { userId, questionId, userAnswer, isCorrect, answeredAt: now() }
  │
  ▼
Update StreakLog:
  │ Cek apakah sudah ada entry untuk hari ini
  │ ── belum ada → create StreakLog { userId, date: today, isActive: true }
  │                Update User.streak:
  │                  jika lastActiveDate == yesterday → streak++
  │                  jika lastActiveDate != yesterday → streak = 1
  │                Update User.lastActiveDate = today
  │ ── sudah ada → skip (streak sudah dihitung hari ini)
  │
  ▼
Return response:
  │ { success: true, data: { isCorrect, correctAnswer, explanation } }
```

## 3. Randomization Algorithm

```
Fetch questions dari DB (with filter)
  │
  ▼
questions = [...] // array dari Question
  │
  ▼
Shuffle urutan soal (Fisher-Yates):
  │ for i = questions.length - 1; i > 0; i--
  │   j = random(0, i)
  │   swap(questions[i], questions[j])
  │
  ▼
Untuk setiap soal MULTIPLE_CHOICE:
  │ originalOptions = question.options // ["A. ...", "B. ...", ...]
  │ originalCorrect = question.correctOption // index
  │
  │ Buat mapping: [{ text: option, originalIndex: i }]
  │ Shuffle array mapping (Fisher-Yates)
  │
  │ newOptions = shuffled.map(item => item.text)
  │ newCorrect = shuffled.findIndex(item => item.originalIndex === originalCorrect)
  │
  │ question.options = newOptions
  │ question.correctOption = newCorrect
  │
  ▼
Return questions (sudah diacak soal + options)
```

## 4. Exit Flow

```
User klik "Keluar" atau navigasi away
  │
  ▼
Tidak ada konfirmasi (langsung keluar)
  │
  ▼
Zustand store di-reset (clear study state)
  │
  ▼
Redirect ke /dashboard
  │
  ▼
Soal yang sudah dijawab tetap tersimpan di DB (StudyAttempt)
Soal yang belum dijawab tidak dicatat
```
