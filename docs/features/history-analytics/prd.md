# PRD — HISTORY & ANALITIK Module

## 1. Overview

History & Analitik adalah modul yang menampilkan perjalanan belajar siswa secara visual. Siswa dapat melihat riwayat semua sesi exam, detail skor per batch, grafik perkembangan skor lintas sesi (line chart "journey dari bodoh jadi pintar"), statistik kumulatif, streak harian dengan milestone pop-up, serta akurasi per mata pelajaran dari StudyAttempt.

## 2. Scope

### In Scope
- Riwayat semua ExamSession:
  - Tabel: tanggal, filter (tingkat/level/matpel), total soal, skor rata-rata, status
  - Klik sesi → detail batch (skor per batch, benar/salah per batch)
- Grafik skor per batch across semua sesi (line chart — journey belajar)
  - Filter grafik per matpel / level / tingkat
- Statistik kumulatif:
  - Total soal dikerjakan
  - Total jawaban benar
  - Total jawaban salah
  - Akurasi % (benar / total jawaban)
- Streak harian:
  - Berapa hari berturut-turut user aktif (study atau exam)
  - Streak counter display
  - Milestone pop-up saat streak 3/7/14/30 hari (animasi eye-catchy, pesan motivasi)
- Bar chart akurasi per matpel dari StudyAttempt

### Out of Scope
- Real-time analytics (data di-fetch saat buka halaman, tidak live-update)
- Export analytics (PDF/Excel)
- Leaderboard / perbandingan antar siswa
- Analitik per soal (which questions are most missed)
- Predictive analytics / rekomendasi

## 3. Functional Requirements

### FR-1: Session History List
- Tampilkan semua ExamSession untuk user yang login
- Data per sesi: tanggal (createdAt), filter (tingkat/level/matpel), total soal, skor rata-rata, status (ACTIVE/COMPLETED/ABANDONED)
- Sorting: terbaru di atas (default)
- Pagination: 10 sesi per page
- Klik sesi → buka SessionDetailModal atau redirect ke detail page

### FR-2: Session Detail
- Tampilkan detail batch untuk sesi yang dipilih:
  - Batch index, jumlah soal, skor, benar, salah, submittedAt
  - Visual: progress bar per batch (skor)
- Bisa expand/collapse per batch untuk lihat detail soal

### FR-3: Score Journey Chart (Line Chart)
- Line chart: x-axis = batch index (lintas semua sesi, urut kronologis)
- y-axis = skor (0-100)
- Setiap titik = 1 batch submission
- Garis menghubungkan titik-titik → visualisasi "journey belajar"
- Tooltip: sesi tanggal, batch ke-, matpel, skor
- Filter: per matpel / level / tingkat (dropdown)

### FR-4: Cumulative Statistics
- StatsCard menampilkan:
  - Total soal dikerjakan (count dari semua StudyAttempt + ExamBatch answers)
  - Total jawaban benar
  - Total jawaban salah
  - Akurasi % = (benar / (benar + salah)) * 100
- Data di-aggregate dari StudyAttempt + ExamBatch

### FR-5: Streak Display
- Tampilkan streak harian saat ini (hari berturut-turut aktif)
- Streak counter: "🔥 X hari streak"
- Data dari StreakLog + User.streak
- Tampilkan tanggal mulai streak

### FR-6: Streak Milestone Pop-up
- Saat user mencapai streak 3, 7, 14, atau 30 hari:
  - Pop-up animasi (CSS keyframes: scale + fade + confetti effect)
  - Pesan motivasi sesuai milestone
  - Tombol "Lanjut Belajar!" untuk menutup
  - Hanya muncul sekali per milestone (disimpan flag di state/localStorage)
- Milestone messages:
  - 3 hari: "Hebat! 3 hari berturut-turut belajar. Teruskan semangatnya! 🔥"
  - 7 hari: "Luar biasa! 1 minggu penuh konsisten! Kamu sedang membentuk kebiasaan! ⭐"
  - 14 hari: "2 minggu! Kamu sungguh pantang menyerah. OSN menanti! 💪"
  - 30 hari: "SEKUAT TENAGA! 30 hari streak! Kamu adalah juara sejati! 🏆"

### FR-7: Subject Accuracy Chart (Bar Chart)
- Bar chart: akurasi (%) per matpel
- Data dari StudyAttempt: hitung (isCorrect=true / total attempts) * 100 per matpel
- Horizontal bars, sorted by accuracy descending
- Tooltip: matpel, total attempts, total correct, accuracy %
- Filter: per tingkat / level (optional)

## 4. Non-Functional Requirements

### NFR-1: Performance
- GET sessions list: < 300ms
- GET session detail: < 200ms
- GET analytics: < 500ms (aggregation query)
- GET streak: < 100ms
- GET study-stats: < 300ms
- Chart rendering: < 1s

### NFR-2: UX
- Charts responsive (desktop + mobile)
- Loading skeletons for all data
- Empty states: "Belum ada riwayat sesi" / "Belum ada data belajar"
- Milestone pop-up: animasi smooth, tidak blocking (auto-dismiss setelah 10s jika tidak diklik)

### NFR-3: Data Freshness
- Data di-fetch saat halaman dibuka (no caching, no polling)
- Streak di-update saat user melakukan study attempt atau exam batch submit

## 5. Dependencies

| Dependency | Modul | Keterangan |
|---|---|---|
| AUTH | Internal | Siswa harus login |
| ExamSession table | DB | Riwayat sesi exam |
| ExamBatch table | DB | Detail batch + skor |
| StudyAttempt table | DB | Statistik study + akurasi per matpel |
| StreakLog table | DB | Streak harian |
| User table | DB | User.streak, lastActiveDate |
| recharts | External | Line chart + bar chart |
| KaTeX | External | Tidak digunakan di modul ini (data numerik saja) |
