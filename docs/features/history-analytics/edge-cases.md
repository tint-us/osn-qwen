# Edge Cases — HISTORY & ANALITIK Module

## EC-HIST-01: User Baru — Tidak Ada Data Apapun

**Skenario:** Siswa baru registrasi, belum pernah study atau exam.

**Expected behavior:**
- SessionHistoryList: empty state "Belum ada riwayat sesi. Mulai ujian pertama Anda! 📝"
- StatsCards: semua 0, akurasi 0%
- BatchScoreChart: empty state "Belum cukup data untuk menampilkan grafik"
- SubjectAccuracyChart: empty state "Belum ada data belajar"
- StreakDisplay: "Mulai belajar hari ini untuk memulai streak! 🔥"
- Tidak ada error

---

## EC-HIST-02: Streak Putus — Resume

**Skenario:** Siswa streak 5 hari, skip 2 hari, lalu kembali belajar.

**Expected behavior:**
- StreakLog terakhir: 2 hari lalu
- lastActiveDate: 2 hari lalu (bukan yesterday)
- Saat user belajar lagi: streak = 1 (reset)
- StreakDisplay: "🔥 1 hari streak"
- Tidak ada milestone pop-up (1 bukan milestone)

---

## EC-HIST-03: Milestone Muncul Saat Refresh

**Skenario:** User streak 3, buka /history, tutup pop-up, lalu refresh halaman.

**Expected behavior:**
- Saat pertama buka: pop-up muncul, localStorage flag diset
- Saat refresh: flag `milestone_3_shown` = 'true'
- Pop-up TIDAK muncul lagi
- Hanya muncul lagi jika user mencapai milestone berikutnya (7)

---

## EC-HIST-04: Milestone di Berberapa Tab

**Skenario:** User buka /history di 2 tab secara bersamaan, streak = 7.

**Expected behavior:**
- Kedua tab fetch data: streak = 7
- Tab 1: flag belum ada → pop-up muncul → set flag
- Tab 2: flag belum ada (race condition) → pop-up muncul juga
- Acceptable: kedua tab menampilkan pop-up (tidak critical)
- Setelah dismiss di salah satu tab, tab lain tetap bisa dismiss

---

## EC-HIST-05: Sesi ACTIVE di Riwayat

**Skenario:** Siswa punya sesi ACTIVE (belum selesai) di riwayat.

**Expected behavior:**
- Sesi ACTIVE muncul di list dengan badge "Sedang Berlangsung"
- Skor rata-rata: hanya dari batch yang sudah di-submit
- Tombol di detail modal: "Lanjutkan Sesi" → redirect ke /exam/session/[id]/batch/[currentBatchIndex]
- Jika belum ada batch yang di-submit: skor rata-rata = "—"

---

## EC-HIST-06: Sesi ABANDONED di Riwayat

**Skenario:** Siswa punya sesi ABANDONED di riwayat.

**Expected behavior:**
- Sesi ABANDONED muncul di list dengan badge "Ditinggalkan"
- Skor rata-rata: dari batch yang sudah di-submit sebelum abandon
- Tidak bisa resume (tombol resume tidak ada)
- Detail: batch yang belum di-submit tampil sebagai "Tidak Dikerjakan"

---

## EC-HIST-07: Chart dengan 1 Titik Data

**Skenario:** Siswa hanya punya 1 batch submission (1 sesi, 1 batch).

**Expected behavior:**
- BatchScoreChart: menampilkan 1 titik (no line, just dot)
- Chart tetap dirender (tidak empty state)
- Tooltip berfungsi normal
- SubjectAccuracyChart: jika 1 matpel, 1 bar ditampilkan

---

## EC-HIST-08: Akurasi 0% — Semua Salah

**Skenario:** Siswa menjawab 20 soal, semua salah.

**Expected behavior:**
- Total correct: 0
- Total wrong: 20
- Akurasi: 0.0%
- StatsCard menampilkan "0" untuk correct, "20" untuk wrong, "0.0%" untuk akurasi
- SubjectAccuracyChart: bar matpel di 0% (merah)
- Tidak ada error (zero division ditangani)

---

## EC-HIST-09: localStorage Dihapus

**Skenario:** User hapus browser data (clear localStorage), streak = 7.

**Expected behavior:**
- Flag `milestone_7_shown` hilang
- Saat buka /history: pop-up muncul lagi (sudah pernah dilihat sebelumnya)
- Acceptable: pop-up muncul ulang (tidak critical, user akan close)
- Tidak ada cara untuk mencegah ini tanpa server-side flag

---

## EC-HIST-10: Filter Tidak Menghasilkan Data

**Skenario:** User filter BatchScoreChart by matpel "Kimia", tapi tidak ada sesi dengan matpel Kimia.

**Expected behavior:**
- Chart empty state: "Tidak ada data untuk filter ini"
- Tombol "Reset Filter" ditampilkan
- StatsCards tidak terpengaruh (tetap menampilkan data keseluruhan)

---

## EC-HIST-11: Sesi dengan Batch Tidak Selesai

**Skenario:** Sesi COMPLETED tapi batch terakhir tidak ada submittedAt (race condition).

**Expected behavior:**
- Batch tanpa submittedAt: skip dari chart (hanya batch dengan submittedAt yang ditampilkan)
- Skor rata-rata: hanya dari batch dengan submittedAt
- Detail modal: batch tanpa submittedAt tampil sebagai "Belum di-submit"

---

## EC-HIST-12: Streak Lebih dari 30 Hari

**Skenario:** Siswa streak 45 hari.

**Expected behavior:**
- StreakDisplay: "🔥 45 hari streak"
- Milestone pop-up: tidak muncul (45 bukan milestone: 3/7/14/30)
- Last milestone triggered: 30 hari (sudah ditampilkan saat streak=30)
- Tidak ada milestone baru hingga 60/90/180 (tidak di-scope)

---

## EC-HIST-13: Pagination — Lebih dari 100 Sesi

**Skenario:** Siswa punya 150 sesi exam.

**Expected behavior:**
- Page 1: sesi 1-10 (terbaru)
- Page 2: sesi 11-20
- ...
- Page 15: sesi 141-150
- Pagination controls: "‹ First" "‹ Prev" "1 2 3 ... 15" "Next ›" "Last ›"
- Total count ditampilkan: "Menampilkan 1-10 dari 150 sesi"

---

## EC-HIST-14: Data StudyAttempt tanpa Question

**Skenario:** StudyAttempt.questionId merujuk ke Question yang sudah dihapus.

**Expected behavior:**
- StudyAttempt tetap dihitung di statistik kumulatif (total benar/salah)
- SubjectAccuracyChart: skip attempt ini (matpel tidak bisa di-join)
- Tidak ada error
- Total attempts tetap akurat (count dari StudyAttempt, bukan Question)

---

## EC-HIST-15: User Buka /history Saat Sesi Exam Aktif

**Skenario:** Siswa sedang mengerjakan exam (sesi ACTIVE), lalu buka /history di tab lain.

**Expected behavior:**
- Sesi ACTIVE muncul di list dengan badge "Sedang Berlangsung"
- Streak sudah ter-update jika ada batch yang sudah di-submit
- StatsCards: data dari batch yang sudah di-submit di sesi aktif
- Tidak ada konflik (read-only, tidak mengubah data)
