# User Stories — HISTORY & ANALITIK Module

## US-HIST-01: Lihat Riwayat Sesi Exam

**As a** siswa,
**I want to** melihat semua riwayat sesi ujian saya,
**So that** saya bisa melacak aktivitas belajar saya.

### Acceptance Criteria
- [ ] Halaman /history menampilkan daftar ExamSession
- [ ] Setiap entri: tanggal, filter, total soal, skor rata-rata, status
- [ ] Sorting terbaru di atas
- [ ] Pagination 10 sesi per page
- [ ] Loading skeleton saat fetch data
- [ ] Empty state: "Belum ada riwayat sesi" jika belum ada sesi

---

## US-HIST-02: Lihat Detail Sesi

**As a** siswa,
**I want to** melihat detail batch dari sesi tertentu,
**So that** saya tahu skor per batch.

### Acceptance Criteria
- [ ] Klik sesi → buka SessionDetailModal
- [ ] Tampilkan semua batch: batch index, jumlah soal, skor, benar, salah
- [ ] Progress bar visual per batch (skor 0-100)
- [ ] Bisa expand/collapse per batch untuk lihat detail soal
- [ ] Timestamp submittedAt per batch

---

## US-HIST-03: Grafik Journey Belajar

**As a** siswa,
**I want to** melihat grafik skor per batch lintas semua sesi,
**So that** saya melihat progress belajar saya dari waktu ke waktu.

### Acceptance Criteria
- [ ] Line chart: x = batch index (kronologis), y = skor (0-100)
- [ ] Setiap titik = 1 batch submission
- [ ] Garis menghubungkan titik-titik
- [ ] Tooltip: tanggal sesi, batch ke-, matpel, skor
- [ ] Filter dropdown: per matpel / level / tingkat
- [ ] Chart responsive (desktop + mobile)

---

## US-HIST-04: Statistik Kumulatif

**As a** siswa,
**I want to** melihat statistik kumulatif belajar saya,
**So that** saya tahu total progress saya.

### Acceptance Criteria
- [ ] StatsCard: total soal dikerjakan
- [ ] StatsCard: total jawaban benar
- [ ] StatsCard: total jawaban salah
- [ ] StatsCard: akurasi % (benar / total * 100)
- [ ] Data dari StudyAttempt + ExamBatch
- [ ] Loading skeleton saat fetch

---

## US-HIST-05: Lihat Streak Harian

**As a** siswa,
**I want to** melihat streak belajar harian saya,
**So that** saya termotivasi untuk konsisten.

### Acceptance Criteria
- [ ] Tampilkan "🔥 X hari streak"
- [ ] Data dari User.streak
- [ ] Jika streak = 0: "Mulai belajar hari ini untuk memulai streak! 🔥"
- [ ] Tampilkan tanggal mulai streak (opsional)

---

## US-HIST-06: Milestone Pop-up

**As a** siswa,
**I want to** mendapat pop-up saat mencapai milestone streak,
**So that** saya merasa dihargai dan termotivasi.

### Acceptance Criteria
- [ ] Pop-up muncul saat streak = 3, 7, 14, atau 30 hari
- [ ] Animasi: scale + fade + confetti effect (CSS keyframes)
- [ ] Pesan motivasi sesuai milestone
- [ ] Tombol "Lanjut Belajar!" untuk menutup
- [ ] Auto-dismiss setelah 10 detik
- [ ] Hanya muncul sekali per milestone (flag di localStorage)
- [ ] Milestone 3: "Hebat! 3 hari berturut-turut belajar. Teruskan semangatnya! 🔥"
- [ ] Milestone 7: "Luar biasa! 1 minggu penuh konsisten! Kamu sedang membentuk kebiasaan! ⭐"
- [ ] Milestone 14: "2 minggu! Kamu sungguh pantang menyerah. OSN menanti! 💪"
- [ ] Milestone 30: "SEKUAT TENAGA! 30 hari streak! Kamu adalah juara sejati! 🏆"

---

## US-HIST-07: Akurasi per Mata Pelajaran

**As a** siswa,
**I want to** melihat akurasi saya per matpel,
**So that** saya tahu mata pelajaran mana yang perlu ditingkatkan.

### Acceptance Criteria
- [ ] Bar chart horizontal: akurasi (%) per matpel
- [ ] Data dari StudyAttempt: (correct / total) * 100 per matpel
- [ ] Sorted by accuracy descending
- [ ] Tooltip: matpel, total attempts, total correct, accuracy %
- [ ] Filter optional: per tingkat / level

---

## US-HIST-08: Filter Grafik Journey

**As a** siswa,
**I want to** filter grafik journey per matpel/level/tingkat,
**So that** saya bisa fokus pada kategori tertentu.

### Acceptance Criteria
- [ ] Dropdown filter di atas line chart
- [ ] Filter by matpel (multi-select)
- [ ] Filter by level (single select)
- [ ] Filter by tingkat (single select)
- [ ] Chart re-render saat filter berubah
- [ ] "Reset Filter" button

---

## US-HIST-09: Empty States

**As a** siswa,
**I want to** melihat pesan yang jelas saat belum ada data,
**So that** saya tahu apa yang harus dilakukan.

### Acceptance Criteria
- [ ] No sessions: "Belum ada riwayat sesi. Mulai ujian pertama Anda! 📝" + tombol "Mulai Ujian"
- [ ] No study attempts: "Belum ada data belajar. Coba Study Mode! 📚" + tombol "Belajar Sekarang"
- [ ] No streak: "Mulai belajar hari ini untuk memulai streak! 🔥"
- [ ] Charts with no data: "Belum cukup data untuk menampilkan grafik"
