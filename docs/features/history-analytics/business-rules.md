# Business Rules — HISTORY & ANALITIK Module

## BR-HIST-01: Data Source

| Aturan | Keterangan |
|---|---|
| ExamSession | Source untuk riwayat sesi + skor rata-rata |
| ExamBatch | Source untuk detail skor per batch |
| StudyAttempt | Source untuk statistik study + akurasi per matpel |
| StreakLog | Source untuk history streak (log harian) |
| User.streak | Source untuk streak counter saat ini |
| Data scope | Hanya data user yang login (userId filter) |

## BR-HIST-02: Session History List

| Aturan | Keterangan |
|---|---|
| Data ditampilkan | tanggal (createdAt), filter, totalQuestions, skor rata-rata, status |
| Skor rata-rata | Rata-rata dari semua ExamBatch.score dalam sesi |
| Sorting | Default: createdAt descending (terbaru di atas) |
| Pagination | 10 sesi per page |
| Status filter | Default: semua status. Bisa filter: COMPLETED, ACTIVE, ABANDONED |
| Empty state | "Belum ada riwayat sesi" jika tidak ada data |

## BR-HIST-03: Session Detail

| Aturan | Keterangan |
|---|---|
| Akses | Hanya pemilik sesi (userId match) |
| Data per batch | batchIndex, questionIds.length, score, totalCorrect, totalWrong, submittedAt |
| Expand batch | Bisa lihat per-question review (dari ExamBatch.answers JSON) |
| Progress bar | Visual: warna hijau (score > 70), kuning (50-70), merah (< 50) |

## BR-HIST-04: Score Journey Chart

| Aturan | Keterangan |
|---|---|
| Chart type | Line chart (recharts LineChart) |
| X-axis | Batch index urut kronologis (submittedAt ascending) |
| Y-axis | Skor (0-100) |
| Data points | Semua ExamBatch yang sudah di-submit (submittedAt !== null) |
| Filter | Per matpel (multi-select), level, tingkat |
| Filter source | ExamSession.filter field |
| Tooltip | Tanggal sesi, batch ke-, filter info, skor |
| Minimum data | 1 titik = chart tampil. 0 titik = empty state. |

## BR-HIST-05: Cumulative Statistics

| Aturan | Keterangan |
|---|---|
| Total soal | totalCorrectExam + totalWrongExam + totalStudyAttempts |
| Total benar | totalCorrectExam (sum ExamBatch.totalCorrect) + totalCorrectStudy (count StudyAttempt.isCorrect=true) |
| Total salah | totalWrongExam (sum ExamBatch.totalWrong) + totalWrongStudy (count StudyAttempt.isCorrect=false) |
| Akurasi | (totalCorrect / (totalCorrect + totalWrong)) * 100, dibulatkan 1 desimal |
| Zero division | Jika total = 0: akurasi = 0% |
| Update timing | Real-time saat halaman dibuka (fetch dari DB) |

## BR-HIST-06: Streak Rules

| Aturan | Keterangan |
|---|---|
| Streak definition | Hari berturut-turut user aktif (study attempt atau exam batch submit) |
| Streak update | Saat StudyAttempt atau ExamBatch submit (di modul Study/Exam) |
| Streak logika | lastActiveDate === today: skip. === yesterday: streak++. else: streak=1. |
| StreakLog | 1 record per hari per user (unique constraint userId+date) |
| Display | "🔥 X hari streak" |
| Streak = 0 | "Mulai belajar hari ini untuk memulai streak! 🔥" |

## BR-HIST-07: Milestone Pop-up

| Aturan | Keterangan |
|---|---|
| Milestone values | 3, 7, 14, 30 hari |
| Trigger | Saat user buka /history dan User.streak === salah satu milestone |
| Once per milestone | localStorage flag: `milestone_{streak}_shown` === 'true' |
| Auto-dismiss | 10 detik setelah muncul |
| Animasi | Scale (0→1, 300ms) + confetti CSS keyframes |
| Z-index | Di atas semua konten (z-50) |
| Backdrop | Semi-transparent hitam (tidak full block, bisa lihat konten) |

### Milestone Messages

| Streak | Emoji | Pesan |
|---|---|---|
| 3 | 🔥 | "Hebat! 3 hari berturut-turut belajar. Teruskan semangatnya! 🔥" |
| 7 | ⭐ | "Luar biasa! 1 minggu penuh konsisten! Kamu sedang membentuk kebiasaan! ⭐" |
| 14 | 💪 | "2 minggu! Kamu sungguh pantang menyerah. OSN menanti! 💪" |
| 30 | 🏆 | "SEKUAT TENAGA! 30 hari streak! Kamu adalah juara sejati! 🏆" |

## BR-HIST-08: Subject Accuracy Chart

| Aturan | Keterangan |
|---|---|
| Chart type | Horizontal bar chart (recharts BarChart layout="vertical") |
| Data source | StudyAttempt + Question (join for matpel) |
| Per matpel | (count isCorrect=true / count total) * 100 |
| Sorting | Accuracy descending (terbaik di atas) |
| Minimum data | 1 matpel = chart tampil. 0 matpel = empty state. |
| Tooltip | Matpel, total attempts, total correct, accuracy % |
| Color | Gradient: green (>=70%), yellow (50-70%), red (<50%) |

## BR-HIST-09: Access Control

| Aturan | Keterangan |
|---|---|
| All endpoints | SISWA only (admin redirect ke /admin) |
| Data filter | Hanya data user yang login (userId dari session) |
| No cross-user | Tidak bisa lihat data user lain |
