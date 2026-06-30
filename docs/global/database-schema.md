# Database Schema — SoaLatihan

## ERD (Entity Relationship Diagram)

```
┌──────────────────────┐         ┌──────────────────────────────┐
│       User           │         │          Question             │
├──────────────────────┤         ├──────────────────────────────┤
│ id          Int  PK  │         │ id                Int  PK    │
│ name        String   │         │ tingkat           Enum       │
│ username    String UQ│         │ level             Enum       │
│ email      String? UQ│         │ matpel            String     │
│ password    String   │         │ questionType      Enum       │
│ role        Enum     │         │ content           String     │
│ isActive    Boolean  │         │ imageUrl          String?    │
│ createdAt   DateTime │         │ options           Json       │
│ streak      Int      │         │ correctOption     Int?       │
│ lastActiveDate Date? │         │ acceptableAnswers String[]   │
└──────┬───────────────┘         │ explanation       String     │
       │                         │ createdAt         DateTime   │
       │ 1                       │ updatedAt         DateTime   │
       │ N                       └──────┬───────────────────────┘
       │                                │
       │                                │ 1
       │                                │
       │                                │ N
       │                         ┌──────┴───────────────────────┐
       │                         │      StudyAttempt             │
       │                         ├───────────────────────────────┤
       │                         │ id          Int  PK           │
       ├─────────────────────────│ userId      Int  FK → User    │
       │                         │ questionId  Int  FK → Question│
       │                         │ userAnswer  String           │
       │                         │ isCorrect   Boolean           │
       │                         │ answeredAt  DateTime          │
       │                         └───────────────────────────────┘
       │
       │ 1                       ┌──────────────────────────────┐
       │                         │        ExamSession           │
       │ N                      ├──────────────────────────────┤
       ├─────────────────────────│ id                Int  PK    │
       │                         │ userId            Int  FK → User
       │                         │ filter            Json       │
       │                         │ totalQuestions    Int        │
       │                         │ batchSize         Int        │
       │                         │ status            Enum       │
       │                         │ questionOrder     Int[]      │
       │                         │ currentBatchIndex Int        │
       │                         │ createdAt         DateTime   │
       │                         │ updatedAt         DateTime   │
       │                         └──────┬───────────────────────┘
       │                                │
       │                                │ 1
       │                                │
       │                                │ N
       │                         ┌──────┴───────────────────────┐
       │                         │        ExamBatch             │
       │                         ├──────────────────────────────┤
       │                         │ id           Int  PK         │
       │                         │ sessionId    Int  FK → ExamSession
       │                         │ batchIndex   Int            │
       │                         │ questionIds  Int[]          │
       │                         │ answers      Json            │
       │                         │ score        Float          │
       │                         │ totalCorrect Int            │
       │                         │ totalWrong   Int            │
       │                         │ startedAt    DateTime       │
       │                         │ submittedAt  DateTime?      │
       │                         └──────────────────────────────┘
       │
       │ 1                       ┌──────────────────────────────┐
       │ N                      │        StreakLog              │
       ├─────────────────────────│ id          Int  PK           │
       │                         │ userId      Int  FK → User    │
       │                         │ date        Date             │
       │                         │ isActive    Boolean          │
       │                         └──────────────────────────────┘
       │
       │                  ┌──────────────────────────────┐
       │                  │        AppConfig              │
       │ (no FK to User)  ├──────────────────────────────┤
       │                  │ id           Int  PK          │
       │                  │ key          String UQ        │
       │                  │ value        String           │
       │                  │ isEncrypted  Boolean           │
       │                  │ updatedAt    DateTime         │
       │                  └──────────────────────────────┘
```

## Penjelasan Setiap Tabel

### 1. User

| Field | Type | Keterangan |
|---|---|---|
| `id` | Int (PK, autoincrement) | Primary key |
| `name` | String | Nama lengkap user |
| `username` | String (unique) | Identifikasi utama pengguna untuk masuk ke sistem, bersifat unik |
| `email` | String? (unique, nullable) | Opsional, pelengkap dari username, jika diisi harus unik |
| `password` | String | Password hash (bcrypt) — tidak pernah disimpan plain text |
| `role` | Enum: `ADMIN`, `SISWA` | Role-based access control |
| `isActive` | Boolean (default: true) | Admin bisa nonaktifkan akun tanpa delete |
| `createdAt` | DateTime (default: now) | Kapan akun dibuat |
| `streak` | Int (default: 0) | Jumlah hari berturut-turut user aktif |
| `lastActiveDate` | DateTime? (date only) | Tanggal aktivitas terakhir — untuk kalkulasi streak |

