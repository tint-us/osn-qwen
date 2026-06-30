# UI Flow — EXAM MODE Module

## 1. Exam Home Page (/exam)

### Initial State
```
┌─────────────────────────────────────────────┐
│  Header: "Exam Mode"                        │
├─────────────────────────────────────────────┤
│                                             │
│  [Resume Modal — if active session exists]  │
│  ┌─────────────────────────────────────────┐│
│  │ Anda memiliki sesi ujian yang belum    ││
│  │ selesai.                               ││
│  │                                        ││
│  │ Batch tersisa: 3 dari 5                ││
│  │                                        ││
│  │ [Mulai Baru]        [Resume]          ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ── OR (no active session) ──               │
│                                             │
│  Step 1: Filter                            │
│  ┌─────────────────────────────────────────┐│
│  │ Tingkat: [SD] [SMP] [SMA]             ││
│  │ Level:  [OSNK] [OSNP] [SEMIFINAL]      ││
│  │          [FINAL]                       ││
│  │ Matpel: ☑ Matematika                   ││
│  │         ☑ Fisika                      ││
│  │         ☐ Kimia                       ││
│  └─────────────────────────────────────────┘│
│                                             │
│  Step 2: Exam Setup                         │
│  ┌─────────────────────────────────────────┐│
│  │ Batch Size: [====10====] 10 soal       ││
│  │                                        ││
│  │ Timer: [OFF]                           ││
│  │                                        ││
│  │ [Mulai Ujian]                          ││
│  └─────────────────────────────────────────┘│
│                                             │
└─────────────────────────────────────────────┘
```

### States
| State | Condition | UI |
|---|---|---|
| Loading | Fetching active session | Spinner |
| Resume | Active session exists | ResumeSessionModal overlay |
| Setup | No active session | Filter + Setup form |
| Timer On | User toggles timer on | Duration input appears |

## 2. Batch Execution Page (/exam/session/[id]/batch/[batchIndex])

### Desktop Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Exam Mode                    Timer: 28:45 🟢      │
├──────────┬──────────────────────────────┬─────────────────┤
│          │                              │                 │
│ Nav      │  Question Content            │  Answer Area    │
│ Panel    │  ┌────────────────────────┐  │                 │
│          │  │ Soal 3 dari 10         │  │  [Input area    │
│ ① Done   │  │ (Batch 1 dari 5)       │  │   sesuai type]  │
│ ② Done   │  │                        │  │                 │
│ ③ Active │  │  Hitung nilai dari     │  │  MC: radio      │
│ ④ ---    │  │  $\int_0^1 x^2 dx$     │  │  SA: text       │
│ ⑤ ---    │  │                        │  │  ESSAY: number  │
│ ⑥ ---    │  │  [Gambar soal?]        │  │                 │
│ ⑦ ---    │  │                        │  │                 │
│ ⑧ ---    │  └────────────────────────┘  │                 │
│ ⑨ ---    │                              │                 │
│ ⑩ ---    │  [← Sebelumnya]  [Berikutnya →]│                │
│          │                              │                 │
├──────────┴──────────────────────────────┴─────────────────┤
│                                    [Submit Batch]          │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────────────┐
│ Exam Mode      Timer: 28:45 │
├─────────────────────────────┤
│ Soal 3 dari 10 (Batch 1/5)  │
│                             │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │  Question Content       │ │
│ │  + KaTeX rendering      │ │
│ │                         │ │
│ │  [Image if any]         │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ Answer Input:               │
│ ┌─────────────────────────┐ │
│ │ [radio/text/number]     │ │
│ └─────────────────────────┘ │
│                             │
│ [← Prev] [Soal 3/10] [Next →]│
│                             │
│ [1][2][3*][4][5][6][7][8][9][10]│
│                             │
│        [Submit Batch]       │
└─────────────────────────────┘
```

### States
| State | Condition | UI |
|---|---|---|
| Loading | Fetching batch data | Spinner |
| Active | Batch loaded, timer running | Full UI |
| Timer Warning | < 5 min remaining | Timer turns yellow |
| Timer Critical | < 1 min remaining | Timer turns red |
| Auto-Submit | Timer hits 0 | Toast "Waktu habis!" → submit |
| Submitting | Submit request in flight | Disable buttons, spinner |
| Syncing | Sync in progress | Subtle indicator (corner) |

## 3. Submit Confirmation Modal

```
┌───────────────────────────────────┐
│  Submit Batch?                     │
├───────────────────────────────────┤
│                                   │
│  Anda belum menjawab 3 soal.      │
│  Soal: 4, 7, 9                    │
│                                   │
│  Setelah submit, jawaban tidak    │
│  dapat diubah.                     │
│                                   │
│  [Batal]         [Submit Batch]   │
└───────────────────────────────────┘
```

## 4. Batch Review Page (/exam/session/[id]/review/[batchIndex])

```
┌─────────────────────────────────────────────────────────────┐
│  Batch 1 Review — Skor: 80/100                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Benar: 8    │  │ Salah: 2    │  │ Skor: 80    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ── Analytics ──                                           │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Line Chart: Skor per Batch                           │ │
│  │  100│                                                 │ │
│  │   80│─────●                                          │ │
│  │   60│                                                 │ │
│  │     └──────────────────                              │ │
│  │      B1   B2   B3   B4   B5                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ── Review per Soal ──                                      │
│                                                             │
│  ┌─ Soal 1 ──────────────────────────────────────────────┐ │
│  │  [✓]  Hitung nilai dari $\int_0^1 x^2 dx$             │ │
│  │                                                        │ │
│  │  Jawaban Anda: 1/3                                     │ │
│  │  Jawaban Benar: 1/3                                    │ │
│  │  Pembahasan:                                           │ │
│  │  Integral dari $x^2$ adalah $\frac{x^3}{3} + C$...    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Soal 2 ──────────────────────────────────────────────┐ │
│  │  [✗]  Manakah yang merupakan bilangan prima?          │ │
│  │                                                        │ │
│  │  Jawaban Anda: 4 (salah)                               │ │
│  │  Jawaban Benar: 2                                      │ │
│  │  Pembahasan: 2 adalah satu-satunya bilangan genap...   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  [← Collapse All]  [Expand All]                             │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  [Batch Berikutnya →]  (or [Selesai] if last)│          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Review Item States
| State | Visual |
|---|---|
| Correct | Green border, ✓ icon |
| Incorrect | Red border, ✗ icon |
| Collapsed | Header only (soal + status) |
| Expanded | Full: soal, jawaban user, jawaban benar, pembahasan |

