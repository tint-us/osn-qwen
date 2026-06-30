# UI Flow — STUDY MODE Module

## 1. Overall Flow

```
/dashboard
  │
  ▼ klik "Study Mode"
/study
  │
  ▼
┌─────────────────────────────┐
│     Filter Form             │
│                             │
│  Tingkat: [SD/SMP/SMA ▼]   │
│  Level:   [OSNK/...  ▼]    │
│  Matpel:  ☑ Fisika          │
│           ☑ Matematika      │
│           ☐ Kimia            │
│                             │
│  [Mulai Latihan]            │  ← disabled sampai semua terisi
└──────────────┬──────────────┘
               │ klik "Mulai Latihan"
               ▼
    ┌──────────┴──────────┐
    │                     │
  Ada soal?           Tidak ada soal?
    │                     │
    ▼                     ▼
/study/session        Pesan "Belum ada soal"
?tingkat=&level=      [Ubah Filter] → back to /study
&matpel=
    │
    ▼
┌─────────────────────────────────────────┐
│  Study Progress: Soal 1 dari 25         │
│  Benar: 0 | Salah: 0                    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ QuestionCard                    │    │
│  │                                 │    │
│  │  "Sebuah benda bergerak..."    │    │
│  │  $v = 10 \text{ m/s}$           │    │
│  │                                 │    │
│  │  [Gambar soal (jika ada)]      │    │
│  │                                 │    │
│  │  ┌──────────────────────┐     │    │
│  │  │ AnswerInput            │     │    │
│  │  │                        │     │    │
│  │  │ ○ 25 m                 │     │    │  ← MULTIPLE_CHOICE
│  │  │ ○ 50 m                 │     │    │
│  │  │ ○ 10 m                 │     │    │
│  │  │ ○ 5 m                  │     │    │
│  │  └──────────────────────┘     │    │
│  │                                 │    │
│  │  [Submit Jawaban]              │    │  ← disabled jika jawaban kosong
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
               │ klik "Submit Jawaban"
               ▼
┌─────────────────────────────────────────┐
│  Study Progress: Soal 1 dari 25         │
│  Benar: 0 | Salah: 0                    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ QuestionCard (disabled)         │    │
│  │                                 │    │
│  │  "Sebuah benda bergerak..."    │    │
│  │                                 │    │
│  │  AnswerInput (disabled)         │    │
│  │                                 │    │
│  │  ┌─────────────────────────┐   │    │
│  │  │ FeedbackPanel             │   │    │
│  │  │                           │   │    │
│  │  │  ✅ BENAR / ❌ SALAH      │   │    │
│  │  │                           │   │    │
│  │  │  Jawaban benar: 50 m     │   │    │  ← hanya jika salah
│  │  │                           │   │    │
│  │  │  Pembahasan:              │   │    │
│  │  │  Jarak = v × t = 50 m    │   │    │
│  │  └─────────────────────────┘   │    │
│  │                                 │    │
│  │  [Soal Berikutnya]             │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
               │ klik "Soal Berikutnya"
               ▼
      Soal berikutnya (index++)
               │
               ...
               │
               ▼ (soal terakhir, klik "Selesai")
┌─────────────────────────────────────────┐
│  Ringkasan Latihan                      │
│                                         │
│  Total soal: 25                         │
│  Benar: 18                               │
│  Salah: 7                                │
│  Akurasi: 72%                            │
│                                         │
│  [Kembali ke Dashboard]                 │
└─────────────────────────────────────────┘
```

## 2. Filter Page States

| State | UI |
|---|---|
| Initial | Form kosong, tombol "Mulai" disabled |
| Partial fill | Tombol "Mulai" disabled (belum semua terisi) |
| Complete fill | Tombol "Mulai" enabled |
| Loading | Tombol "Mulai" → spinner, disabled |

## 3. Session Page States

| State | UI |
|---|---|
| Loading (fetch soal) | Full-screen spinner |
| Error (no soal) | Pesan + tombol "Ubah Filter" |
| Error (network) | Pesan "Koneksi terputus" + tombol "Coba Lagi" |
| Soal displayed | QuestionCard + AnswerInput + Submit button |
| Submitting | Submit button → spinner, inputs disabled |
| Answered (feedback) | FeedbackPanel + "Soal Berikutnya" button |
| Last question answered | "Selesai" button → ringkasan |
| Summary | Total, benar, salah, akurasi, tombol ke dashboard |

## 4. Navigation States

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Filter  │───→│  Soal 1  │───→│ Feedback │───→│  Soal 2  │───→ ...
│  Page    │     │          │    │          │    │          │
└────┬─────┘     └──────────┘    └──────────┘    └──────────┘
     │                                                  │
     │              ...                                 │
     │                                                  ▼
     │                                          ┌──────────┐
     │                                          │  Soal N  │
     │                                          │ (last)   │
     │                                          └────┬─────┘
     │                                               │
     │                                               ▼
     │                                          ┌──────────┐
     │                                          │ Feedback │
     │                                          │ + Selesai│
     │                                          └────┬─────┘
     │                                               │
     │                                               ▼
     │                                          ┌──────────┐
     │                                          │ Summary  │
     └──────────────────────────────────────────│ + Done   │
                                                └──────────┘

Keluar kapan saja: tombol "Keluar" / browser back → /dashboard (langsung, no confirm)
```

## 5. Mobile vs Desktop Layout

### Desktop
```
┌──────────────────────────────────────────────┐
│  Navbar: SoaLatihan | Study Mode | [Logout]  │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Soal 3 dari 25  |  Benar: 2  Salah: 0│  │
│  ├────────────────────────────────────────┤  │
│  │                                        │  │
│  │  [Konten soal + LaTeX + gambar]       │  │
│  │                                        │  │
│  │  [Input jawaban]                      │  │
│  │                                        │  │
│  │  [Submit Jawaban]                     │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Mobile
```
┌──────────────────────┐
│  ☰  Study Mode  [⏻] │
├──────────────────────┤
│  Soal 3/25  ✅2 ❌0  │
├──────────────────────┤
│                      │
│  [Konten soal]       │
│  [LaTeX]             │
│  [Gambar]            │
│                      │
│  [Input jawaban]     │
│                      │
│  [Submit]            │
└──────────────────────┘
```