**Indexes:** `username` (unique), `email` (unique), `role`

**Catatan:**
- username adalah identitas utama login. Email bersifat pelengkap dan tidak wajib diisi.

**Relasi:**
- 1 User → N StudyAttempt
- 1 User → N ExamSession
- 1 User → N StreakLog

---

### 2. Question

| Field | Type | Keterangan |
|---|---|---|
| `id` | Int (PK, autoincrement) | Primary key |
| `tingkat` | Enum: `SD`, `SMP`, `SMA` | Tingkat pendidikan |
| `level` | Enum: `OSNK`, `OSNP`, `SEMIFINAL`, `FINAL` | Level kompetisi OSN |
| `matpel` | String | Mata pelajaran (misal: "Matematika", "Fisika") |
| `questionType` | Enum: `MULTIPLE_CHOICE`, `SHORT_ANSWER`, `ESSAY` | Tipe soal — per soal, bukan per level |
| `content` | String (text) | Isi soal, LaTeX dengan `$...$` dan `$$...$$` |
| `imageUrl` | String? (nullable) | Path ke gambar soal di `/public/uploads/questions/` |
| `options` | Json | Array pilihan jawaban untuk MULTIPLE_CHOICE — `["A. ...", "B. ...", ...]` |
| `correctOption` | Int? (nullable) | Index jawaban benar (0-based) untuk MULTIPLE_CHOICE |
| `acceptableAnswers` | String[] | Variasi jawaban yang diterima untuk SHORT_ANSWER dan ESSAY |
| `explanation` | String (text) | Pembahasan jawaban |
| `createdAt` | DateTime | Kapan soal dibuat |
| `updatedAt` | DateTime | Kapan soal terakhir diupdate |

**Indexes:** `tingkat`, `level`, `matpel`, `tingkat + level + matpel` (composite)

**Relasi:**
- 1 Question → N StudyAttempt

**Catatan:**
- `options` dan `correctOption` hanya relevan untuk `MULTIPLE_CHOICE`. Untuk `SHORT_ANSWER` dan `ESSAY`, `options` bisa empty array `[]` dan `correctOption` null.
- `acceptableAnswers` untuk ESSAY berisi angka jawaban final saja (no cara pengerjaan).

---

### 3. ExamSession

| Field | Type | Keterangan |
|---|---|---|
| `id` | Int (PK, autoincrement) | Primary key |
| `userId` | Int (FK → User.id) | User yang menjalankan sesi |
| `filter` | Json | Filter yang dipilih: `{ tingkat, level, matpels: [...] }` |
| `totalQuestions` | Int | Total soal dalam sesi ini |
| `batchSize` | Int | Jumlah soal per batch (default: 10, range: 10-30) |
| `status` | Enum: `ACTIVE`, `COMPLETED`, `ABANDONED` | Status sesi |
| `questionOrder` | Int[] | Urutan soal yang sudah diacak (array of Question.id) |
| `currentBatchIndex` | Int (default: 0) | Index batch yang sedang/selanjutnya dikerjakan |
| `createdAt` | DateTime | Kapan sesi dimulai |
| `updatedAt` | DateTime | Kapan sesi terakhir diupdate |

**Indexes:** `userId`, `userId + status` (composite — untuk cek resume)

**Relasi:**
- N ExamSession → 1 User
- 1 ExamSession → N ExamBatch

---

### 4. ExamBatch

| Field | Type | Keterangan |
|---|---|---|
| `id` | Int (PK, autoincrement) | Primary key |
| `sessionId` | Int (FK → ExamSession.id) | Sesi tempat batch ini berada |
| `batchIndex` | Int | Urutan batch dalam sesi (0-based) |
| `questionIds` | Int[] | Array Question.id untuk batch ini (sudah diacak) |
| `answers` | Json | Jawaban user per soal: `{ "questionId": "userAnswer", ... }` + hasil grading |
| `score` | Float | Skor batch (0-100) |
| `totalCorrect` | Int | Jumlah jawaban benar |
| `totalWrong` | Int | Jumlah jawaban salah |
| `startedAt` | DateTime | Kapan batch dimulai |
| `submittedAt` | DateTime? (nullable) | Kapan batch di-submit — null jika belum submit |

