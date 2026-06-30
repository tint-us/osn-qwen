# User Stories — CONTENT PROCESSING Module

## US-CONTENT-01: Upload File Import

**As an** admin,
**I want to** mengunggah file CSV/JSON/XML berisi soal,
**So that** saya bisa import soal secara massal.

### Acceptance Criteria
- [ ] Halaman /admin/questions/import tersedia
- [ ] Drag & drop area untuk upload file
- [ ] Format yang didukung: .csv, .json, .xml
- [ ] Max file size: 5MB
- [ ] Jika format tidak didukung: tampilkan error "Format file tidak didukung"
- [ ] Jika file > 5MB: tampilkan error "Ukuran file maksimal 5MB"

---

## US-CONTENT-02: Preview Soal Setelah Upload

**As an** admin,
**I want to** melihat preview soal sebelum disimpan,
**So that** saya bisa memastikan data sudah benar.

### Acceptance Criteria
- [ ] Setelah upload, file di-parse di server
- [ ] Tampilkan tabel preview: nomor, tingkat, level, matpel, questionType, content (truncated), status
- [ ] Baris valid: hijau, checkbox checked
- [ ] Baris invalid: merah, checkbox unchecked, error message ditampilkan
- [ ] Summary: "X soal valid, Y soal error, Z dipilih untuk import"
- [ ] Pagination jika > 100 baris

---

## US-CONTENT-03: Validasi Soal

**As an** admin,
**I want to** setiap soal divalidasi,
**So that** hanya soal valid yang masuk ke database.

### Acceptance Criteria
- [ ] Field mandatory dicek: tingkat, level, matpel, questionType, content, explanation
- [ ] questionType valid: MULTIPLE_CHOICE, SHORT_ANSWER, ESSAY
- [ ] tingkat valid: SD, SMP, SMA
- [ ] level valid: OSNK, OSNP, SEMIFINAL, FINAL
- [ ] MC: options array (min 2), correctOption (0-based index, < options.length)
- [ ] SA: acceptableAnswers array (min 1)
- [ ] ESSAY: acceptableAnswers array (min 1, numeric)
- [ ] Error message spesifik per baris

---

## US-CONTENT-04: Pilih Soal untuk Import

**As an** admin,
**I want to** memilih soal mana yang diimport,
**So that** saya bisa skip soal yang error.

### Acceptance Criteria
- [ ] Checkbox per baris (default: valid=checked, invalid=unchecked)
- [ ] Toggle checkbox untuk select/deselect per baris
- [ ] Tombol "Select All Valid"
- [ ] Tombol "Deselect All"
- [ ] Tombol "Import Z Soal" menampilkan jumlah yang dipilih

---

## US-CONTENT-05: Konfirmasi & Simpan Import

**As an** admin,
**I want to** konfirmasi sebelum import,
**So that** saya tidak salah import soal.

### Acceptance Criteria
- [ ] Klik "Import Z Soal" → modal konfirmasi
- [ ] Modal: "Anda akan mengimport Z soal. Lanjutkan?"
- [ ] [Batal] [Import]
- [ ] Setelah konfirmasi: bulk insert ke database
- [ ] Progress indicator saat import
- [ ] Sukses: "Z soal berhasil diimport" → redirect ke daftar soal
- [ ] Error DB: rollback, tampilkan error message

---

## US-CONTENT-06: Download Template

**As an** admin,
**I want to** mendownload template import,
**So that** saya tahu format yang benar.

### Acceptance Criteria
- [ ] 3 tombol download: CSV, JSON, XML
- [ ] Setiap template berisi 2-3 contoh soal (MC, SA, ESSAY)
- [ ] Template dapat diunduh dari halaman import
- [ ] File langsung ter-download ke perangkat

---

## US-CONTENT-07: Copy AI Prompt

**As an** admin,
**I want to** menyalin AI Prompt,
**So that** saya bisa convert PDF ke format JSON menggunakan AI eksternal.

### Acceptance Criteria
- [ ] Area text berisi static AI Prompt (read-only)
- [ ] Tombol "Copy AI Prompt" → copy ke clipboard
- [ ] Toast "Prompt berhasil disalin" setelah copy
- [ ] Prompt berisi instruksi format, schema JSON, dan contoh output

---

## US-CONTENT-08: Parse Error Handling

**As an** admin,
**I want to** mendapat pesan error yang jelas jika format file rusak,
**So that** saya bisa memperbaiki file dan upload ulang.

### Acceptance Criteria
- [ ] Jika CSV tidak valid (header hilang, delimiter salah): error "Format CSV tidak valid"
- [ ] Jika JSON tidak valid (bukan array, syntax error): error "Format JSON tidak valid"
- [ ] Jika XML tidak valid (tag tidak tertutup): error "Format XML tidak valid"
- [ ] Error ditampilkan di area upload (tidak lanjut ke preview)
- [ ] Tombol "Coba Lagi" untuk upload ulang

---

## US-CONTENT-09: Sanitasi Konten Soal

**As an** admin,
**I want to** konten soal bebas dari HTML berbahaya,
**So that** sistem aman dari serangan XSS.

### Acceptance Criteria
- [ ] HTML tags di-strip dari content, options, explanation saat parse
- [ ] LaTeX notation ($...$ dan $$...$$) tetap dipertahankan
- [ ] Script tags dihapus sepenuhnya
- [ ] Content disimpan sebagai plain string di database
