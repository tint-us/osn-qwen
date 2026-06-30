# PRD — STUDY MODE Module

## 1. Overview

Study Mode adalah mode latihan bebas di mana siswa mengerjakan soal OSN satu per satu dengan feedback instan setelah menjawab. Tidak ada batas waktu, tidak ada sesi atau batch, siswa bisa berhenti kapan saja. Setiap jawaban dicatat untuk analitik.

## 2. Scope

### In Scope
- Filter soal wajib: tingkat (SD/SMP/SMA) + level (OSNK/OSNP/SEMIFINAL/FINAL) + matpel (multi-select)
- Soal ditampilkan satu per satu
- Urutan soal diacak tiap sesi
- Urutan pilihan jawaban (MULTIPLE_CHOICE) juga diacak
- Tipe soal yang didukung:
  - `MULTIPLE_CHOICE` — radio button, pilih satu jawaban
  - `SHORT_ANSWER` — text input, cocok ke `acceptableAnswers[]` (case-insensitive, trim whitespace)
  - `ESSAY` — number input, grading berdasarkan angka jawaban final saja
- Feedback instan setelah jawab: tampilkan benar/salah + pembahasan
- Gambar soal ditampilkan jika ada `imageUrl`
- LaTeX di-render via KaTeX (`$...$` inline, `$$...$$` display)
- Setiap jawaban dicatat di tabel `StudyAttempt`
- Tidak ada sesi/batch — bebas berhenti kapan saja
- Navigasi: soal berikutnya setelah feedback

### Out of Scope
- Pencarian soal by keyword (full-text search)
- Bookmark/favorite soal
- Mode latihan dengan timer
- Export hasil latihan
- Soal bergambar dengan multiple images (hanya 1 gambar per soal)

## 3. Functional Requirements

### FR-1: Filter Soal
- Siswa wajib memilih filter sebelum mulai:
  - Tingkat: SD / SMP / SMA (pilih salah satu, wajib)
  - Level: OSNK / OSNP / SEMIFINAL / FINAL (pilih salah satu, wajib)
  - Matpel: multi-select (minimal 1, wajib)
- Setelah filter dipilih, sistem fetch soal sesuai filter
- Soal diacak urutannya
- Jika tidak ada soal yang match: tampilkan pesan "Belum ada soal untuk filter ini"

### FR-2: Tampilan Soal
- Satu soal per halaman (bukan list/scroll)
- Nomor soal: "Soal 3 dari 25"
- Jika soal punya gambar: tampilkan gambar di bawah konten teks soal
- LaTeX di-render: `$...$` inline, `$$...$$` display mode
- Tipe soal menentukan input:
  - MULTIPLE_CHOICE: radio button dengan pilihan yang sudah diacak
  - SHORT_ANSWER: text input
  - ESSAY: number input (hanya angka)

### FR-3: Submit Jawaban
- Siswa klik "Submit Jawaban"
- Validasi: jawaban tidak boleh kosong
- Kirim jawaban ke server untuk grading
- Tampilkan loading state saat grading

### FR-4: Feedback Instan
- Setelah grading, tampilkan:
  - Status: BENAR / SALAH
  - Jawaban yang benar (jika salah)
  - Pembahasan (explanation)
- Tombol "Soal Berikutnya" muncul setelah feedback

### FR-5: Navigasi
- Tombol "Soal Berikutnya" → lanjut ke soal selanjutnya
- Tidak ada tombol "Kembali" (soal sudah dijawab, tidak bisa ubah)
- Jika soal terakhir: tampilkan "Selesai" + ringkasan singkat (total benar/salah)
- Siswa bisa keluar kapan saja (tidak ada konfirmasi, langsung kembali ke dashboard)

### FR-6: Pencatatan Attempt
- Setiap jawaban disimpan di `StudyAttempt`:
  - userId, questionId, userAnswer, isCorrect, answeredAt
- Update StreakLog untuk hari ini
- Update User.streak dan User.lastActiveDate

## 4. Non-Functional Requirements

### NFR-1: Performance
- Fetch soal (dengan filter): < 300ms
- Submit jawaban + grading: < 200ms
- KaTeX render: < 100ms per soal

### NFR-2: UX
- Transition antar soal smooth (fade/slide)
- Loading indicator saat fetch dan grading
- Layout tidak shift saat feedback muncul
- Gambar soal lazy-loaded

### NFR-3: Math Rendering
- LaTeX `$...$` (inline) dan `$$...$$` (display) harus ter-render
- Jika LaTeX gagal parse: tampilkan raw text (tidak crash)
- Tidak boleh ada XSS via LaTeX

## 5. Dependencies

| Dependency | Modul | Keterangan |
|---|---|---|
| AUTH | Internal | Siswa harus login untuk akses Study Mode |
| Question table | DB | Sumber data soal |
| StudyAttempt table | DB | Pencatatan jawaban |
| StreakLog table | DB | Update streak harian |
| KaTeX | External | Render LaTeX di soal dan pembahasan |
| Zustand | External | UI state: current question index, selected answer |
