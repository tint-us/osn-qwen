# Component Guideline — STUDY MODE Module

## 1. StudyFilterForm

### File: `components/study/StudyFilterForm.tsx`

```tsx
"use client";
```

**Props:** None

**State:**
| State | Type | Default | Keterangan |
|---|---|---|---|
| `tingkat` | `"SD" \| "SMP" \| "SMA" \| ""` | `""` | Pilihan tingkat |
| `level` | `"OSNK" \| "OSNP" \| "SEMIFINAL" \| "FINAL" \| ""` | `""` | Pilihan level |
| `matpels` | `string[]` | `[]` | Mata pelajaran terpilih (multi-select) |
| `isStarting` | boolean | `false` | Loading state saat mulai |

**Behavior:**
1. User pilih tingkat (radio/dropdown) → update `tingkat`
2. User pilih level (radio/dropdown) → update `level`
3. User toggle matpel (checkbox) → add/remove dari `matpels[]`
4. Tombol "Mulai Latihan" disabled jika `!tingkat || !level || matpels.length === 0`
5. Klik "Mulai Latihan":
   - `router.push(/study/session?tingkat=X&level=Y&matpel=A,B,C)`
   - Tidak fetch soal di sini — fetch terjadi di session page

**API Calls:** None (navigasi only)

**UI:**
```
┌─────────────────────────────────────┐
│  Pilih Filter Latihan               │
│                                     │
│  Tingkat                            │
│  ○ SD  ○ SMP  ○ SMA                 │
│                                     │
│  Level                              │
│  ○ OSNK  ○ OSNP  ○ SEMIFINAL  ○ FINAL│
│                                     │
│  Mata Pelajaran                     │
│  ☑ Fisika                           │
│  ☑ Matematika                       │
│  ☐ Kimia                            │
│  ☐ Biologi                          │
│                                     │
│  [Mulai Latihan]  ← disabled state  │
└─────────────────────────────────────┘
```

---

## 2. QuestionCard

### File: `components/study/QuestionCard.tsx`

```tsx
"use client";
```

**Props:**
| Prop | Type | Keterangan |
|---|---|---|
| `question` | Question | Data soal yang sedang ditampilkan |
| `isAnswered` | boolean | Apakah soal sudah dijawab (disable inputs) |
| `onSubmit` | (answer: string) => void | Callback saat user submit jawaban |
| `isSubmitting` | boolean | Loading state saat grading |

**Question type:**
```typescript
interface Question {
  id: number;
  questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
  content: string;
  imageUrl: string | null;
  options: string[];
  acceptableAnswers: string[];
  explanation: string;
}
```

**Behavior:**
1. Render konten soal menggunakan `QuestionDisplay` (shared component dengan KaTeX)
2. Jika `imageUrl` ada: render `<img>` dengan lazy loading + onError fallback
3. Render `AnswerInput` sesuai `questionType`
4. Tombol "Submit Jawaban":
   - Disabled jika `selectedAnswer === null` atau `isSubmitting === true`
   - Jika `isAnswered === true`: tombol hidden, tampilkan FeedbackPanel
5. Saat submit: panggil `onSubmit(selectedAnswer)`

**Internal State:**
| State | Type | Default |
|---|---|---|
| `selectedAnswer` | string \| null | `null` |

**UI:**
```
┌──────────────────────────────────────────┐
│                                          │
│  Sebuah benda bergerak dengan kecepatan  │
│  v = 10 m/s. Berapa jarak tempuhnya     │  ← KaTeX rendered
│  dalam 5 sekon?                         │
│                                          │
│  ┌────────────────────────────┐         │
│  │  [Gambar soal (jika ada)]  │         │  ← lazy loaded, onError fallback
│  └────────────────────────────┘         │
│                                          │
│  ┌────────────────────────────┐         │
│  │ AnswerInput                 │         │
│  │ ○ 25 m                     │         │  ← MULTIPLE_CHOICE
│  │ ● 50 m                     │         │  ← selected
│  │ ○ 10 m                     │         │
│  │ ○ 5 m                      │         │
│  └────────────────────────────┘         │
│                                          │
│  ┌──────────────────┐                   │
│  │  Submit Jawaban  │                   │  ← disabled if no answer
│  └──────────────────┘                   │
│                                          │
└──────────────────────────────────────────┘
```

