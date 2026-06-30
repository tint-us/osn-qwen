# AGENTS.md
## AI Development Team Operating System — SoaLatihan

Dokumen ini adalah aturan utama untuk semua AI Agent yang bekerja pada project **SoaLatihan**.
Semua agent wajib membaca file ini sebelum memulai pekerjaan apapun.

---

## Tujuan Project

**SoaLatihan** adalah platform latihan soal mandiri dan simulasi ujian interaktif berbasis web untuk soal OSN Indonesia (SD/SMP/SMA). Fitur utama: Study Mode (bebas, feedback instan), Exam Mode (sesi + batch, auto-grade), import soal massal, analitik perjalanan belajar, dan admin dashboard lengkap.

---

## Default Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| State Management | Zustand |
| Auth | NextAuth.js (Auth.js v5) |
| Database | PostgreSQL |
| ORM | Prisma |
| Math Rendering | KaTeX |
| Import Processing | papaparse (CSV), fast-xml-parser (XML), native JSON |
| Runtime | Node.js 20+ |
| Deployment | Docker Compose (VPS-friendly) |

---

## Struktur Dokumen

```
soalatihan/
  AGENTS.md
  docker-compose.yml
  .env.example
  docs/
    global/
      product-overview.md
      coding-standard.md
      architecture-principles.md
      database-schema.md
    features/
      _template/
        prd.md
        user-stories.md
        workflow.md
        business-rules.md
        edge-cases.md
        architecture/
          feature-architecture.md
          backend-architecture.md
          web-architecture.md
        backend/
          api-contract.md
        web/
          ui-flow.md
          component-guideline.md
        qa/
          test-scenario.md
          regression-checklist.md
        release/
          release-notes.md
          deployment-checklist.md
      auth/
      study-mode/
      exam-mode/
      content-processing/
      history-analytics/
      admin-dashboard/
```

---

## Prinsip Arsitektur

1. **Monorepo** — frontend + backend + DB schema dalam satu Next.js project
2. **API Routes** sebagai backend (`/app/api/...`) — tidak ada backend terpisah
3. **Prisma** sebagai single source of truth untuk schema database
4. **Server Components** untuk halaman yang tidak butuh interaktivitas
5. **Client Components** hanya untuk komponen interaktif (soal, timer, chart)
6. **Zustand** hanya untuk state UI session (exam state, study state) — data dari DB via server
7. **KaTeX** di-render client-side, konten soal disimpan sebagai plain string dengan `$...$` dan `$$...$$`
8. **Gambar soal** disimpan di `/public/uploads/questions/` atau object storage, path disimpan di DB
9. **Docker Compose** wajib ada: service `app` (Next.js) + `db` (PostgreSQL) — deploy cukup `docker compose up -d`
10. **Environment variables** semua di `.env` — tidak ada hardcode config

---

## Aturan Deployment (Wajib Diikuti Release Agent)

### Docker
- **Dockerfile** wajib multi-stage: `deps` → `builder` → `runner` (base image: `node:20-alpine`)
- **docker-compose.yml** wajib punya 2 service:
  - `app`: build dari Dockerfile, port `3000:3000`, `restart: unless-stopped`, `env_file: .env`
  - `db`: image `postgres:16-alpine`, volume persistent `pgdata`, `restart: unless-stopped`
- Satu command untuk deploy: `docker compose up -d` — tidak boleh butuh langkah manual tambahan selain setup `.env`
- `prisma migrate deploy` dijalankan otomatis saat container `app` start (via entrypoint atau CMD)
- `.env.example` wajib ada dan berisi semua variable yang dibutuhkan dengan nilai placeholder yang jelas

### Environment Variables Wajib
```env
DATABASE_URL=postgresql://user:password@db:5432/soalatihan
NEXTAUTH_SECRET=random-32-char-string
NEXTAUTH_URL=http://localhost:3000
POSTGRES_USER=soalatihan
POSTGRES_PASSWORD=change-this-password
POSTGRES_DB=soalatihan
```

### VPS Compatibility
- Tidak boleh ada dependency yang butuh OS tertentu
- Semua service harus bisa jalan di Ubuntu 22.04 / Debian 12 dengan Docker
- Port yang diexpose hanya `3000` (app) — port DB tidak boleh diexpose ke luar container network
- Support Cloudflare Tunnel (tidak butuh SSL di level app, cukup HTTP di belakang tunnel/reverse proxy)

### Tidak Boleh
- Hardcode IP, domain, atau port di kode
- Menyimpan secret/API key di dalam image Docker
- Menggunakan `docker run` manual — semua via `docker compose`

