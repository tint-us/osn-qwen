# PRD — CONTENT PROCESSING Module

## 1. Overview

Content Processing adalah modul untuk import soal secara massal ke dalam bank soal. Admin dapat mengunggah file dalam format CSV, JSON, atau XML. Sistem mem-parsing file, menampilkan preview, memvalidasi setiap baris/entri, dan menyimpan soal yang valid ke database setelah konfirmasi admin. Terdapat juga template yang dapat diunduh dan static AI Prompt untuk membantu konversi PDF/dokumen ke format import.

## 2. Scope

### In Scope
- Import soal massal via 3 format: CSV, JSON, XML
- Flow: upload file → parse → preview tabel → validasi → konfirmasi → simpan
- Validasi:
  - Field mandatory: tingkat, level, matpel, questionType, content, explanation
  - Format jawaban per questionType (MC: options + correctOption, SA: acceptableAnswers, ESSAY: acceptableAnswers)
  - Tipe soal valid (MULTIPLE_CHOICE, SHORT_ANSWER, ESSAY)
  - Tingkat valid (SD, SMP, SMA)
  - Level valid (OSNK, OSNP, SEMIFINAL, FINAL)
- Tampilkan error per baris/entri
- Baris valid tetap bisa diimport (skip yang error)
- Template download (CSV, JSON, XML)
- Tombol "Copy AI Prompt" untuk convert PDF/dokumen ke JSON menggunakan AI eksternal
- Preview sebelum konfirmasi simpan

### Out of Scope
- Import soal dengan gambar (image_url tidak didukung via import)
- Konversi PDF otomatis di dalam aplikasi (hanya static prompt)
- Import dari format lain (Excel, Google Sheets)
- Edit soal saat preview (hanya accept/reject per baris)
- Import dengan auto-tagging atau auto-categorization

## 3. Functional Requirements

### FR-1: Upload File
- Admin upload file dari halaman import (di /admin/questions/import)
- Format yang didukung: .csv, .json, .xml
- Max file size: 5MB
- Drag & drop atau klik untuk browse
- Setelah upload, file di-parse di server

### FR-2: Parse File
- CSV: papaparse dengan header row sebagai key
- JSON: array of objects, setiap object = 1 soal
- XML: fast-xml-parser, root element `<questions>`, child `<question>` per soal
- Hasil parse: array of raw question objects
- Parse error (format file rusak): tampilkan error, tidak lanjut ke preview

### FR-3: Validasi
- Setiap soal divalidasi:
  - Field mandatory ada: tingkat, level, matpel, questionType, content, explanation
  - questionType valid: MULTIPLE_CHOICE, SHORT_ANSWER, ESSAY
  - tingkat valid: SD, SMP, SMA
  - level valid: OSNK, OSNP, SEMIFINAL, FINAL
  - MULTIPLE_CHOICE: options array (min 2), correctOption integer (index, 0-based, < options.length)
  - SHORT_ANSWER: acceptableAnswers array (min 1)
  - ESSAY: acceptableAnswers array (min 1, numeric string)
- Hasil: setiap soal ditandai valid/invalid + error message
- Tampilkan di preview tabel dengan warna: hijau (valid), merah (invalid)

### FR-4: Preview Tabel
- Tampilkan semua soal yang berhasil di-parse dalam tabel
- Kolom: nomor, tingkat, level, matpel, questionType, content (truncated), status (valid/invalid), error message
- Baris invalid: highlighted merah, checkbox unchecked (tidak akan diimport)
- Baris valid: checkbox checked (akan diimport)
- Admin bisa toggle checkbox per baris (pilih mana yang diimport)
- Tombol "Select All Valid" / "Deselect All"
- Summary: "X soal valid, Y soal error, Z dipilih untuk import"

### FR-5: Konfirmasi & Simpan
- Tombol "Import Z Soal" (hanya yang checked)
- Konfirmasi modal: "Anda akan mengimport Z soal. Lanjutkan?"
- Setelah konfirmasi: bulk insert ke database
- Sukses: tampilkan jumlah berhasil, redirect ke daftar soal
- Partial sukses: tampilkan jumlah berhasil + jumlah gagal (jika ada race condition)
- Error di DB level: rollback transaksi, tampilkan error

### FR-6: Template Download
- 3 template tersedia: CSV, JSON, XML
- Setiap template berisi 2-3 contoh soal (1 MC, 1 SA, 1 ESSAY)
- Template dapat diunduh dari halaman import
- Endpoint: GET /api/admin/import/template/[format]

### FR-7: AI Prompt Helper
- Static prompt yang bisa di-copy oleh admin
- Prompt ini ditempel ke AI eksternal (ChatGPT, Claude, dll) untuk convert PDF/dokumen ke JSON format
- Tombol "Copy AI Prompt" → copy ke clipboard
- Tampilkan area text yang berisi prompt (read-only, bisa di-copy)
- Prompt berisi: instruksi format, schema JSON, contoh output

## 4. Non-Functional Requirements

### NFR-1: Performance
- Parse file 1000 soal: < 2 detik
- Preview render 1000 baris: < 1 detik (virtualized atau pagination)
- Bulk insert 1000 soal: < 5 detik

### NFR-2: UX
- Preview tabel dengan pagination jika > 100 baris
- Error messages jelas dan actionable
- Progress indicator saat upload + parse + insert
- Template download instant

### NFR-3: Security
- File upload: validate extension (.csv, .json, .xml only)
- File size limit: 5MB
- Content sanitization: strip HTML tags dari content (XSS prevention)
- Only ADMIN can access import endpoints

## 5. JSON Import Format (Reference)

```json
[
  {
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Matematika",
    "questionType": "MULTIPLE_CHOICE",
    "content": "Hitung nilai dari $\\int_0^1 x^2 \\, dx$",
    "options": ["1/3", "1/2", "1", "0"],
    "correctOption": 0,
    "acceptableAnswers": [],
    "explanation": "Integral dari $x^2$ adalah $\\frac{x^3}{3}$, evaluasi dari 0 ke 1 memberikan $\\frac{1}{3}$."
  },
  {
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Fisika",
    "questionType": "SHORT_ANSWER",
    "content": "Berapa kecepatan cahaya dalam ruang hampa (dalam m/s)?",
    "options": [],
    "correctOption": null,
    "acceptableAnswers": ["3e8", "300000000", "3x10^8"],
    "explanation": "Kecepatan cahaya dalam ruang hampa adalah tepat 299.792.458 m/s, dibulatkan menjadi $3 \\times 10^8$ m/s."
  },
  {
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Matematika",
    "questionType": "ESSAY",
    "content": "Sebuah bola dilempar vertikal ke atas dengan kecepatan awal $20 \\text{ m/s}$. Berapa ketinggian maksimum yang dicapai bola? (g = 10 m/s²)",
    "options": [],
    "correctOption": null,
    "acceptableAnswers": ["20"],
    "explanation": "Dengan $v_0 = 20$ m/s dan $g = 10$ m/s², ketinggian maksimum adalah $h = \\frac{v_0^2}{2g} = \\frac{400}{20} = 20$ meter."
  }
]
```

## 6. Static AI Prompt (Reference)

Text lengkap AI Prompt akan disertakan di `component-guideline.md`.

## 7. Dependencies

| Dependency | Modul | Keterangan |
|---|---|---|
| AUTH | Internal | Admin harus login (ADMIN role) |
| Question table | DB | Target insert |
| papaparse | External | CSV parsing |
| fast-xml-parser | External | XML parsing |
| Next.js API Routes | Internal | File upload + processing |