## 5. Exam Summary Page (/exam/session/[id]/summary)

```
┌─────────────────────────────────────────────────────────────┐
│  Exam Selesai! 🎉                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────┐           │
│  │  Skor Rata-rata: 82.0                        │           │
│  │  Total Benar: 41 / 50                        │           │
│  │  Total Salah: 9 / 50                         │           │
│  └──────────────────────────────────────────────┘           │
│                                                             │
│  ── Skor per Batch ──                                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Line Chart: All batches                              │  │
│  │  100│                                                 │  │
│  │   80│──●──●──●──●──●                                 │  │
│  │   60│                                                 │  │
│  │     └──────────────────                              │  │
│  │      B1   B2   B3   B4   B5                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ── Benar vs Salah per Batch ──                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Stacked Bar Chart per batch                          │  │
│  │  B1: ████████████░░░░ (8/2)                          │  │
│  │  B2: ██████████████░░ (9/1)                          │  │
│  │  ...                                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [Kembali ke Dashboard]                                     │
└─────────────────────────────────────────────────────────────┘
```

## 6. Resume Modal

```
┌───────────────────────────────────┐
│  Sesi Ujian Belum Selesai         │
├───────────────────────────────────┤
│                                   │
│  Anda memiliki sesi ujian yang    │
│  belum selesai.                   │
│                                   │
│  Filter: SMA / OSNP / Matematika  │
│  Batch tersisa: 3 dari 5          │
│  Batch terakhir dijawab: Batch 2   │
│                                   │
│  ┌─────────────────────────────┐  │
│  │ [Mulai Baru]   [Resume]     │  │
│  └─────────────────────────────┘  │
│                                   │
│  Catatan: Mulai baru akan         │
│  membatalkan sesi saat ini.       │
│                                   │
└───────────────────────────────────┘
```

## 7. Timer Badge States

| State | Color | Condition |
|---|---|---|
| Normal | Green | > 5 minutes remaining |
| Warning | Yellow | 1-5 minutes remaining |
| Critical | Red | < 1 minute remaining |
| Expired | Red + "Habis" | 0 seconds (triggers auto-submit) |
| Disabled | Gray | Timer is off |