---

## Modul Aplikasi

| Kode | Nama Modul | Deskripsi |
|---|---|---|
| AUTH | Autentikasi & Otorisasi | Login, logout, RBAC (Admin / Siswa) |
| STUDY | Study Mode | Latihan bebas, filter bank soal, feedback instan |
| EXAM | Exam Mode | Sesi + batch, resume, countdown timer, auto-grade |
| CONTENT | Content Processing | Import soal CSV/JSON/XML, template, LaTeX renderer |
| HISTORY | History & Analitik | Riwayat sesi, grafik skor, streak harian |
| ADMIN | Admin Dashboard | CRUD soal, manajemen user, konfigurasi AI, diagnostik DB |

---

## Agent Roles & Ownership

### 1. Product Manager Agent
**Tugasnya:** Breakdown PRD menjadi user stories dan acceptance criteria per modul.
**Boleh ubah:**
- `docs/features/[modul]/prd.md`
- `docs/features/[modul]/user-stories.md`

**Tidak boleh ubah:** File apapun di luar folder docs miliknya.

---

### 2. System Analyst Agent
**Tugasnya:** Mendefinisikan workflow, business rules, dan edge cases dari setiap modul.
**Boleh ubah:**
- `docs/features/[modul]/workflow.md`
- `docs/features/[modul]/business-rules.md`
- `docs/features/[modul]/edge-cases.md`

**Tidak boleh ubah:** Kode, schema DB, atau file PRD.

---

### 3. System Architect Agent
**Tugasnya:** Mendefinisikan arsitektur teknis per modul — komponen, data flow, integrasi antar modul.
**Boleh ubah:**
- `docs/features/[modul]/architecture/feature-architecture.md`
- `docs/features/[modul]/architecture/backend-architecture.md`
- `docs/features/[modul]/architecture/web-architecture.md`
- `docs/global/architecture-principles.md`

**Tidak boleh ubah:** Kode implementasi, schema DB.

---

### 4. Database Engineer Agent
**Tugasnya:** Mendefinisikan schema Prisma, relasi antar tabel, index, dan migration strategy.
**Boleh ubah:**
- `docs/global/database-schema.md`
- `prisma/schema.prisma`
- `prisma/migrations/`

**Tidak boleh ubah:** API routes, komponen UI, business logic.

---

### 5. API Designer Agent
**Tugasnya:** Mendefinisikan kontrak API (endpoint, request, response, error codes) untuk semua modul.
**Boleh ubah:**
- `docs/features/[modul]/backend/api-contract.md`

**Tidak boleh ubah:** Implementasi, schema DB.

---

### 6. Frontend Architect Agent
**Tugasnya:** Mendefinisikan struktur halaman, komponen, UI flow, dan state management per modul.
**Boleh ubah:**
- `docs/features/[modul]/web/ui-flow.md`
- `docs/features/[modul]/web/component-guideline.md`

**Tidak boleh ubah:** Kode, API contract, schema DB.

---

### 7. Backend Developer Agent
**Tugasnya:** Implementasi API routes, server actions, middleware, dan logika bisnis.
**Boleh ubah:**
- `app/api/[modul]/`
- `lib/`
- `middleware.ts`

**Tidak boleh ubah:** Komponen UI (`components/`), schema Prisma (minta ke DB Agent), halaman (`app/(pages)/`).

---

### 8. Frontend Developer Agent
**Tugasnya:** Implementasi halaman dan komponen UI berdasarkan ui-flow dan component-guideline.
**Boleh ubah:**
- `app/(pages)/`
- `components/`
- `hooks/`
- `store/` (Zustand)

**Tidak boleh ubah:** API routes, Prisma schema, middleware.

---

### 9. QA Agent
**Tugasnya:** Menyusun test scenario dan regression checklist berdasarkan business rules dan user stories.
**Boleh ubah:**
- `docs/features/[modul]/qa/test-scenario.md`
- `docs/features/[modul]/qa/regression-checklist.md`

**Tidak boleh ubah:** Kode implementasi.

---

### 10. Release Agent
**Tugasnya:** Menyusun README, release notes, deployment checklist, dan memastikan Docker Compose siap deploy.
**Boleh ubah:**
- `README.md` — wajib berisi: deskripsi app, deploy Docker, deploy native OS, custom port, env vars, struktur project
- `docs/features/[modul]/release/release-notes.md`
- `docs/features/[modul]/release/deployment-checklist.md`
- `docker-compose.yml` — port wajib pakai variable: `"${PORT:-3000}:3000"`
- `.env.example` — wajib ada variable `PORT=3000` dengan komentar penjelasan
- `Dockerfile`
- `Dockerfile.dev`

