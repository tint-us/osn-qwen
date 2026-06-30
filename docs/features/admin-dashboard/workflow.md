# Workflow — ADMIN DASHBOARD Module

## 1. Admin Dashboard Home Load

```
User navigates to /admin
  │
  ├── Middleware: check session → role = ADMIN?
  │     ├── No → redirect to /login (or /study if SISWA)
  │     └── Yes → continue
  │
  ├── Page renders with sidebar layout
  │
  ├── GET /api/admin/stats (parallel)
  │     → AdminStatsOverview: total soal, total user, total sesi, total attempts
  │
  └── Sidebar highlights "Dashboard" active
```

## 2. Question Bank — List & Filter

```
User navigates to /admin/questions
  │
  ├── GET /api/admin/questions?page=1&limit=10
  │     → QuestionTable renders with data
  │
  ├── User applies filter (tingkat/level/matpel/type/search)
  │     ├── Filters combine with AND
  │     └── GET /api/admin/questions?page=1&limit=10&tingkat=SMA&level=OSNP&...
  │
  ├── User clicks pagination
  │     └── GET /api/admin/questions?page=2&limit=10&...existingFilters
  │
  └── Table displays:
        - ID, content (truncated), tingkat, level, matpel, type, createdAt
        - Actions: [Edit] [Delete]
```

## 3. Question Bank — Add Manual

```
User clicks "Tambah Soal" on /admin/questions
  │
  ├── Navigate to /admin/questions/new
  │
  ├── Form renders:
  │     - tingkat (select), level (select), matpel (text)
  │     - questionType (select)
  │     - content (textarea + KaTeX live preview)
  │     - imageUrl (text, optional)
  │     - explanation (textarea + KaTeX live preview)
  │     - Conditional fields:
  │       MC → options[] (dynamic add/remove) + correctOption (radio)
  │       SA → acceptableAnswers[] (dynamic add/remove)
  │       ESSAY → acceptableAnswers[] (dynamic add/remove)
  │
  ├── User types content → KaTeX preview updates in real-time
  │
  ├── User changes questionType:
  │     MC → SA: clear options[], init acceptableAnswers[]
  │     SA → MC: clear acceptableAnswers[], init options[]
  │     SA ↔ ESSAY: keep acceptableAnswers[] (same structure)
  │
  ├── User clicks "Simpan"
  │     ├── Client validation: check mandatory fields
  │     │     ├── Invalid → inline errors, no submit
  │     │     └── Valid → POST /api/admin/questions
  │     │           ├── Success → redirect /admin/questions, toast "Soal berhasil ditambahkan"
  │     │           └── Error → toast "Gagal menambah soal", form retains input
  │     └── User clicks "Batal" → redirect /admin/questions
```

## 4. Question Bank — Edit

```
User clicks "Edit" on a question row
  │
  ├── Navigate to /admin/questions/[id]/edit
  │
  ├── GET /api/admin/questions/[id] (fetch full question data)
  │     → Form pre-populated with all fields
  │
  ├── User edits fields (same form as add)
  │     - KaTeX preview updates in real-time
  │     - questionType change: conditional fields adapt
  │
  ├── User clicks "Simpan"
  │     ├── Client validation
  │     │     ├── Invalid → inline errors
  │     │     └── Valid → PATCH /api/admin/questions/[id]
  │     │           ├── Success → redirect /admin/questions, toast "Soal berhasil diperbarui"
  │     │           └── Error → toast "Gagal memperbarui soal"
  │     └── User clicks "Batal" → redirect /admin/questions
```

## 5. Question Bank — Delete

```
User clicks "Delete" on a question row
  │
  ├── Confirmation modal appears:
  │     "Yakin ingin menghapus soal ini?"
  │     - If has StudyAttempt: warning text shown
  │     - [Batal] [Hapus]
  │
  ├── User clicks "Hapus"
  │     └── DELETE /api/admin/questions/[id]
  │           ├── Success → modal closes, toast "Soal berhasil dihapus", row removed
  │           └── Error → toast "Gagal menghapus soal"
  │
  └── User clicks "Batal" → modal closes, no action
```

## 6. User Management

```
User navigates to /admin/users
  │
  ├── GET /api/admin/users?page=1&limit=10
  │     → UserTable renders
  │
  ├── Filter: role, status, search
  │     └── GET /api/admin/users?...filters
  │
  ├── Toggle Role:
  │     ├── Click role toggle button
  │     ├── Confirmation modal: "Ubah role [nama] menjadi [newRole]?"
  │     ├── Confirm → PATCH /api/admin/users/[id] { role: newRole }
  │     │     ├── Success → toast "Role user berhasil diubah", table refreshes
  │     │     └── Error → toast "Gagal mengubah role"
  │     └── If own account → button disabled, tooltip shown
  │
  └── Toggle Status:
        ├── Click activate/deactivate button
        ├── Confirmation modal: "[Aktifkan/Nonaktifkan] akun [nama]?"
        ├── Confirm → PATCH /api/admin/users/[id] { isActive: !current }
        │     ├── Success → toast "Status user berhasil diubah", table refreshes
        │     └── Error → toast "Gagal mengubah status"
        └── If own account → button disabled, tooltip shown
```

## 7. AI Configuration

```
User navigates to /admin/config/ai
  │
  ├── GET /api/admin/config (key = ai_*)
  │     → Form pre-populated:
  │       - API Key: masked (••••••••last4)
  │       - Base URL: full value
  │       - System Prompt: full value
  │
  ├── User edits fields
  │     - API Key: show/hide toggle (eye icon)
  │     - If API Key not changed: send empty string (server keeps existing)
  │     - If API Key changed: send new value (server encrypts)
  │
  ├── User clicks "Simpan"
  │     └── PATCH /api/admin/config { ai_api_key, ai_base_url, ai_system_prompt }
  │           ├── Success → toast "Konfigurasi AI berhasil disimpan"
  │           └── Error → toast "Gagal menyimpan konfigurasi"
  │
  └── Auto-refresh: none (manual save only)
```

## 8. Exam Configuration

```
User navigates to /admin/config/exam
  │
  ├── GET /api/admin/config (key = exam_default_batch_size)
  │     → Form pre-populated with current batch size
  │
  ├── User edits batch size (10-30)
  │     - Client validation: min 10, max 30
  │
  └── User clicks "Simpan"
        └── PATCH /api/admin/config { exam_default_batch_size }
              ├── Success → toast "Konfigurasi exam berhasil disimpan"
              └── Error → toast "Gagal menyimpan konfigurasi"
```

## 9. DB Diagnostics

```
User navigates to /admin/diagnostics
  │
  ├── GET /api/admin/diagnostics
  │     → DBHealthCard renders:
  │       - Connection status: ✅/❌
  │       - Latency: Xms
  │       - Stats: total soal, user, sesi, attempts
  │
  ├── Auto-refresh: setInterval 30s → GET /api/admin/diagnostics
  │
  └── Manual refresh: click "Refresh" button → GET /api/admin/diagnostics
```