**Indexes:** `sessionId`, `sessionId + batchIndex` (composite — unique)

**Relasi:**
- N ExamBatch → 1 ExamSession

---

### 5. StudyAttempt

| Field | Type | Keterangan |
|---|---|---|
| `id` | Int (PK, autoincrement) | Primary key |
| `userId` | Int (FK → User.id) | User yang menjawab |
| `questionId` | Int (FK → Question.id) | Soal yang dijawab |
| `userAnswer` | String | Jawaban yang diberikan user |
| `isCorrect` | Boolean | Hasil grading: benar/salah |
| `answeredAt` | DateTime | Kapan jawaban diberikan |

**Indexes:** `userId`, `userId + answeredAt` (composite — untuk analitik), `questionId`

**Relasi:**
- N StudyAttempt → 1 User
- N StudyAttempt → 1 Question

---

### 6. AppConfig

| Field | Type | Keterangan |
|---|---|---|
| `id` | Int (PK, autoincrement) | Primary key |
| `key` | String (unique) | Nama konfigurasi (misal: `AI_API_KEY`, `AI_BASE_URL`, `AI_SYSTEM_PROMPT`, `DEFAULT_BATCH_SIZE`) |
| `value` | String | Nilai konfigurasi (terenkripsi jika `isEncrypted = true`) |
| `isEncrypted` | Boolean (default: false) | Apakah value terenkripsi |
| `updatedAt` | DateTime | Kapan terakhir diupdate |

**Indexes:** `key` (unique)

**Catatan:**
- Tabel ini tidak berelasi ke User — konfigurasi bersifat global.
- `isEncrypted = true` untuk nilai sensitif seperti API Key.
- Encryption/decryption dilakukan di service layer (lib/services/).

---

### 7. StreakLog

| Field | Type | Keterangan |
|---|---|---|
| `id` | Int (PK, autoincrement) | Primary key |
| `userId` | Int (FK → User.id) | User yang aktif |
| `date` | Date | Tanggal aktivitas (tanpa waktu, hanya tanggal) |
| `isActive` | Boolean (default: true) | Menandakan user aktif pada tanggal ini |

**Indexes:** `userId`, `userId + date` (composite — unique: satu entry per user per hari)

**Relasi:**
- N StreakLog → 1 User

**Catatan:**
- Setiap kali user menjawab soal (Study) atau submit batch (Exam), cek apakah sudah ada entry untuk hari ini. Jika belum, buat entry baru dan update `User.streak`.
- Jika `lastActiveDate` bukan kemarin (selisih > 1 hari), reset streak ke 1. Jika kemarin, increment streak.
- Untuk analitik streak, query `StreakLog` berurutan berdasarkan `date`.

---

## Enum Definitions

### Role
```
ADMIN    → Akses penuh ke admin dashboard, CRUD soal, manajemen user
SISWA    → Akses ke study mode, exam mode, history
```

### Tingkat
```
SD      → Soal untuk SD
SMP     → Soal untuk SMP
SMA     → Soal untuk SMA
```

### Level
```
OSNK        → OSN Tingkat Kabupaten/Kota
OSNP        → OSN Tingkat Provinsi
SEMIFINAL   → OSN Semi Final
FINAL       → OSN Final
```

### QuestionType
```
MULTIPLE_CHOICE   → Pilihan ganda, punya options[] dan correctOption
SHORT_ANSWER      → Jawaban singkat, punya acceptableAnswers[]
ESSAY             → Essay, grading berdasarkan angka jawaban final di acceptableAnswers[]
```

### ExamSessionStatus
```
ACTIVE      → Sesi sedang berjalan, user bisa resume
COMPLETED   → Sesi selesai, semua batch sudah di-submit
ABANDONED   → Sesi ditinggalkan (user mulai sesi baru tanpa resume)
```

---

## Migration Strategy

1. **Initial migration:** `npx prisma migrate dev --name init` — buat semua tabel + enum + index
2. **Future changes:** Selalu buat migration baru, jangan edit migration yang sudah di-run
3. **Production deploy:** `npx prisma migrate deploy` — dijalankan otomatis saat container start
4. **Seed data:** `prisma/seed.ts` — buat admin default + beberapa soal contoh
