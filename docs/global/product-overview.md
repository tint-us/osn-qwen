# Product Overview — SoaLatihan

## 1. Deskripsi Singkat

SoaLatihan adalah platform latihan soal mandiri dan simulasi ujian interaktif berbasis web untuk soal OSN Indonesia (SD/SMP/SMA). Platform ini menyediakan dua mode belajar: Study Mode untuk latihan bebas dengan feedback instan, dan Exam Mode untuk simulasi ujian dengan sistem sesi, batch, timer, dan auto-grade. Soalatihan juga mendukung import soal massal (CSV/JSON/XML), analitik perjalanan belajar, serta admin dashboard untuk manajemen konten dan pengguna.

## 2. Target Pengguna

### Admin
- Mengelola bank soal: tambah, edit, hapus, import massal (CSV/JSON/XML)
- Mengelola pengguna: lihat daftar, ubah role, nonaktifkan akun
- Konfigurasi AI: simpan API Key, Base URL, System Prompt
- Memantau kesehatan sistem: diagnostik DB, statistik penggunaan
- Mengatur konfigurasi exam: ukuran batch default, durasi timer

### Siswa
- Berlatih soal OSN secara mandiri dengan feedback instan (Study Mode)
- Menjalankan simulasi ujian dengan kondisi mirip ujian sesungguhnya (Exam Mode)
- Melihat riwayat dan analitik belajar: skor per batch, streak harian, tren peningkatan
- Melanjutkan sesi exam yang terputus (resume)
- Memfilter soal berdasarkan tingkat (SD/SMP/SMA), level (OSNK/OSNP/SEMIFINAL/FINAL), dan mata pelajaran

## 3. Daftar Modul

| Kode | Nama Modul | Deskripsi |
|---|---|---|
| AUTH | Autentikasi & Otorisasi | Login, logout, RBAC (Admin / Siswa), sesi management |
| STUDY | Study Mode | Latihan bebas, filter bank soal, feedback instan, soal acak |
| EXAM | Exam Mode | Sesi + batch, resume, countdown timer, auto-grade, analitik per batch |
| CONTENT | Content Processing | Import soal CSV/JSON/XML, template download, preview sebelum simpan, validasi |
| HISTORY | History & Analitik | Riwayat sesi, grafik skor, streak harian, milestone pop-up, filter analitik |
| ADMIN | Admin Dashboard | CRUD soal, manajemen user, konfigurasi AI, diagnostik DB, konfigurasi sistem |

## 4. Alur Utama Siswa

```
Login
  → Pilih mode: Study atau Exam
    → Pilih filter: tingkat (SD/SMP/SMA) + level (OSNK/OSNP/SEMIFINAL/FINAL) + matpel (multi-select)
      → [Study Mode] Kerjakan soal satu per satu, feedback instan setelah jawab
        → Bebas berhenti kapan saja
      → [Exam Mode] Setup sesi → Soal dibagi ke batch (10-30 soal/batch)
        → Kerjakan batch → Submit batch → Lihat pembahasan + skor
        → Lanjut batch berikutnya atau selesai
  → Lihat hasil analitik: skor per batch, streak harian, perbandingan benar vs salah
```

### Detail Alur Study Mode
1. Siswa login → redirect ke dashboard siswa
2. Pilih "Study Mode" → pilih filter (tingkat + level + matpel)
3. Sistem mengambil soal sesuai filter, mengacak urutan soal dan pilihan jawaban (MC)
4. Soal ditampilkan satu per satu, tanpa batas waktu
5. Setelah menjawab → muncul feedback: jawaban benar/salah + pembahasan
6. Siswa bebas lanjut ke soal berikutnya atau berhenti kapan saja
7. Setiap jawaban dicatat di StudyAttempt untuk analitik

### Detail Alur Exam Mode
1. Siswa login → pilih "Exam Mode" → pilih filter (tingkat + level + matpel)
2. Sistem membuat ExamSession: seluruh soal dari filter dibagi ke batch (default 10 soal/batch)
3. Urutan soal dan pilihan jawaban diacak untuk sesi ini
4. Siswa kerjakan batch per batch:
   - Timer countdown (opsional, configurable)
   - Setelah submit batch: auto-grade, muncul pembahasan + skor
   - Analitik per batch ditampilkan
5. Jika disconnect: saat login ulang ditawarkan resume atau mulai sesi baru
6. Setelah seluruh batch selesai: ringkasan akhir + analitik komulatif

## 5. Alur Utama Admin

```
Login (role: ADMIN)
  → Admin Dashboard
    → Kelola Soal: CRUD soal, import massal (CSV/JSON/XML), download template
    → Kelola User: lihat daftar, ubah role, nonaktifkan akun
    → Konfigurasi AI: simpan API Key, Base URL, System Prompt
    → Diagnostik DB: health check, total soal, total user, total sesi
    → Konfigurasi Sistem: ukuran batch default, durasi timer default
```

### Detail Alur Import Soal
1. Admin login → masuk ke halaman kelola soal
2. Pilih "Import Soal" → download template (CSV/JSON/XML)
3. Siapkan file soal (bisa gunakan static prompt AI untuk convert PDF ke format import)
4. Upload file → sistem parse dan validasi (field mandatory, format jawaban, tipe soal)
5. Preview data sebelum konfirmasi simpan
6. Konfirmasi → soal tersimpan di database

## 6. Constraint Teknis

| Aspek | Constraint |
|---|---|
| Platform | Web only (no mobile app) |
| Framework | Next.js 15 (App Router) — monorepo (frontend + backend + DB schema dalam satu project) |
| Backend | API Routes (`/app/api/...`) — tidak ada backend terpisah |
| Database | PostgreSQL via Prisma ORM |
| Deployment | Docker Compose (service `app` + `db`), satu command: `docker compose up -d` |
| Runtime | Node.js 20+ |
| Styling | Tailwind CSS + shadcn/ui |
| State Management | Zustand (hanya untuk UI session state) |
| Auth | NextAuth.js (Auth.js v5) |
| Math Rendering | KaTeX (client-side, format `$...$` dan `$$...$$`) |
| VPS | Ubuntu 22.04 / Debian 12, port 3000 only, support Cloudflare Tunnel |
| Environment | Semua config di `.env` — tidak ada hardcode |
