# Edge Cases — ADMIN DASHBOARD Module

## EC-ADMIN-01: Admin Menonaktifkan Diri Sendiri

**Skenario:** Admin mencoba menonaktifkan akun sendiri.

**Expected behavior:**
- Button "Nonaktifkan" disabled
- Tooltip: "Tidak dapat menonaktifkan akun sendiri"
- Tidak ada API call
- Tidak ada perubahan

---

## EC-ADMIN-02: Admin Mengubah Role Diri Sendiri

**Skenario:** Admin mencoba mengubah role sendiri dari ADMIN ke SISWA.

**Expected behavior:**
- Button "Ubah Role" disabled
- Tooltip: "Tidak dapat mengubah role sendiri"
- Tidak ada API call

---

## EC-ADMIN-03: Delete Soal dengan StudyAttempt Terkait

**Skenario:** Admin menghapus soal yang sudah memiliki 15 StudyAttempt.

**Expected behavior:**
- Modal konfirmasi menampilkan warning: "Soal ini memiliki 15 study attempts. Soal akan tetap dihapus, attempts tetap ada untuk history."
- Tombol "Hapus" tetap aktif
- Jika dikonfirmasi: soal dihapus, StudyAttempt juga terhapus (cascade delete)
- Success toast: "Soal berhasil dihapus"

---

## EC-ADMIN-04: QuestionType Switch — MC ke SA

**Skenario:** Admin edit soal MC menjadi Short Answer.

**Expected behavior:**
- options[] di-clear dari form
- correctOption di-clear
- acceptableAnswers[] di-init kosong (1 empty field)
- User wajib mengisi minimal 1 acceptable answer
- Jika save tanpa acceptable answer: validasi error "Minimal 1 jawaban yang diterima"

---

## EC-ADMIN-05: MC dengan 1 Option

**Skenario:** Admin menambah soal Multiple Choice tetapi hanya mengisi 1 option.

**Expected behavior:**
- Client validation: error "Minimal 2 pilihan jawaban"
- Form tidak di-submit
- Field yang error di-highlight

---

## EC-ADMIN-06: API Key Kosong saat Edit

**Skenario:** Admin membuka form AI Config, tidak mengubah API Key, hanya mengubah System Prompt.

**Expected behavior:**
- API Key field menampilkan masked value `••••••••last4`
- Jika admin tidak mengetik ulang API Key (field tetap masked/empty):
  - Client mengirim empty string untuk api_key
  - Server: jika api_key = "" → keep existing encrypted value
  - Server: update ai_base_url dan ai_system_prompt saja
- Success toast muncul
- API Key di database tidak berubah

---

## EC-ADMIN-07: ENCRYPTION_KEY Tidak Ada di Environment

**Skenario:** Admin mencoba menyimpan AI Config tetapi `ENCRYPTION_KEY` tidak ada di `.env`.

**Expected behavior:**
- Server mengembalikan error 500: "Encryption key not configured"
- Toast: "Gagal menyimpan konfigurasi: server encryption error"
- API Key tidak disimpan
- Base URL dan System Prompt tidak disimpan (transaction fail)

---

## EC-ADMIN-08: Filter Tidak Menghasilkan Data

**Skenario:** Admin filter soal dengan tingkat=SD, level=FINAL, matpel="Astronomi" — tidak ada yang match.

**Expected behavior:**
- Tabel menampilkan empty state: "Tidak ada soal yang sesuai"
- Tombol "Reset Filter" ditampilkan
- Pagination controls tersembunyi
- Tidak ada error

---

## EC-ADMIN-09: User Terakhir di List adalah Admin Lain

**Skenario:** Admin melihat list user, semua adalah ADMIN.

**Expected behavior:**
- Admin dapat mengubah role admin lain menjadi SISWA
- Admin dapat menonaktifkan admin lain
- Jika hanya tersisa 1 admin aktif: tetap bisa diubah (tidak ada pembatasan "minimal 1 admin")
  - Note: ini acceptable risk — admin harus bertanggung jawab

---

## EC-ADMIN-10: DB Diagnostics — Database Down

**Skenario:** PostgreSQL container mati atau unreachable.

**Expected behavior:**
- GET /api/admin/diagnostics: timeout atau connection error
- Connection status: "❌ Disconnected"
- Latency: "—"
- Stats: "—" untuk semua
- Toast: "Database tidak dapat dijangkau"
- Retry button aktif
- Auto-refresh tetap berjalan (akan detect jika DB kembali online)

---

## EC-ADMIN-11: Pagination — Lebih dari 1000 Soal

**Skenario:** Bank soal memiliki 1,500 soal.

**Expected behavior:**
- Page 1: soal terbaru 1-10
- Total pages: 150
- Pagination: "‹ First" "‹ Prev" "1 2 3 ... 150" "Next ›" "Last ›"
- "Menampilkan 1-10 dari 1,500 soal"
- Performance: query tetap < 1 detik (Prisma take/skip dengan index)

---

## EC-ADMIN-12: Exam Config — Invalid Batch Size

**Skenario:** Admin mencoba menyimpan batch size = 5 atau batch size = 50.

**Expected behavior:**
- Client validation: error "Batch size harus antara 10 dan 30"
- Form tidak di-submit
- Jika bypass client validation: server return 400 "Batch size must be between 10 and 30"

---

## EC-ADMIN-13: User Dinonaktifkan Saat Sedang Login

**Skenario:** Admin A menonaktifkan User B, tetapi User B sedang memiliki session aktif.

**Expected behavior:**
- User B tetap memiliki session sampai JWT expires
- Saat User B mencoba akses halaman: middleware check `isActive`
- Jika isActive = false: destroy session, redirect ke `/login` dengan pesan "Akun Anda telah dinonaktifkan"
- Tidak ada real-time session termination (acceptable — JWT has expiry)

---

## EC-ADMIN-14: Search dengan Special Characters

**Skenario:** Admin search soal dengan content "$\frac{1}{2}$".

**Expected behavior:**
- Search menggunakan Prisma `contains` dengan `mode: insensitive`
- Special characters ($, \, {, }) dianggap literal string
- Hasil: soal yang mengandung literal "$\frac{1}{2}$" di content
- Tidak ada SQL injection (Prisma parameterized queries)

---

## EC-ADMIN-15: Concurrent Edit — Dua Admin Edit Soal Sama

**Skenario:** Admin A dan Admin B membuka edit form untuk soal yang sama secara bersamaan.

**Expected behavior:**
- Admin A save pertama: berhasil, updatedAt di-update
- Admin B save kemudian: PATCH berdasarkan ID (bukan optimistic locking)
- Hasil: perubahan Admin B overwrite perubahan Admin A
- Acceptable: last-write-wins (tidak ada conflict resolution di scope ini)
- Tidak ada error
