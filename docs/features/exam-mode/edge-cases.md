# Edge Cases — EXAM MODE Module

## EC-EXAM-01: Timer Habis Saat Offline

**Skenario:** Siswa sedang mengerjakan batch, lalu kehilangan koneksi. Timer di client berhenti. Server tidak tahu apakah timer sudah habis.

**Expected behavior:**
- Saat siswa reconnect dan buka exam:
  - Server cek `ExamBatch.startedAt + timerDuration`
  - Jika waktu sekarang > startedAt + timerDuration: batch sudah expired
  - Server auto-submit batch dengan jawaban dari sync terakhir
  - Siswa di-redirect ke review page dengan badge "Waktu habis (offline)"
- Jika belum expired: timer dilanjutkan dengan sisa waktu

**Implementation note:** Server-side timer check saat GET batch endpoint. Jika `now() > startedAt + timerDuration` dan `submittedAt === null` → auto-submit.

---

## EC-EXAM-02: Double Submit

**Skenario:** Siswa klik "Submit Batch" dua kali dengan cepat sebelum request pertama selesai.

**Expected behavior:**
- Tombol "Submit" disabled setelah klik pertama (`isSubmitting = true`)
- Server-side: cek `submittedAt !== null` → return 400 "Batch sudah di-submit"
- Hanya request pertama yang diproses
- Request kedua diabaikan (client-side) atau ditolak (server-side)

---

## EC-EXAM-03: Resume dengan Soal Berubah

**Skenario:** Siswa memulai sesi, lalu admin mengubah/menghapus soal yang ada di sesi tersebut. Siswa resume.

**Expected behavior:**
- ExamSession.questionOrder menyimpan array Question.id
- Saat resume: fetch questions by ID dari questionOrder
- Jika soal dihapus: skip soal tersebut, kurangi totalQuestions
- Jika soal diubah: gunakan versi terbaru (data terbaru dari DB)
- Jika batch size berubah karena soal dihapus: sesuaikan jumlah batch
- Tampilkan notice "Beberapa soal telah diperbarui sejak sesi dimulai"

**Implementation note:** Soal di-fetch by ID saat GET batch, bukan by filter. Jadi perubahan filter tidak mempengaruhi sesi yang sudah dibuat.

---

## EC-EXAM-04: Batch Terakhir < Batch Size

**Skenario:** Total 25 soal, batch size 10. Batch 1: 10, Batch 2: 10, Batch 3: 5.

**Expected behavior:**
- Batch terakhir berisi 5 soal
- Timer duration tetap sama (tidak dikurangi proporsional)
- Score dihitung dari 5 soal: (correct / 5) * 100
- Tidak ada error atau warning
- UI menampilkan "Soal 3 dari 5 (Batch 3 dari 3)"

---

## EC-EXAM-05: Tidak Ada Soal di Filter

**Skenario:** Siswa pilih filter yang tidak memiliki soal.

**Expected behavior:**
- POST /api/exam/sessions → 400 "Tidak ada soal untuk filter ini"
- Tidak membuat ExamSession
- Tampilkan pesan di UI + tombol "Ubah Filter"

---

## EC-EXAM-06: Soal Kurang dari Batch Size

**Skenario:** Hanya ada 7 soal di filter, batch size 10.

**Expected behavior:**
- 1 batch dengan 7 soal
- Exam tetap bisa dimulai (minimal 1 batch)
- Timer tetap berlaku untuk 7 soal

---

## EC-EXAM-07: Soal Kurang dari 10 (Minimum)

**Skenario:** Hanya ada 5 soal di filter.

**Expected behavior:**
- Tidak bisa mulai exam (minimum 10 soal)
- POST /api/exam/sessions → 400 "Minimal 10 soal untuk memulai exam"
- Tampilkan pesan "Hanya ada 5 soal untuk filter ini. Minimal 10 soal diperlukan."

---

## EC-EXAM-08: Sync Gagal

**Skenario:** Koneksi terputus saat sync berjalan.

**Expected behavior:**
- PATCH /api/exam/sessions/[id]/sync → gagal (network error)
- Tampilkan toast subtle "Gagal sync, akan mencoba lagi"
- Retry di interval berikutnya (30 detik)
- Jawaban tetap tersimpan di Zustand (tidak hilang)
- Saat submit: final sync attempt, lalu submit

---

## EC-EXAM-09: Sesi Expired Saat Resume

**Skenario:** Siswa disconnect. Beberapa hari kemudian resume. Timer batch terakhir sudah expired.

**Expected behavior:**
- Server cek: `startedAt + timerDuration < now()`
- Jika expired: auto-submit batch dengan answers dari sync terakhir
- Redirect ke review page
- Siswa bisa lanjut ke batch berikutnya

---

## EC-EXAM-10: Multiple Tabs Exam

**Skenario:** Siswa buka exam di 2 tab.

**Expected behavior:**
- Kedua tab load sesi yang sama dari DB
- Zustand store masing-masing independent
- Sync dari kedua tab menulis ke ExamBatch.answers yang sama
- Last sync wins (jawaban terakhir yang ditimpa)
- Tidak ada locking mechanism (acceptable trade-off)
- Submit dari salah satu tab: batch di-submit, tab lain mendapat 400 saat submit

---

## EC-EXAM-11: User Submit Batch dengan Jawaban Kosong

**Skenario:** Siswa tidak menjawab beberapa soal, lalu submit batch.

**Expected behavior:**
- Modal konfirmasi: "Anda belum menjawab X soal. Yakin submit?"
- Setelah konfirmasi: submit dengan jawaban kosong
- Jawaban kosong: isCorrect = false
- Score tetap dihitung dari total soal di batch

---

## EC-EXAM-12: Admin Mengubah Batch Size Default

**Skenario:** Admin mengubah default batch size di AppConfig saat siswa sedang ujian.

**Expected behavior:**
- Sesi yang sudah berjalan tidak terpengaruh (batchSize disimpan di ExamSession)
- Default baru berlaku untuk sesi baru berikutnya

---

## EC-EXAM-13: Timer dengan Durasi 0 atau Negatif

**Skenario:** Siswa memasukkan timer duration = 0 atau negatif.

**Expected behavior:**
- Client-side validation: min 1 menit
- Server-side validation: timerDuration >= 1
- Jika lolos: 400 "Timer duration minimal 1 menit"

---

## EC-EXAM-14: Browser Refresh Saat Mengerjakan

**Skenario:** Siswa refresh browser saat di soal 5 batch 2.

**Expected behavior:**
- Zustand state hilang
- Page re-mount: GET batch endpoint
- Server return questions + answers dari sync terakhir (ExamBatch.answers)
- Zustand di-repopulate dari DB
- Timer: dihitung ulang dari startedAt (sisa waktu)
- Siswa melanjutkan dari soal terakhir yang disync (currentQuestionIndex)
- Jawaban yang belum di-sync mungkin hilang (max 30 detik progress)

---

## EC-EXAM-15: Semua Batch Selesai — Sesi Complete

**Skenario:** Siswa submit batch terakhir.

**Expected behavior:**
- ExamSession.status = COMPLETED
- currentBatchIndex tidak increment lagi
- Redirect ke summary page (bukan review + "Batch Berikutnya")
- Summary: skor rata-rata, total benar/salah, line chart semua batch
- Tidak bisa resume sesi yang COMPLETED
