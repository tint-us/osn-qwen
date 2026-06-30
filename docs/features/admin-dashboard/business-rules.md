# Business Rules — ADMIN DASHBOARD Module

## BR-ADMIN-01: Access Control
- Semua route `/admin/*` hanya dapat diakses oleh user dengan role `ADMIN`
- Middleware mengecek session + role sebelum setiap request ke `/admin/*`
- SISWA yang mencoba akses → redirect ke `/study`
- User belum login → redirect ke `/login`

## BR-ADMIN-02: Home Stats
- Stats diambil dari count aggregation di database:
  - Total soal: `prisma.question.count()`
  - Total user: `prisma.user.count()`
  - Total sesi exam: `prisma.examSession.count()`
  - Total study attempts: `prisma.studyAttempt.count()`
- Semua count di-fetch dalam satu API call (parallel Prisma queries)
- Format angka dengan thousand separator (Intl.NumberFormat)

## BR-ADMIN-03: Question Bank — List & Filter
- Default pagination: 10 soal per page (max 50)
- Default sort: `createdAt` descending (newest first)
- Filter kombinasi AND:
  - tingkat: exact match (enum)
  - level: exact match (enum)
  - matpel: case-insensitive partial match (contains, mode insensitive)
  - questionType: exact match (enum)
  - content search: case-insensitive partial match (contains, mode insensitive)
- Content truncated di tabel: max 50 karakter + "..."
- Jika hasil filter kosong: empty state "Tidak ada soal yang sesuai"

## BR-ADMIN-04: Question Bank — Add Manual
- Field mandatory untuk semua questionType:
  - tingkat (enum: SD/SMP/SMA)
  - level (enum: OSNK/OSNP/SEMIFINAL/FINAL)
  - matpel (string, tidak boleh kosong)
  - content (string, tidak boleh kosong)
  - explanation (string, tidak boleh kosong)
- Field conditional:
  - MULTIPLE_CHOICE:
    - options[]: minimum 2, maksimum tidak terbatas
    - correctOption: index dari options, wajib dipilih
  - SHORT_ANSWER:
    - acceptableAnswers[]: minimum 1, setiap entry tidak boleh kosong
  - ESSAY:
    - acceptableAnswers[]: minimum 1 (numeric answer), setiap entry tidak boleh kosong
- imageUrl: optional, harus berupa URL valid jika diisi
- Konten disimpan sebagai plain string (LaTeX dalam format `$...$` dan `$$...$$`)
- KaTeX live preview: render di client-side saat user mengetik

## BR-ADMIN-05: Question Bank — Edit
- Semua field dapat di-edit
- Jika questionType berubah:
  - Dari MC → SA/ESSAY: options dan correctOption di-clear, acceptableAnswers di-init kosong
  - Dari SA/ESSAY → MC: acceptableAnswers di-clear, options di-init kosong, correctOption = null
  - SA ↔ ESSAY: acceptableAnswers tetap (struktur sama)
- updatedAt di-update otomatis oleh Prisma (@updatedAt)

## BR-ADMIN-06: Question Bank — Delete
- Delete bersifat hard delete (record dihapus dari database)
- Jika soal memiliki StudyAttempt terkait:
  - StudyAttempt juga terhapus (onDelete: Cascade di schema)
  - Warning ditampilkan di modal konfirmasi
- Tidak ada undo / restore
- Konfirmasi modal wajib sebelum delete

## BR-ADMIN-07: User Management
- Admin dapat melihat semua user (ADMIN dan SISWA)
- Admin dapat mengubah role user: ADMIN ↔ SISWA
- Admin dapat mengaktifkan/menonaktifkan user (isActive toggle)
- Pembatasan:
  - Admin TIDAK dapat menonaktifkan akun sendiri (button disabled)
  - Admin TIDAK dapat mengubah role sendiri (button disabled)
  - Tidak ada pembatasan untuk menonaktifkan/ubah role admin lain
- User yang dinonaktifkan: tidak bisa login (dicek di NextAuth credentials provider)
- User yang role-nya diubah ke SISWA: kehilangan akses ke `/admin/*` di request berikutnya

## BR-ADMIN-08: AI Configuration
- Disimpan di AppConfig table:
  - `ai_api_key`: value terenkripsi (AES-256-GCM), isEncrypted = true
  - `ai_base_url`: value plain text, isEncrypted = false
  - `ai_system_prompt`: value plain text, isEncrypted = false
- API Key tidak pernah dikembalikan full ke client:
  - GET: return masked `••••••••[last4]`
  - Jika client tidak mengirim API Key baru (empty string): server keep existing value
  - Jika client mengirim API Key baru: server encrypt dan simpan
- Encryption key: dari environment variable `ENCRYPTION_KEY` (32 char string)
- Jika `ENCRYPTION_KEY` tidak ada di env: fallback to error (tidak boleh simpan plain text)

## BR-ADMIN-09: Exam Configuration
- Disimpan di AppConfig table:
  - `exam_default_batch_size`: value plain text (integer as string), isEncrypted = false
- Validasi: 10 ≤ batch_size ≤ 30
- Default value: 10 (jika belum ada di AppConfig)
- Value digunakan saat user baru setup exam session (pre-fill default)

## BR-ADMIN-10: DB Diagnostics
- Connection check: `prisma.$queryRaw\`SELECT 1\``
- Latency: measure time dari query start → response
- Stats: count dari Question, User, ExamSession, StudyAttempt (parallel)
- Auto-refresh: 30 detik (client-side setInterval)
- Jika DB disconnected:
  - Status: "❌ Disconnected"
  - Latency: "—"
  - Stats: "—" (tidak bisa fetch)
  - Retry button
