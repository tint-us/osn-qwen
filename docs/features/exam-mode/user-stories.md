# User Stories — EXAM MODE Module

## US-EXAM-01: Setup Exam

**As a** siswa,
**I want to** mengatur batch size dan timer sebelum mulai ujian,
**So that** saya bisa sesuaikan dengan preferensi saya.

### Acceptance Criteria
- [ ] Setelah pilih filter, masuk ke halaman setup
- [ ] Batch size: slider/dropdown 10-30, default 10
- [ ] Timer toggle: on/off
- [ ] Jika timer on: input durasi menit (default 30)
- [ ] Tombol "Mulai Ujian" → create session + redirect ke batch pertama

---

## US-EXAM-02: Soal Diacak dan Dibagi ke Batch

**As a** siswa,
**I want to** soal diacak dan dibagi ke batch,
**So that** setiap sesi ujian berbeda.

### Acceptance Criteria
- [ ] Semua soal sesuai filter di-fetch
- [ ] Urutan soal diacak (Fisher-Yates, server-side)
- [ ] Pilihan jawaban MC juga diacak
- [ ] Soal dibagi ke batch sesuai batchSize
- [ ] Batch terakhir boleh < batchSize
- [ ] Tidak ada pengulangan soal antar batch dalam 1 sesi

---

## US-EXAM-03: Mengerjakan Soal dalam Batch

**As a** siswa,
**I want to** mengerjakan soal satu per satu dalam batch,
**So that** saya bisa fokus pada satu soal.

### Acceptance Criteria
- [ ] Soal ditampilkan satu per satu
- [ ] Navigasi: "Berikutnya" dan "Sebelumnya" (bolak-balik dalam batch)
- [ ] Jawaban disimpan di Zustand (belum dikirim per soal)
- [ ] TIDAK ada feedback (benar/salah) selama ujian
- [ ] Nomor soal: "Soal 3 dari 10 (Batch 1 dari 3)"
- [ ] Input sesuai questionType (radio/text/number)

---

## US-EXAM-04: Countdown Timer

**As a** siswa,
**I want to** melihat timer countdown,
**So that** saya tahu sisa waktu untuk batch ini.

### Acceptance Criteria
- [ ] Timer ditampilkan jika timer on
- [ ] Timer mulai saat batch pertama kali dibuka
- [ ] Format: MM:SS atau HH:MM:SS
- [ ] Warning kuning saat < 5 menit
- [ ] Warning merah saat < 1 menit
- [ ] Timer berjalan real-time (update tiap detik)

---

## US-EXAM-05: Auto-Submit saat Timer Habis

**As a** siswa,
**I want to** batch otomatis di-submit saat timer habis,
**So that** ujian selesai tepat waktu.

### Acceptance Criteria
- [ ] Saat timer = 00:00: auto-submit batch
- [ ] Jawaban yang sudah diisi tetap tersimpan
- [ ] Jawaban yang kosong tetap di-submit (kosong = salah)
- [ ] Redirect ke review page setelah auto-submit
- [ ] Indikasi "Waktu habis" di review page

---

## US-EXAM-06: Submit Batch Manual

**As a** siswa,
**I want to** submit batch sebelum timer habis,
**So that** saya bisa lanjut ke batch berikutnya.

### Acceptance Criteria
- [ ] Tombol "Submit Batch" tersedia
- [ ] Konfirmasi modal sebelum submit: "Yakin submit batch ini?"
- [ ] Jika ada soal belum dijawab: tampilkan jumlah belum dijawab di modal
- [ ] Setelah submit: timer di-pause, redirect ke review page

---

## US-EXAM-07: Batch Review dan Pembahasan

**As a** siswa,
**I want to** melihat hasil dan pembahasan setelah submit batch,
**So that** saya bisa belajar dari kesalahan.

### Acceptance Criteria
- [ ] Tampilkan skor: X/100
- [ ] Tampilkan total benar dan salah
- [ ] Review per soal: soal, jawaban user, jawaban benar, pembahasan
- [ ] Pembahasan mendukung LaTeX (KaTeX)
- [ ] Tanda visual: hijau untuk benar, merah untuk salah
- [ ] Tombol "Batch Berikutnya" (jika bukan terakhir)

---

## US-EXAM-08: Batch Analytics

**As a** siswa,
**I want to** melihat perbandingan skor antar batch,
**So that** saya tahu progress belajar saya.

### Acceptance Criteria
- [ ] Line chart: skor per batch
- [ ] Bar chart: benar vs salah per batch (kumulatif)
- [ ] Tampilkan skor rata-rata
- [ ] Tampilkan trend: naik/turun/stabil

---

## US-EXAM-09: Resume Sesi

**As a** siswa,
**I want to** melanjutkan sesi ujian yang terputus,
**So that** saya tidak perlu mulai dari awal.

### Acceptance Criteria
- [ ] Saat buka Exam Mode: cek sesi ACTIVE
- [ ] Jika ada: modal "Resume sesi atau mulai baru?"
- [ ] Resume: lanjut dari batch terakhir yang belum di-submit
- [ ] Resume: load progress jawaban dari DB (sync terakhir)
- [ ] Mulai baru: set sesi lama = ABANDONED, buat sesi baru

---

## US-EXAM-10: Sync Progress ke DB

**As a** siswa,
**I want to** progress jawaban tersimpan otomatis,
**So that** jika disconnect, saya tidak kehilangan jawaban.

### Acceptance Criteria
- [ ] Zustand state di-sync ke DB tiap 30 detik
- [ ] Sync: kirim answers + currentBatchIndex + currentQuestionIndex
- [ ] Sync terjadi secara background (tidak mengganggu UI)
- [ ] Jika sync gagal: retry di interval berikutnya
- [ ] Saat resume: load dari sync terakhir

---

## US-EXAM-11: Navigasi Antar Soal

**As a** siswa,
**I want to** navigasi bolak-balik antar soal dalam batch,
**So that** saya bisa review jawaban sebelum submit.

### Acceptance Criteria
- [ ] Tombol "Berikutnya" dan "Sebelumnya"
- [ ] Nomor soal navigable (klik nomor untuk jump ke soal tertentu)
- [ ] Indikator soal yang sudah dijawab vs belum
- [ ] Tidak bisa navigasi ke batch lain (hanya dalam batch saat ini)

---

## US-EXAM-12: Selesai — Ringkasan Akhir

**As a** siswa,
**I want to** melihat ringkasan akhir setelah semua batch selesai,
**So that** saya tahu hasil keseluruhan.

### Acceptance Criteria
- [ ] Skor rata-rata semua batch
- [ ] Total benar vs salah (kumulatif)
- [ ] Line chart semua batch
- [ ] Tombol "Kembali ke Dashboard"
- [ ] Sesi status = COMPLETED
