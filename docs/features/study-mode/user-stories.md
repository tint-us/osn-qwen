# User Stories — STUDY MODE Module

## US-STUDY-01: Memfilter Soal

**As a** siswa,
**I want to** memfilter soal berdasarkan tingkat, level, dan mata pelajaran,
**So that** saya bisa berlatih soal yang sesuai dengan kebutuhan saya.

### Acceptance Criteria
- [ ] Halaman study mode menampilkan filter: tingkat, level, matpel
- [ ] Tingkat: dropdown/radio (SD / SMP / SMA) — wajib pilih salah satu
- [ ] Level: dropdown/radio (OSNK / OSNP / SEMIFINAL / FINAL) — wajib pilih salah satu
- [ ] Matpel: multi-select checkbox — wajib minimal 1
- [ ] Tombol "Mulai Latihan" disabled sampai semua filter terpilih
- [ ] Jika tidak ada soal yang match filter → pesan "Belum ada soal untuk filter ini"

---

## US-STUDY-02: Soal Ditampilkan Satu per Satu

**As a** siswa,
**I want to** melihat soal satu per satu,
**So that** saya bisa fokus pada satu soal tanpa distraksi.

### Acceptance Criteria
- [ ] Satu soal per layar (tidak ada list/scroll semua soal)
- [ ] Tampilkan nomor: "Soal 3 dari 25"
- [ ] Jika soal punya gambar → tampilkan gambar di bawah teks soal
- [ ] LaTeX di soal ter-render dengan KaTeX
- [ ] Layout responsif (mobile dan desktop)

---

## US-STUDY-03: Soal dan Pilihan Diacak

**As a** siswa,
**I want to** urutan soal dan pilihan jawaban diacak,
**So that** saya tidak menghafal urutan, tapi benar-benar memahami materi.

### Acceptance Criteria
- [ ] Urutan soal diacak setiap kali memulai latihan baru
- [ ] Untuk MULTIPLE_CHOICE: urutan pilihan jawaban juga diacak
- [ ] Pengacakan terjadi di server (bukan client) untuk konsistensi
- [ ] Pengacakan tidak mengubah correctOption mapping

---

## US-STUDY-04: Menjawab Multiple Choice

**As a** siswa,
**I want to** memilih jawaban dari pilihan ganda,
**So that** saya bisa menjawab soal pilihan ganda.

### Acceptance Criteria
- [ ] Pilihan jawaban ditampilkan sebagai radio button
- [ ] Hanya bisa pilih satu jawaban
- [ ] Tombol "Submit Jawaban" disabled sampai ada pilihan
- [ ] Setelah submit: tombol radio disabled (tidak bisa ubah)

---

## US-STUDY-05: Menjawab Short Answer

**As a** siswa,
**I want to** mengetik jawaban singkat,
**So that** saya bisa menjawab soal isian.

### Acceptance Criteria
- [ ] Text input field untuk jawaban
- [ ] Tombol "Submit Jawaban" disabled jika field kosong
- [ ] Grading: case-insensitive, trim whitespace
- [ ] Cocok dengan salah satu di `acceptableAnswers[]`
- [ ] Setelah submit: input disabled

---

## US-STUDY-06: Menjawab Essay (Angka)

**As a** siswa,
**I want to** memasukkan jawaban berupa angka,
**So that** saya bisa menjawab soal essay dengan jawaban numerik.

### Acceptance Criteria
- [ ] Number input field (hanya menerima angka)
- [ ] Tombol "Submit Jawaban" disabled jika field kosong
- [ ] Grading: extract angka dari input, bandingkan dengan `acceptableAnswers[]`
- [ ] Setelah submit: input disabled

---

## US-STUDY-07: Feedback Instan

**As a** siswa,
**I want to** melihat apakah jawaban saya benar atau salah beserta pembahasan,
**So that** saya bisa belajar dari kesalahan.

### Acceptance Criteria
- [ ] Setelah submit: tampilkan status BENAR (hijau) atau SALAH (merah)
- [ ] Tampilkan jawaban yang benar (jika jawaban siswa salah)
- [ ] Tampilkan pembahasan (explanation)
- [ ] Pembahasan juga mendukung LaTeX rendering
- [ ] Feedback muncul dengan animasi smooth (fade/slide)
- [ ] Tombol "Soal Berikutnya" muncul setelah feedback

---

## US-STUDY-08: Soal Berikutnya

**As a** siswa,
**I want to** lanjut ke soal berikutnya setelah melihat feedback,
**So that** saya bisa terus berlatih.

### Acceptance Criteria
- [ ] Tombol "Soal Berikutnya" tersedia setelah feedback
- [ ] Klik → reset state (clear jawaban, tampilkan soal baru)
- [ ] Jika soal terakhir: tombol berubah jadi "Selesai"
- [ ] Klik "Selesai" → tampilkan ringkasan: total soal, benar, salah

---

## US-STUDY-09: Keluar Kapan Saja

**As a** siswa,
**I want to** berhenti berlatih kapan saja,
**So that** saya bisa keluar tanpa harus menyelesaikan semua soal.

### Acceptance Criteria
- [ ] Tombol "Keluar" / back button tersedia
- [ ] Langsung kembali ke dashboard (tidak ada konfirmasi "yakin keluar?")
- [ ] Soal yang belum dijawab tidak dicatat di StudyAttempt
- [ ] Soal yang sudah dijawab tetap tersimpan di StudyAttempt

---

## US-STUDY-10: Gambar Soal

**As a** siswa,
**I want to** melihat gambar pada soal yang bergambar,
**So that** saya bisa menjawab soal yang membutuhkan visual.

### Acceptance Criteria
- [ ] Jika `imageUrl` ada: tampilkan gambar di bawah konten teks soal
- [ ] Gambar lazy-loaded
- [ ] Jika gambar gagal load: tampilkan placeholder "Gambar tidak tersedia"
- [ ] Gambar responsive (max-width: 100%)

---

## US-STUDY-11: Latihan dengan LaTeX

**As a** siswa,
**I want to** melihat rumus matematika ter-render dengan baik,
**So that** saya bisa membaca soal matematika dengan jelas.

### Acceptance Criteria
- [ ] `$...$` ter-render sebagai inline math
- [ ] `$$...$$` ter-render sebagai display math (centered, larger)
- [ ] Jika LaTeX gagal parse: tampilkan raw text, tidak crash
- [ ] KaTeX CSS loaded (fonts, styling)

---

## US-STUDY-12: Tidak Ada Soal di Filter

**As a** siswa,
**I want to** tahu jika tidak ada soal untuk filter yang saya pilih,
**So that** saya bisa mencoba filter lain.

### Acceptance Criteria
- [ ] Jika hasil fetch soal kosong: tampilkan pesan "Belum ada soal untuk filter ini"
- [ ] Tampilkan tombol "Ubah Filter" untuk kembali ke filter form
- [ ] Tidak menampilkan halaman kosong atau error
