# PRD — EXAM MODE Module

## 1. Overview

Exam Mode adalah mode simulasi ujian di mana siswa mengerjakan soal dalam sistem sesi + batch. Soal dibagi ke dalam batch (10-30 soal per batch), dengan countdown timer opsional per batch. Tidak ada feedback selama ujian — feedback dan pembahasan hanya muncul setelah submit per batch. Sesi bisa di-resume jika siswa disconnect.

## 2. Scope

### In Scope
- Filter sama dengan Study Mode: tingkat (SD/SMP/SMA) + level (OSNK/OSNP/SEMIFINAL/FINAL) + matpel (multi-select) — wajib
- Setup exam sebelum mulai:
  - Batch size: 10-30 soal per batch (default 10, configurable)
  - Timer toggle: on/off
  - Timer duration: configurable (dalam menit, per batch)
- Sistem sesi + batch:
  - 1 sesi = seluruh soal dari filter dibagi ke batch-batch
  - Soal diacak urutannya tiap sesi baru
  - Pilihan jawaban (MULTIPLE_CHOICE) juga diacak
  - Dalam 1 sesi, tidak ada pengulangan soal antar batch
  - Soal baru berulang jika memulai sesi baru
- Selama ujian: TIDAK ada feedback (no benar/salah, no pembahasan)
- Submit per batch:
  - Setelah submit: tampil skor + review + pembahasan per soal
  - Auto-submit jika timer habis
  - Analitik per batch (skor, benar/salah, perbandingan dengan batch sebelumnya)
- Resume sesi:
  - Jika siswa disconnect, saat login ulang ditawarkan resume atau mulai sesi baru
  - Resume melanjutkan dari batch terakhir yang belum di-submit
- Countdown timer per batch:
  - Timer mulai saat batch pertama kali dibuka
  - Auto-submit saat timer habis
  - Timer di-pause saat batch di-submit (review time tidak terkena timer)
- Sync Zustand ke DB tiap 30 detik (untuk recovery jika disconnect)

### Out of Scope
- Timer per soal (hanya per batch)
- Pause timer manual (hanya auto-pause saat submit batch)
- Exam sharing antar siswa
- Custom soal selection (hanya via filter)
- Export hasil exam

## 3. Functional Requirements

### FR-1: Exam Setup
- Setelah pilih filter, siswa masuk ke setup page:
  - Pilih batch size (10-30, slider atau dropdown, default 10)
  - Toggle timer on/off
  - Jika timer on: input durasi dalam menit (default 30 menit per batch)
- Tombol "Mulai Ujian" → buat ExamSession baru
- Sistem mengambil semua soal sesuai filter, mengacak urutan, membagi ke batch

### FR-2: Session Creation
- Buat ExamSession record:
  - userId, filter (JSON), totalQuestions, batchSize, status=ACTIVE
  - questionOrder: array of Question.id yang sudah diacak
  - currentBatchIndex: 0
- Buat ExamBatch records:
  - Setiap batch berisi questionIds sesuai batchSize
  - Batch terakhir mungkin < batchSize jika total soal tidak habis dibagi
  - startedAt untuk batch pertama

### FR-3: Mengerjakan Batch
- Tampilkan soal satu per satu dalam batch
- Navigasi: "Soal Berikutnya" dan "Soal Sebelumnya" (bisa bolak-balik dalam batch)
- Timer countdown ditampilkan (jika timer on)
- Jawaban disimpan di Zustand (belum dikirim ke server per soal)
- Sync Zustand ke DB tiap 30 detik (answers progress)
- TIDAK ada feedback selama mengerjakan
- Tombol "Submit Batch" → submit semua jawaban di batch

### FR-4: Submit Batch
- Validasi: semua soal sudah dijawab? (opsional — bisa submit dengan jawaban kosong)
- Kirim semua jawaban ke server untuk grading
- Auto-grade semua jawaban
- Simpan ke ExamBatch: answers (JSON), score, totalCorrect, totalWrong, submittedAt
- Update ExamSession: currentBatchIndex++
- Jika batch terakhir: set status=COMPLETED
- Update StreakLog

### FR-5: Batch Review & Analytics
- Setelah submit batch, tampilkan:
  - Skor batch (0-100)
  - Total benar, total salah
  - Review per soal: soal, jawaban user, jawaban benar, pembahasan
  - Analitik: perbandingan skor dengan batch sebelumnya (chart)
- Tombol "Batch Berikutnya" (jika bukan batch terakhir)
- Tombol "Selesai" (jika batch terakhir) → ringkasan akhir

### FR-6: Timer
- Timer per batch, bukan per sesi
- Mulai saat batch pertama kali dibuka (GET batch endpoint)
- Countdown: durasi yang dikonfigurasi
- Jika timer habis: auto-submit batch (semua jawaban yang sudah diisi)
- Timer display: MM:SS atau HH:MM:SS
- Warning visual saat < 5 menit (kuning) dan < 1 menit (merah)

### FR-7: Resume Session
- Saat siswa login dan buka Exam Mode:
  - Cek apakah ada ExamSession dengan status=ACTIVE untuk user ini
  - Jika ada: tampilkan modal "Anda memiliki sesi ujian yang belum selesai. Resume atau mulai baru?"
  - Resume: lanjut dari currentBatchIndex (batch yang belum di-submit)
  - Mulai baru: set sesi lama status=ABANDONED, buat sesi baru

### FR-8: Sync to DB
- Zustand store menyimpan exam state (answers, current question index, timer)
- Setiap 30 detik: PATCH /api/exam/sessions/[id]/sync dengan progress terbaru
- Jika siswa disconnect: progress tersimpan di DB (terakhir sync)
- Saat resume: load dari DB ke Zustand

## 4. Non-Functional Requirements

### NFR-1: Performance
- Create session (fetch + shuffle + divide): < 500ms
- Get batch: < 200ms
- Submit batch (grade all + save): < 300ms
- Sync: < 200ms
- Timer accuracy: ±1 detik

### NFR-2: Reliability
- Sync tiap 30 detik memastikan progress tidak hilang
- Auto-submit saat timer habis: guaranteed (server-side check)
- Resume: state restored dari DB, bukan dari localStorage

### NFR-3: UX
- Timer selalu visible
- Navigasi antar soal smooth
- Submit confirmation (modal) sebelum submit batch
- Review page: scrollable, collapsible per soal
- Analytics chart: line chart skor per batch

## 5. Dependencies

| Dependency | Modul | Keterangan |
|---|---|---|
| AUTH | Internal | Siswa harus login |
| Question table | DB | Sumber soal |
| ExamSession table | DB | Pencatatan sesi |
| ExamBatch table | DB | Pencatatan batch + jawaban |
| StreakLog table | DB | Update streak |
| Zustand | External | Exam state (answers, timer, navigation) |
| KaTeX | External | Render soal + pembahasan |
