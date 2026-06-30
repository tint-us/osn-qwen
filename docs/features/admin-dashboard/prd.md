# PRD — ADMIN DASHBOARD Module

## 1. Overview

Admin Dashboard adalah modul administrasi untuk mengelola seluruh aspek platform SoaLatihan. Admin dapat melihat statistik ringkasan, mengelola bank soal (CRUD), mengakses import soal massal, mengelola user, mengonfigurasi AI dan exam, serta memantau kesehatan database. Semua route `/admin/*` hanya dapat diakses oleh user dengan role `ADMIN`.

## 2. Scope

### In Scope
- **Home Stats:** Ringkasan total soal, total user, total sesi exam, total study attempts
- **Bank Soal CRUD:** List soal dengan filter + pagination, tambah soal manual (dengan KaTeX live preview), edit soal, soft delete soal
- **Link ke Import Soal:** Navigasi ke modul Content Processing
- **Manajemen User:** List user, ubah role (ADMIN/SISWA), aktifkan/nonaktifkan akun
- **Konfigurasi AI:** Simpan API Key (masked + encrypted), Base URL, System Prompt — disimpan di tabel AppConfig
- **Konfigurasi Exam:** Default batch size (10-30)
- **Diagnostik DB:** Health check koneksi DB + basic stats (total soal, total user, total sesi, total study attempts)

### Out of Scope
- Hard delete soal (hanya soft delete via isActive flag atau deletedAt)
- Registrasi admin via UI (admin dibuat via seed script atau DB manual)
- Edit soal massal (bulk edit)
- Audit log / activity log
- Backup/restore database via UI
- Konfigurasi email/SMS notification
- Manajemen role selain ADMIN dan SISWA

## 3. Functional Requirements

### FR-ADMIN-01: Home Stats
Admin melihat ringkasan statistik di dashboard home:
- Total soal di bank soal
- Total user terdaftar (aktif + non-aktif)
- Total sesi exam (semua status)
- Total study attempts
- Stats cards dengan icon dan warna berbeda per kategori

### FR-ADMIN-02: Bank Soal — List & Filter
Admin dapat melihat daftar soal dengan:
- Tabel: ID, Konten (truncated), Tingkat, Level, Matpel, Type, Created At, Actions
- Filter: tingkat (SD/SMP/SMA), level (OSNK/OSNP/SEMIFINAL/FINAL), matpel (text input), questionType (MC/SA/ESSAY)
- Pagination: 10 soal per page
- Search by content (text search)
- Sort by createdAt (default: newest first)

### FR-ADMIN-03: Bank Soal — Tambah Manual
Admin dapat menambah soal secara manual:
- Form fields: tingkat (select), level (select), matpel (text), questionType (select), content (textarea with KaTeX live preview), imageUrl (optional text input), explanation (textarea with KaTeX live preview)
- Conditional fields based on questionType:
  - MULTIPLE_CHOICE: options[] (dynamic add/remove), correctOption (radio per option)
  - SHORT_ANSWER: acceptableAnswers[] (dynamic add/remove)
  - ESSAY: acceptableAnswers[] (dynamic add/remove, for numeric answer)
- KaTeX live preview: renders `$...$` and `$$...$$` in real-time as admin types
- Validasi: semua field mandatory sesuai questionType
- Submit: POST to API, redirect to list with success toast

### FR-ADMIN-04: Bank Soal — Edit
Admin dapat edit soal yang ada:
- Pre-populated form (same as tambah)
- Perubahan questionType: jika switch dari MC ke SA/ESSAY, options di-clear; jika switch ke MC, options di-init kosong
- Save: PATCH to API, redirect to list with success toast

### FR-ADMIN-05: Bank Soal — Soft Delete
Admin dapat menghapus soal:
- Confirmation modal: "Yakin ingin menghapus soal ini? Soal tidak akan muncul di bank soal."
- Soft delete: set `isActive = false` (jika field ada) atau delete record
- DELETE to API
- Success toast: "Soal berhasil dihapus"
- Jika soal memiliki StudyAttempt terkait: warning di modal "Soal ini memiliki X study attempts. Soal akan tetap dihapus, attempts tetap ada untuk history."

### FR-ADMIN-06: Manajemen User
Admin dapat mengelola user:
- Tabel: ID, Nama, Email, Role, Status (Aktif/Non-aktif), Created At, Actions
- Filter: role (ADMIN/SISWA), status (aktif/non-aktif)
- Pagination: 10 user per page
- Actions per user:
  - Ubah role: toggle ADMIN ↔ SISWA (confirmation modal)
  - Aktifkan/Nonaktifkan: toggle isActive (confirmation modal)
- Tidak bisa menonaktifkan diri sendiri
- Tidak bisa mengubah role diri sendiri

### FR-ADMIN-07: Konfigurasi AI
Admin dapat mengonfigurasi AI:
- Form: API Key (input masked, show/hide toggle), Base URL, System Prompt (textarea)
- API Key disimpan terenkripsi di AppConfig (isEncrypted = true)
- Base URL dan System Prompt disimpan sebagai plain text (isEncrypted = false)
- Save: PATCH to API
- Success toast: "Konfigurasi AI berhasil disimpan"
- API Key masked: tampilkan `••••••••` (last 4 chars) saat loaded

### FR-ADMIN-08: Konfigurasi Exam
Admin dapat mengonfigurasi default exam settings:
- Default batch size: number input (min 10, max 30, default 10)
- Disimpan di AppConfig dengan key `exam_default_batch_size`
- Save: PATCH to API

### FR-ADMIN-09: Diagnostik DB
Admin dapat melihat kesehatan database:
- Connection status: "✅ Connected" atau "❌ Disconnected"
- DB stats: total soal, total user, total sesi exam, total study attempts
- DB latency: response time in ms
- Prisma migration status (optional)
- Auto-refresh: every 30 seconds (or manual refresh button)

## 4. Non-Functional Requirements

### NFR-ADMIN-01: Performance
- Stats queries harus < 500ms (gunakan count aggregation)
- Question list dengan filter + pagination harus < 1 detik
- DB diagnostics harus < 2 detik (include latency check)

### NFR-ADMIN-02: Security
- Semua route `/admin/*` protected by middleware (role check: ADMIN only)
- API Key encryption menggunakan AES-256-GCM
- API Key tidak pernah dikembalikan full ke client (hanya masked)
- Input validation: semua field divalidasi di server side
- SQL injection prevention: Prisma parameterized queries

### NFR-ADMIN-03: UX
- DataTable dengan sortable columns
- Responsive: table scroll horizontal di mobile
- Toast notifications untuk semua aksi CRUD
- Confirmation modal untuk destructive actions (delete, deactivate, role change)
- KaTeX preview real-time saat input soal

## 5. Dependencies

### Internal Dependencies
- **AUTH module:** NextAuth.js session, role check middleware
- **CONTENT PROCESSING module:** Link ke import soal page
- **Prisma schema:** Question, User, AppConfig, ExamSession, StudyAttempt models

### External Dependencies
- shadcn/ui DataTable component
- KaTeX (already used in Study/Exam mode)
- crypto (Node.js built-in, untuk encryption)
- AppConfig table (key-value store)

## 6. User Roles

| Role | Access |
|---|---|
| ADMIN | Full access to all `/admin/*` routes |
| SISWA | No access — redirect to `/study` if trying to access |