---

## 3. AnswerInput

### File: `components/study/AnswerInput.tsx`

```tsx
"use client";
```

**Props:**
| Prop | Type | Keterangan |
|---|---|---|
| `type` | `"MULTIPLE_CHOICE" \| "SHORT_ANSWER" \| "ESSAY"` | Tipe input |
| `options` | string[] | Pilihan jawaban (MC only) |
| `value` | string \| null | Jawaban yang sedang dipilih |
| `onChange` | (value: string) => void | Callback saat jawaban berubah |
| `disabled` | boolean | Disable input (setelah submit) |

**Behavior per tipe:**

### MULTIPLE_CHOICE
- Render radio button untuk setiap option
- `value` = index terpilih (string, misal "2")
- `onChange("2")` saat radio dipilih
- Disabled setelah submit

### SHORT_ANSWER
- Render `<input type="text" />`
- `value` = teks yang diketik
- `onChange(text)` saat user mengetik
- Disabled setelah submit
- Placeholder: "Ketik jawaban Anda..."

### ESSAY
- Render `<input type="number" />`
- `value` = angka yang diketik
- `onChange(number)` saat user mengetik
- Disabled setelah submit
- Placeholder: "Masukkan angka jawaban..."
- Step: "any" (mendukung desimal)

---

## 4. FeedbackPanel

### File: `components/study/FeedbackPanel.tsx`

```tsx
"use client";
```

**Props:**
| Prop | Type | Keterangan |
|---|---|---|
| `result` | StudyResult | Hasil grading dari server |
| `onNext` | () => void | Callback saat klik "Soal Berikutnya" |
| `isLast` | boolean | Apakah ini soal terakhir (ubah teks tombol) |

**StudyResult type:**
```typescript
interface StudyResult {
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}
```

**Behavior:**
1. Tampilkan status:
   - `isCorrect === true` → Banner hijau "✅ BENAR"
   - `isCorrect === false` → Banner merah "❌ SALAH"
2. Jika salah: tampilkan "Jawaban benar: [correctAnswer]"
3. Tampilkan pembahasan dengan KaTeX rendering (via QuestionDisplay atau KatexRenderer)
4. Tombol:
   - `isLast === false` → "Soal Berikutnya"
   - `isLast === true` → "Selesai"
5. Animasi: fade-in saat muncul

**UI:**
```
┌──────────────────────────────────────────┐
│  ┌────────────────────────────────────┐  │
│  │  ❌ SALAH                          │  │  ← merah background
│  └────────────────────────────────────┘  │
│                                          │
│  Jawaban benar: 50 m                    │
│                                          │
│  Pembahasan:                             │
│  ┌────────────────────────────────────┐  │
│  │ Jarak = kecepatan × waktu         │  │  ← KaTeX rendered
│  │ = 10 × 5 = 50 m                   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌──────────────────┐                   │
│  │ Soal Berikutnya  │                   │  ← atau "Selesai" jika last
│  └──────────────────┘                   │
└──────────────────────────────────────────┘
```

---

## 5. StudyProgress

### File: `components/study/StudyProgress.tsx`

```tsx
"use client";
```

**Props:**
| Prop | Type | Keterangan |
|---|---|---|
| `currentIndex` | number | Index soal saat ini (0-based) |
| `total` | number | Total soal |
| `correctCount` | number | Jumlah jawaban benar |
| `wrongCount` | number | Jumlah jawaban salah |

**Behavior:**
- Display: "Soal {currentIndex + 1} dari {total}"
- Display: "Benar: {correctCount} | Salah: {wrongCount}"
- Progress bar (optional): persentase soal yang sudah dijawab

**UI:**
```
┌──────────────────────────────────────────────┐
│  Soal 3 dari 25        Benar: 2 | Salah: 0  │
│  ━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░     │  ← progress bar
└──────────────────────────────────────────────┘
```

---

## 6. StudySummary

### File: `components/study/StudySummary.tsx`

```tsx
"use client";
```

