# Edge Cases — STUDY MODE Module

## EC-STUDY-01: Tidak Ada Soal di Filter

**Skenario:** Siswa memilih filter (misal: SD + OSNK + Fisika) tapi tidak ada soal yang match.

**Expected behavior:**
- API return `{ success: true, data: [] }` (empty array)
- Client menampilkan pesan "Belum ada soal untuk filter ini"
- Tombol "Ubah Filter" tersedia → kembali ke filter form
- Tidak menampilkan halaman soal kosong

---

## EC-STUDY-02: Koneksi Putus Saat Mengerjakan

**Skenario:** Siswa sedang mengerjakan soal, koneksi internet terputus.

**Expected behavior:**
- Soal yang sudah di-fetch tetap tersimpan di Zustand (client memory)
- Siswa tetap bisa melihat soal dan mengisi jawaban
- Saat klik "Submit Jawaban": fetch gagal → tampilkan error "Koneksi terputus. Coba lagi."
- Tombol "Coba Lagi" tersedia untuk retry submit
- Setelah koneksi kembali: retry submit → sukses → lanjut

**Implementation note:** Jangan simpan jawaban yang belum di-grade di Zustand sebagai "sudah dijawab". Hanya set isAnswered=true setelah server konfirmasi sukses.

---

## EC-STUDY-03: LaTeX Gagal Render

**Skenario:** Soal berisi LaTeX dengan syntax error, misal: `$\fra{1}{2}$` (typo: \fra bukan \frac).

**Expected behavior:**
- KatexRenderer mengatur `throwOnError: false`
- LaTeX yang gagal parse ditampilkan sebagai raw text (merah)
- Komponen tidak crash
- Soal masih bisa dijawab

**Implementation note:** KatexRenderer sudah handle ini dengan `throwOnError: false` dan fallback ke plain text.

---

## EC-STUDY-04: Gambar Soal Broken (404)

**Skenario:** Soal punya `imageUrl` tapi file gambar sudah dihapus/dipindahkan.

**Expected behavior:**
- `<img>` tag onError handler → tampilkan placeholder
- Placeholder: icon + teks "Gambar tidak tersedia"
- Soal tetap bisa dijawab (gambar adalah supplement, bukan wajib)
- Tidak ada error di console yang mengganggu user

**Implementation note:** `onError` handler di `<img>` mengganti src dengan placeholder atau menampilkan div fallback.

---

## EC-STUDY-05: Gambar Soal Besar (Slow Load)

**Skenario:** Soal punya gambar dengan size besar (>1MB), load lambat.

**Expected behavior:**
- Gambar lazy-loaded (hanya load saat soal ditampilkan)
- Loading spinner / placeholder saat gambar loading
- User bisa membaca teks soal sambil menunggu gambar
- Tombol "Submit Jawaban" tetap enabled (tidak menunggu gambar)

**Implementation note:** `loading="lazy"` attribute. Tidak block UI untuk gambar.

---

## EC-STUDY-06: Short Answer dengan Spasi Ekstra

**Skenario:** Siswa mengetik jawaban "  42  " (dengan spasi di awal dan akhir).

**Expected behavior:**
- Server menormalisasi: `trim()` → "42"
- Bandingkan dengan `acceptableAnswers[]` (juga di-trim)
- Jika "42" ada di acceptableAnswers → benar
- Case-insensitive: "PI" == "pi" == "Pi"

---

## EC-STUDY-07: Essay dengan Format Angka Berbeda

**Skenario:** acceptableAnswers berisi "3.14", siswa menjawab "3,14" (koma sebagai desimal).

**Expected behavior:**
- `parseFloat("3,14")` → `3` (JavaScript hanya menerima titik sebagai desimal)
- Jika acceptableAnswers hanya "3.14" → tidak match → salah
- Solusi: normalisasi input — ganti koma dengan titik sebelum parseFloat
- Implementasi: `userAnswer.replace(",", ".")` lalu `parseFloat()`

---

## EC-STUDY-08: Siswa Submit Jawaban Kosong

**Skenario:** Siswa klik "Submit Jawaban" tanpa mengisi jawaban.

**Expected behavior:**
- Client-side: tombol "Submit Jawaban" disabled jika jawaban kosong
- Jika lolos (misal via DevTools): server validasi → 400 `{ error: "Jawaban tidak boleh kosong" }`
- Tidak menyimpan StudyAttempt untuk jawaban kosong

---

## EC-STUDY-09: Siswa Mencoba Akses Soal Langsung via API

**Skenario:** Siswa mengetik URL `/api/questions?tingkat=SMA&level=FINAL&matpel=Fisika` langsung di browser.

**Expected behavior:**
- API route cek auth session
- Jika tidak login → 401 Unauthorized
- Jika login sebagai SISWA → return soal (OK, ini penggunaan normal via fetch)
- Jika login sebagai ADMIN → 403 Forbidden (admin tidak kerjakan soal)

---

## EC-STUDY-10: Refresh Halaman Saat Mengerjakan

**Skenario:** Siswa sedang di soal 5 dari 20, lalu refresh browser.

**Expected behavior:**
- Zustand store hilang (state reset)
- Siswa kembali ke halaman filter (belum mulai latihan)
- Jawaban yang sudah disubmit (soal 1-4) tetap tersimpan di DB (StudyAttempt)
- Tidak ada resume — siswa harus mulai latihan baru dari awal

**Implementation note:** Ini adalah trade-off dari "tidak ada sesi" design. Zustand state hilang saat refresh. Acceptable karena Study Mode adalah latihan bebas.

---

## EC-STUDY-11: Multiple Tabs Study Mode

**Skenario:** Siswa membuka Study Mode di 2 tab bersamaan.

**Expected behavior:**
- Kedua tab punya Zustand store masing-masing (independent)
- Kedua tab bisa fetch soal dan mengerjakan secara terpisah
- StudyAttempt dicatat untuk kedua sesi (tidak ada konflik)
- StreakLog: entry hari ini sudah ada dari tab pertama, tab kedua skip update

---

## EC-STUDY-12: Soal dengan acceptableAnswers Kosong

**Skenario:** Soal SHORT_ANSWER atau ESSAY dengan `acceptableAnswers = []` (data error).

**Expected behavior:**
- Grading: tidak ada match → jawaban selalu salah
- StudyAttempt tetap disimpan dengan isCorrect = false
- Feedback: tampilkan jawaban benar "(tidak ada jawaban yang terdaftar)" + pembahasan
- Admin seharusnya tidak menyimpan soal tanpa acceptableAnswers (validasi di import/create)

---

## EC-STUDY-13: Network Timeout Saat Fetch Soal

**Skenario:** Siswa klik "Mulai Latihan" tapi API response lambat (>10 detik).

**Expected behavior:**
- Loading indicator tetap visible
- Setelah 10 detik: tampilkan tombol "Coba Lagi"
- Tidak ada auto-retry (user yang trigger retry)
- Jika user klik "Coba Lagi": re-fetch soal

---

## EC-STUDY-14: Multiple Choice dengan Hanya 1 Option

**Skenario:** Soal MULTIPLE_CHOICE dengan `options = ["A. Jawaban"]` (hanya 1 pilihan).

**Expected behavior:**
- Tampilkan 1 radio button
- Siswa bisa pilih dan submit
- Grading tetap berfungsi (correctOption = 0)
- Ini adalah data error — admin seharusnya tidak membuat soal MC dengan 1 option