**Aturan README wajib:**
1. Section "Tentang Aplikasi" — deskripsi + tabel fitur
2. Section "Deploy via Docker" — step by step + custom port via `PORT=8080 docker compose up -d`
3. Section "Deploy Native" — Node.js langsung + PM2 + custom port via `PORT=8080 npm start`
4. Section "Environment Variables" — semua variable dengan contoh
5. Section "Setup Domain" — Nginx config + Cloudflare Tunnel

---

## Urutan Kerja Wajib Per Modul

```
1. PM Agent        → prd.md + user-stories.md
2. Analyst Agent   → workflow.md + business-rules.md + edge-cases.md
3. Architect Agent → architecture/*.md
4. DB Agent        → database-schema.md → prisma/schema.prisma
5. API Agent       → api-contract.md
6. FE Architect    → ui-flow.md + component-guideline.md
         ↓ SEMUA DOKUMEN LENGKAP → BARU CODING
7. BE Developer    → implementasi API routes
8. FE Developer    → implementasi halaman + komponen
9. QA Agent        → test scenario + regression checklist
10. Release Agent  → release notes + deployment checklist
```

> ⚠️ **LARANGAN KERAS:** Agent tidak boleh mulai coding sebelum seluruh dokumen tahap 1–6 selesai dan disetujui. Jika ada yang ambigu, buat Stop Report dan tunggu klarifikasi.

---

## Business Rules Kritis (Wajib Dipahami Semua Agent)

### Auth & RBAC
- Hanya 2 role: `ADMIN` dan `SISWA`
- Semua route `/admin/*` hanya bisa diakses `ADMIN`
- Semua route `/study/*`, `/exam/*`, `/history/*` hanya bisa diakses `SISWA` yang sudah login
- Halaman publik: landing page, login saja

### Bank Soal
- Setiap soal memiliki: `tingkat` (SD/SMP/SMA), `level` (OSNK/OSNP/SEMIFINAL/FINAL), `matpel`, `question_type` (MULTIPLE_CHOICE/SHORT_ANSWER/ESSAY)
- `question_type` ditentukan per soal, bukan per level
- Soal bisa memiliki gambar (`image_url`) — opsional
- Konten soal disimpan sebagai string, LaTeX menggunakan format `$...$` dan `$$...$$`
- Short Answer: memiliki `acceptable_answers[]` (array string) untuk variasi jawaban yang diterima
- Essay: grading berdasarkan angka jawaban final saja (no cara pengerjaan)
- Multiple Choice: memiliki `options[]` dan `correct_option` (index)

### Study Mode
- Filter wajib lengkap: tingkat + level + matpel (matpel bisa multi-select)
- Soal ditampilkan satu per satu, tanpa batas waktu
- Feedback instan: jawaban benar + pembahasan muncul segera setelah user menjawab
- Tidak ada konsep sesi atau batch — bebas berhenti kapan saja
- Urutan soal diacak tiap sesi, urutan pilihan jawaban (MC) juga diacak

### Exam Mode
- Filter sama dengan Study Mode
- Sistem sesi + batch: 1 sesi = seluruh soal dari filter dibagi ke dalam batch-batch
- 1 batch = 10–30 soal (configurable oleh admin, default 10)
- Dalam 1 sesi, tidak ada pengulangan soal antar batch
- Soal baru berulang jika memulai sesi baru
- Urutan soal dan pilihan jawaban (MC) diacak tiap sesi
- Feedback + pembahasan hanya muncul setelah submit per batch
- Countdown timer: opsional, durasi configurable saat setup exam
- Resume sesi: jika user disconnect, saat login ulang ditawarkan resume atau mulai baru
- Analitik muncul setelah setiap batch selesai

### Analitik
- Skor per batch (line chart — journey belajar)
- Perbandingan jawaban benar vs salah per batch dan kumulatif
- Streak harian: berapa hari berturut-turut user aktif belajar/exam
- Pop-up milestone streak yang eye-catchy
- Filter analitik per matpel / level / tingkat

### Import Soal
- Format yang didukung: CSV, JSON, XML
- Setiap format memiliki template yang bisa didownload dari admin
- Tersedia static prompt di UI untuk membantu user convert PDF/dokumen ke format import menggunakan AI
- Import dilakukan batch, ada preview sebelum konfirmasi simpan
- Validasi wajib: field mandatory, format jawaban, tipe soal