**Props:**
| Prop | Type | Keterangan |
|---|---|---|
| `total` | number | Total soal yang dijawab |
| `correct` | number | Jawaban benar |
| `wrong` | number | Jawaban salah |
| `onBackToDashboard` | () => void | Callback ke dashboard |

**Behavior:**
- Hitung akurasi: `(correct / total * 100).toFixed(0)%`
- Tampilkan ringkasan
- Tombol "Kembali ke Dashboard"

**UI:**
```
┌──────────────────────────────────┐
│      Latihan Selesai! 🎉         │
│                                  │
│  ┌────────┐  ┌────────┐         │
│  │  25    │  │  72%   │         │
│  │ Total  │  │ Akurasi│         │
│  └────────┘  └────────┘         │
│                                  │
│  ┌────────┐  ┌────────┐         │
│  │  18    │  │   7    │         │
│  │ Benar  │  │ Salah  │         │
│  └────────┘  └────────┘         │
│                                  │
│  [Kembali ke Dashboard]         │
└──────────────────────────────────┘
```

---

## 7. KatexRenderer (Shared Component)

### File: `components/shared/KatexRenderer.tsx`

```tsx
"use client";
```

**Props:**
| Prop | Type | Default | Keterangan |
|---|---|---|---|
| `content` | string | — | String LaTeX untuk render |
| `display` | boolean | `false` | `true` untuk display mode (`$$...$$`), `false` untuk inline (`$...$`) |

**Behavior:**
- Import `katex` hanya di file ini
- `katex.renderToString(content, { displayMode: display, throwOnError: false, strict: false })`
- Jika error: tampilkan raw text
- Output via `dangerouslySetInnerHTML`

**Usage:**
```tsx
<KatexRenderer content="\\frac{1}{2}" display={false} />
<KatexRenderer content="\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}" display={true} />
```

---

## 8. QuestionDisplay (Shared Component)

### File: `components/shared/QuestionDisplay.tsx`

```tsx
// Server or Client component
```

**Props:**
| Prop | Type | Keterangan |
|---|---|---|
| `content` | string | Konten soal dengan `$...$` dan `$$...$$` |

**Behavior:**
- Parse `content` untuk segmen LaTeX:
  - `$$...$$` → display mode KatexRenderer
  - `$...$` → inline mode KatexRenderer
  - Plain text → render as-is
- Return array of elements: text + KatexRenderer + text + ...

**Parsing Algorithm:**
```
Input: "Hitung $\\frac{1}{2}$ dari 10. Hasilnya $$\\frac{10}{2} = 5$$."

Segments:
  1. "Hitung " → plain text
  2. "\\frac{1}{2}" → inline KaTeX
  3. " dari 10. Hasilnya " → plain text
  4. "\\frac{10}{2} = 5" → display KaTeX
  5. "." → plain text

Output:
  <span>Hitung <KatexRenderer content="\\frac{1}{2}" /> dari 10. Hasilnya <KatexRenderer content="\\frac{10}{2} = 5" display />.</span>
```

---

## 9. Component Dependency Graph

```
app/(siswa)/study/page.tsx
  └── StudyFilterForm

app/(siswa)/study/session/page.tsx
  ├── StudyProgress
  ├── QuestionCard
  │   ├── QuestionDisplay (shared)
  │   │   └── KatexRenderer (shared)
  │   ├── AnswerInput
  │   └── FeedbackPanel (conditional, after submit)
  │       └── QuestionDisplay (shared)  ← untuk explanation
  │           └── KatexRenderer (shared)
  └── StudySummary (conditional, when finished)

store/study-store.ts
  └── useStudyStore (Zustand)
```

## 10. Import Summary

| Komponen | Lokasi | Dipakai oleh |
|---|---|---|
| StudyFilterForm | `components/study/` | Study page |
| QuestionCard | `components/study/` | Session page |
| AnswerInput | `components/study/` | QuestionCard |
| FeedbackPanel | `components/study/` | QuestionCard |
| StudyProgress | `components/study/` | Session page |
| StudySummary | `components/study/` | Session page |
| KatexRenderer | `components/shared/` | QuestionDisplay |
| QuestionDisplay | `components/shared/` | QuestionCard, FeedbackPanel |
