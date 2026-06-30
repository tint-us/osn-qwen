# Business Rules — EXAM MODE Module

## BR-EXAM-01: Filter

| Aturan | Keterangan |
|---|---|
| Filter wajib | Sama dengan Study Mode: tingkat + level + matpel (multi-select) |
| Minimal matpel | 1 |
| Filter disimpan | Disimpan di ExamSession.filter (JSON) untuk referensi |

## BR-EXAM-02: Batch Configuration

| Aturan | Nilai |
|---|---|
| Batch size range | 10-30 soal per batch |
| Default batch size | 10 |
| Batch size configurable oleh | Siswa saat setup exam |
| Batch terakhir | Boleh < batchSize jika total soal tidak habis dibagi |
| Minimal soal untuk exam | 10 (minimal 1 batch penuh) |

## BR-EXAM-03: Timer Configuration

| Aturan | Nilai |
|---|---|
| Timer | Opsional (toggle on/off saat setup) |
| Timer scope | Per batch, bukan per sesi |
| Default duration | 30 menit per batch |
| Duration range | 1-180 menit |
| Timer mulai | Saat batch pertama kali dibuka (GET batch endpoint sets startedAt) |
| Timer berhenti | Saat batch di-submit (manual atau auto) |
| Auto-submit | Saat timer mencapai 00:00 |
| Timer di-pause | Tidak ada. Timer berjalan terus saat batch aktif. |
| Warning visual | Kuning < 5 menit, Merah < 1 menit |

## BR-EXAM-04: Session Rules

| Aturan | Keterangan |
|---|---|
| 1 sesi = seluruh soal dari filter | Dibagi ke batch-batch |
| Tidak ada pengulangan soal | Dalam 1 sesi, soal unik antar batch |
| Soal berulang | Hanya jika memulai sesi baru |
| Urutan soal diacak | Fisher-Yates, server-side, saat sesi dibuat |
| MC options diacak | Saat sesi dibuat, correctOption di-remap |
| Status sesi | ACTIVE → COMPLETED (semua batch selesai) atau ABANDONED (user mulai sesi baru) |
| Hanya 1 sesi ACTIVE | Per user. Jika ada sesi ACTIVE, harus resume atau abandon sebelum buat baru. |

## BR-EXAM-05: No Feedback During Exam

| Aturan | Keterangan |
|---|---|
| Selama mengerjakan | TIDAK ada feedback: tidak ada benar/salah, tidak ada pembahasan |
| Feedback muncul | Hanya setelah submit batch (di review page) |
| Jawaban benar | Tidak ditampilkan selama ujian |
| Tujuan | Mensimulasikan kondisi ujian sesungguhnya |

## BR-EXAM-06: Submit Rules

| Aturan | Keterangan |
|---|---|
| Submit per batch | Bukan per soal, bukan per sesi |
| Submit manual | User klik "Submit Batch" → konfirmasi modal → submit |
| Auto-submit | Timer habis → submit otomatis tanpa modal |
| Jawaban kosong | Boleh. Jawaban kosong = salah. |
| Setelah submit | Tidak bisa ubah jawaban. ExamBatch.submittedAt di-set. |
| Double submit | Dicegah: jika submittedAt !== null → 400 "Batch sudah di-submit" |
| Grading | Server-side, sama dengan Study Mode (per questionType) |

## BR-EXAM-07: Sync Rules

| Aturan | Nilai |
|---|---|
| Sync interval | 30 detik |
| Sync data | currentBatchIndex, answers (JSON), currentQuestionIndex |
| Sync target | ExamBatch.answers (JSON field) |
| Sync behavior | Background, tidak mengganggu UI |
| Sync failure | Retry di interval berikutnya, tidak blocking |
| Sync saat submit | Final sync sebelum submit (kirim semua jawaban terbaru) |
| Sync saat resume | Load ExamBatch.answers dari DB ke Zustand |

## BR-EXAM-08: Resume Rules

| Aturan | Keterangan |
|---|---|
| Cek sesi aktif | Saat siswa buka /exam, GET /api/exam/sessions/active |
| Resume ditawarkan | Jika ada ExamSession dengan status=ACTIVE |
| Resume batch | Lanjut dari currentBatchIndex (batch yang belum di-submit) |
| Resume answers | Load dari ExamBatch.answers (sync terakhir) |
| Timer saat resume | Reset: timer = timerDuration penuh (karena batch belum di-submit) |
| Abandon | Set status=ABANDONED, bisa buat sesi baru |

## BR-EXAM-09: Grading

| Aturan | Keterangan |
|---|---|
| Sama dengan Study Mode | Per questionType: MC (index match), SA (trim+case-insensitive), ESSAY (parseFloat) |
| Jawaban kosong | isCorrect = false |
| Score calculation | (totalCorrect / totalQuestionsInBatch) * 100, dibulatkan 2 desimal |

## BR-EXAM-10: Streak Update

| Aturan | Keterangan |
|---|---|
| Trigger | Setiap kali submit batch (bukan saat mengerjakan) |
| Logic | Sama dengan Study Mode: cek StreakLog untuk hari ini |

## BR-EXAM-11: Navigation Rules

| Aturan | Keterangan |
|---|---|
| Dalam batch | Bisa navigasi: Berikutnya, Sebelumnya, jump to nomor |
| Antar batch | TIDAK bisa. Hanya batch saat ini. |
| Soal sudah dijawab | Indikator visual (warna berbeda) |
| Soal belum dijawab | Bisa navigasi tanpa jawaban |
| Setelah submit | Tidak bisa kembali ke soal untuk ubah jawaban |
