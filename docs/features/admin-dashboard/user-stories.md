# User Stories — ADMIN DASHBOARD Module

## US-ADMIN-01: View Dashboard Stats

**As an** admin  
**I want to** see summary statistics on the dashboard home  
**So that** I can quickly understand platform usage at a glance

**Acceptance Criteria:**
- Stats cards display: total soal, total user, total sesi exam, total study attempts
- Each card has an icon and distinct color
- Numbers are fetched from a single API endpoint
- Loading state shows skeleton cards
- Numbers are formatted with thousand separators (e.g., 1,500)

---

## US-ADMIN-02: View Question Bank List

**As an** admin  
**I want to** view a paginated list of all questions  
**So that** I can browse and manage the question bank

**Acceptance Criteria:**
- Table shows: ID, content (truncated to ~50 chars), tingkat, level, matpel, questionType, createdAt, actions
- Pagination: 10 per page with First/Prev/page numbers/Next/Last controls
- "Menampilkan X-Y dari Z soal" text
- Default sort: newest first (createdAt desc)

---

## US-ADMIN-03: Filter and Search Questions

**As an** admin  
**I want to** filter questions by tingkat, level, matpel, and questionType, and search by content  
**So that** I can find specific questions quickly

**Acceptance Criteria:**
- Filter dropdowns: tingkat (SD/SMP/SMA/All), level (OSNK/OSNP/SEMIFINAL/FINAL/All), questionType (MC/SA/ESSAY/All)
- Matpel: text input (partial match)
- Content search: text input (case-insensitive, partial match)
- Filters combine with AND logic
- "Reset Filter" button clears all filters
- Results update on filter change

---

## US-ADMIN-04: Add Question Manually

**As an** admin  
**I want to** add a new question manually via a form  
**So that** I can populate the question bank with specific questions

**Acceptance Criteria:**
- Form with all fields: tingkat, level, matpel, questionType, content, imageUrl (optional), explanation
- Conditional fields based on questionType:
  - MC: options[] (add/remove), correctOption (radio)
  - SA: acceptableAnswers[] (add/remove)
  - ESSAY: acceptableAnswers[] (add/remove)
- KaTeX live preview for content and explanation fields
- Validation: mandatory fields checked before submit
- On success: redirect to question list with success toast "Soal berhasil ditambahkan"
- On error: inline error messages, form retains input

---

## US-ADMIN-05: Edit Question

**As an** admin  
**I want to** edit an existing question  
**So that** I can correct mistakes or update content

**Acceptance Criteria:**
- Click "Edit" in question list → navigate to edit form
- Form pre-populated with current question data
- All fields editable (same form as add)
- questionType change: conditional fields update accordingly
- On success: redirect to question list with success toast "Soal berhasil diperbarui"
- Cancel: redirect back to list without saving

---

## US-ADMIN-06: Delete Question

**As an** admin  
**I want to** delete a question from the bank  
**So that** I can remove outdated or incorrect questions

**Acceptance Criteria:**
- Click "Delete" in question list → confirmation modal
- Modal shows: "Yakin ingin menghapus soal ini?"
- If question has StudyAttempt: warning "Soal ini memiliki X study attempts. Soal akan tetap dihapus, attempts tetap ada untuk history."
- Confirm: DELETE to API, success toast "Soal berhasil dihapus"
- Cancel: modal closes, no action
- Question removed from list without page reload

---

## US-ADMIN-07: Navigate to Import Soal

**As an** admin  
**I want to** navigate to the import soal page from the dashboard  
**So that** I can import questions in bulk

**Acceptance Criteria:**
- Button/link on dashboard home or sidebar: "Import Soal"
- Clicking navigates to `/admin/import` (Content Processing module)
- Active state highlighted in sidebar

---

## US-ADMIN-08: View User List

**As an** admin  
**I want to** view a paginated list of all users  
**So that** I can manage user accounts

**Acceptance Criteria:**
- Table shows: ID, Nama, Email, Role, Status (Aktif/Non-aktif), createdAt, actions
- Pagination: 10 per page
- Filter: role (All/ADMIN/SISWA), status (All/Aktif/Non-aktif)
- Search by name or email (text input)

---

## US-ADMIN-09: Manage User Role and Status

**As an** admin  
**I want to** change user roles and activate/deactivate accounts  
**So that** I can control access and permissions

**Acceptance Criteria:**
- Toggle role: ADMIN ↔ SISWA with confirmation modal "Ubah role [nama] menjadi [role]?"
- Toggle status: activate/deactivate with confirmation modal
- Cannot deactivate own account (button disabled with tooltip "Tidak dapat menonaktifkan akun sendiri")
- Cannot change own role (button disabled with tooltip "Tidak dapat mengubah role sendiri")
- Success toast after action completes

---

## US-ADMIN-10: Configure AI Settings

**As an** admin  
**I want to** configure AI API Key, Base URL, and System Prompt  
**So that** the application can use AI features

**Acceptance Criteria:**
- Form: API Key (masked input with show/hide toggle), Base URL, System Prompt (textarea)
- API Key masked: shows `••••••••[last4]` when loaded
- Save: PATCH to API
- Success toast: "Konfigurasi AI berhasil disimpan"
- API Key stored encrypted in database (AppConfig with isEncrypted = true)

---

## US-ADMIN-11: Configure Exam Settings

**As an** admin  
**I want to** set the default batch size for exams  
**So that** new exam sessions use the configured default

**Acceptance Criteria:**
- Number input for default batch size (min 10, max 30)
- Current value displayed from AppConfig
- Save: PATCH to API
- Success toast: "Konfigurasi exam berhasil disimpan"

---

## US-ADMIN-12: View DB Diagnostics

**As an** admin  
**I want to** see database health and basic statistics  
**So that** I can monitor if the system is running properly

**Acceptance Criteria:**
- Connection status: "✅ Connected" (green) or "❌ Disconnected" (red)
- DB latency: response time in milliseconds
- Stats: total soal, total user, total sesi exam, total study attempts
- Manual refresh button
- Auto-refresh every 30 seconds
- If disconnected: error message with retry button