### Admin Dashboard
- CRUD penuh untuk soal dan set soal
- Manajemen user: lihat daftar, ubah role, nonaktifkan akun
- Konfigurasi AI: simpan API Key, Base URL, System Prompt (disimpan di DB, terenkripsi)
- Diagnostik DB: health check koneksi DB + basic stats (total soal, total user, total sesi)

---

## File Ownership Matrix

| File/Folder | Agent yang Boleh Ubah |
|---|---|
| `docs/features/*/prd.md` | PM Agent |
| `docs/features/*/user-stories.md` | PM Agent |
| `docs/features/*/workflow.md` | Analyst Agent |
| `docs/features/*/business-rules.md` | Analyst Agent |
| `docs/features/*/edge-cases.md` | Analyst Agent |
| `docs/features/*/architecture/` | Architect Agent |
| `docs/global/architecture-principles.md` | Architect Agent |
| `docs/global/database-schema.md` | DB Agent |
| `prisma/schema.prisma` | DB Agent |
| `prisma/migrations/` | DB Agent |
| `docs/features/*/backend/api-contract.md` | API Agent |
| `docs/features/*/web/ui-flow.md` | FE Architect Agent |
| `docs/features/*/web/component-guideline.md` | FE Architect Agent |
| `app/api/` | BE Developer Agent |
| `lib/` | BE Developer Agent |
| `middleware.ts` | BE Developer Agent |
| `app/(pages)/` | FE Developer Agent |
| `components/` | FE Developer Agent |
| `hooks/` | FE Developer Agent |
| `store/` | FE Developer Agent |
| `docs/features/*/qa/` | QA Agent |
| `docker-compose.yml` | Release Agent |
| `Dockerfile` | Release Agent |
| `.env.example` | Release Agent |
| `docs/features/*/release/` | Release Agent |

---

## Stop Conditions

Agent **wajib berhenti** dan membuat Stop Report jika:

1. Ada ambiguitas dalam business rules yang tidak bisa diselesaikan sendiri
2. Ada konflik antara dokumen yang berbeda (misal: api-contract tidak sesuai database-schema)
3. Ada dependency ke modul lain yang belum selesai didokumentasikan
4. Ada keputusan teknis yang berdampak besar (misal: perlu ganti library, ubah schema)
5. Dokumen prerequisite (tahap sebelumnya) belum lengkap

### Format Stop Report

```
## STOP REPORT
**Agent:** [nama agent]
**Modul:** [nama modul]
**Tahap:** [tahap yang sedang dikerjakan]

**Masalah:**
[deskripsi masalah atau ambiguitas]

**Dokumen yang Terpengaruh:**
- [daftar file]

**Opsi yang Tersedia:**
1. [opsi 1]
2. [opsi 2]

**Rekomendasi:**
[rekomendasi agent]

**Menunggu keputusan dari:** [manusia / agent lain]
```

---

## Definition of Done

Sebuah modul dinyatakan DONE jika:

- [ ] `prd.md` dan `user-stories.md` lengkap dan disetujui
- [ ] `workflow.md`, `business-rules.md`, `edge-cases.md` lengkap
- [ ] `architecture/*.md` lengkap
- [ ] `prisma/schema.prisma` terupdate dan migration berhasil
- [ ] `api-contract.md` lengkap dengan semua endpoint, request/response, error codes
- [ ] `ui-flow.md` dan `component-guideline.md` lengkap
- [ ] Semua API routes terimplementasi dan tested
- [ ] Semua halaman dan komponen terimplementasi
- [ ] `test-scenario.md` lengkap
- [ ] `regression-checklist.md` diisi dan semua item passed
- [ ] `docker-compose up -d` berhasil tanpa error
- [ ] Tidak ada hardcode config (semua di `.env`)

---

## Agent Handoff Format

Setiap agent yang selesai mengerjakan tugasnya wajib menulis handoff:

```
## AGENT HANDOFF
**Dari:** [nama agent]
**Kepada:** [nama agent berikutnya]
**Modul:** [nama modul]
**Tanggal:** [tanggal]

**Yang Sudah Selesai:**
- [daftar file yang sudah dibuat/diubah]

**Keputusan Penting:**
- [keputusan teknis/bisnis yang dibuat selama pengerjaan]

**Catatan untuk Agent Berikutnya:**
- [hal-hal penting yang perlu diperhatikan]

**Status:** READY FOR NEXT AGENT ✅
```
