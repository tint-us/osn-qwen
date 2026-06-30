# Business Rules — STUDY MODE Module

## BR-STUDY-01: Filter Wajib

| Aturan | Keterangan |
|---|---|
| Tingkat | Wajib pilih salah satu: SD / SMP / SMA |
| Level | Wajib pilih salah satu: OSNK / OSNP / SEMIFINAL / FINAL |
| Matpel | Wajib pilih minimal 1 mata pelajaran (multi-select) |
| Tombol "Mulai" | Disabled sampai semua filter terpilih |
| Kombinasi filter | Tingkat + Level + Matpel → query ke DB dengan semua filter |

## BR-STUDY-02: Pengacakan Soal

| Aturan | Keterangan |
|---|---|
| Kapan diacak | Setiap kali siswa memulai latihan baru (klik "Mulai Latihan") |
| Algoritma | Fisher-Yates shuffle |
| Level pengacakan | Urutan soal + urutan pilihan jawaban (MULTIPLE_CHOICE) |
| Tempat pengacakan | Server-side (di service layer), bukan client |
| Persistensi | Urutan acak hanya untuk sesi saat ini, tidak disimpan di DB |

## BR-STUDY-03: Tidak Ada Sesi atau Batch

| Aturan | Keterangan |
|---|---|
| Konsep sesi | Tidak ada. Study Mode adalah latihan bebas. |
| Konsep batch | Tidak ada. Soal ditampilkan satu per satu. |
| Resume | Tidak ada. Setiap mulai latihan = sesi baru dengan urutan baru. |
| Berhenti | Bisa berhenti kapan saja, tanpa konfirmasi. |
| Soal tersisa | Soal yang belum dijawab tidak dicatat. Hanya yang sudah dijawab. |

## BR-STUDY-04: Feedback Instan

| Aturan | Keterangan |
|---|---|
| Kapan | Langsung setelah submit jawaban (feedback instan) |
| Konten | Status (benar/salah) + jawaban benar (jika salah) + pembahasan |
| Ubah jawaban | Tidak bisa. Setelah submit, input disabled. |
| Pembahasan | Selalu ditampilkan, baik benar maupun salah |

## BR-STUDY-05: Grading per Tipe Soal

### MULTIPLE_CHOICE
| Aturan | Keterangan |
|---|---|
| Input | Radio button, pilih satu |
| userAnswer | Index pilihan yang dipilih (string, dikonversi ke Int) |
| Grading | `parseInt(userAnswer) === question.correctOption` |
| Pilihan diacak | Ya, urutan pilihan diacak sebelum ditampilkan |

### SHORT_ANSWER
| Aturan | Keterangan |
|---|---|
| Input | Text input |
| Normalisasi | `userAnswer.trim().toLowerCase()` |
| Matching | Bandingkan dengan setiap item di `acceptableAnswers[]` (juga `trim().toLowerCase()`) |
| Match | Jika ada salah satu yang cocok → benar |
| No match | Jika tidak ada yang cocok → salah |

### ESSAY
| Aturan | Keterangan |
|---|---|
| Input | Number input (hanya angka) |
| Grading | Berdasarkan angka jawaban final saja (no cara pengerjaan) |
| Normalisasi | `parseFloat(userAnswer)` |
| Matching | Bandingkan dengan setiap item di `acceptableAnswers[]` (juga `parseFloat`) |
| Toleransi | Exact match numerik (tidak ada toleransi selisih) |
| Format angka | Mendukung desimal (titik) dan negatif |

## BR-STUDY-06: Pencatatan StudyAttempt

| Aturan | Keterangan |
|---|---|
| Kapan dicatat | Setiap kali siswa submit jawaban (bukan saat membuka soal) |
| Field | userId, questionId, userAnswer, isCorrect, answeredAt |
| userAnswer | Disimpan sebagai string (raw input user) |
| Duplikasi | Boleh. User bisa menjawab soal yang sama berkali-kali di sesi berbeda. |
| Delete | Tidak ada. StudyAttempt tidak pernah dihapus. |

## BR-STUDY-07: Update Streak

| Aturan | Keterangan |
|---|---|
| Trigger | Setiap kali submit jawaban (StudyAttempt dibuat) |
| Cek hari ini | Cek StreakLog apakah sudah ada entry untuk tanggal hari ini |
| Jika belum ada | Create StreakLog, lalu update User: |
| | - Jika lastActiveDate == kemarin → streak++ |
| | - Jika lastActiveDate != kemarin (atau null) → streak = 1 |
| | - Update lastActiveDate = hari ini |
| Jika sudah ada | Skip (streak sudah dihitung untuk hari ini) |

## BR-STUDY-08: Navigasi

| Aturan | Keterangan |
|---|---|
| Soal berikutnya | Tombol "Soal Berikutnya" → increment index, tampilkan soal baru |
| Kembali | TIDAK ADA tombol kembali. Soal yang sudah dijawab tidak bisa diubah. |
| Soal terakhir | Tombol berubah jadi "Selesai" → tampilkan ringkasan |
| Keluar | Tombol "Keluar" → langsung ke dashboard, tanpa konfirmasi |
| Ringkasan | Total soal, benar, salah (hanya count, bukan detail per soal) |

## BR-STUDY-09: Limit dan Performance

| Aturan | Nilai |
|---|---|
| Maksimal soal per sesi | Tidak ada limit (semua soal yang match filter) |
| Minimal soal | 1 (jika ada minimal 1 soal yang match) |
| Fetch strategy | Semua soal di-fetch sekaligus di awal, disimpan di Zustand |
| Pagination | Tidak ada (client-side navigation antar soal) |
