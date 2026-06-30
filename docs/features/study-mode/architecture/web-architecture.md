# Web Architecture — STUDY MODE Module

## 1. Halaman dan Routing

```
app/(siswa)/
├── layout.tsx                 ← Siswa layout (navbar + logout)
├── dashboard/
│   └── page.tsx               ← Card link ke Study/Exam/History
└── study/
    ├── page.tsx               ← Halaman filter + start
    └── session/
        └── page.tsx           ← Halaman mengerjakan soal (client component)
```

### `/study` — Filter Page (Server Component)
- Cek session (via layout)
- Render `StudyFilterForm` (client component)
- Tidak fetch soal — filter form submit ke client-side navigation

### `/study/session` — Study Session Page (Client Component)
- Menerima filter via query params atau Zustand
- Fetch soal di client-side (useEffect atau onLoad)
- Render `QuestionCard`, `AnswerInput`, `FeedbackPanel`, `StudyProgress`

## 2. Page Architecture

### `/study` Page (Server Component)

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudyFilterForm } from "@/components/study/StudyFilterForm";

export default async function StudyPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any).role !== "SISWA") redirect("/admin");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Study Mode</h1>
      <StudyFilterForm />
    </div>
  );
}
```

### `/study/session` Page (Client Component)

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStudyStore } from "@/store/study-store";
import { QuestionCard } from "@/components/study/QuestionCard";
import { StudyProgress } from "@/components/study/StudyProgress";
import { Loader2 } from "lucide-react";

export default function StudySessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { questions, currentIndex, isAnswered, setQuestions, reset } = useStudyStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tingkat = searchParams.get("tingkat");
    const level = searchParams.get("level");
    const matpel = searchParams.get("matpel");

    if (!tingkat || !level || !matpel) {
      router.push("/study");
      return;
    }

    fetch(`/api/questions?tingkat=${tingkat}&level=${level}&matpel=${matpel}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setQuestions(data.data);
        } else if (data.success && data.data.length === 0) {
          setError("Belum ada soal untuk filter ini");
        } else {
          setError(data.error || "Terjadi kesalahan");
        }
      })
      .catch(() => setError("Koneksi terputus"))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Loader2 className="animate-spin" />;
  if (error) return <ErrorMessage error={error} onBack={() => router.push("/study")} />;
  if (currentIndex >= questions.length) return <StudySummary />;

  return (
    <div>
      <StudyProgress />
      <QuestionCard question={questions[currentIndex]} />
    </div>
  );
}
```

## 3. Zustand Store

### File: `store/study-store.ts`

```typescript
import { create } from "zustand";

interface Question {
  id: number;
  questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
  content: string;
  imageUrl: string | null;
  options: string[];
  acceptableAnswers: string[];
  explanation: string;
}

interface StudyResult {
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

interface StudyStore {
  questions: Question[];
  currentIndex: number;
  selectedAnswer: string | null;
  results: StudyResult[];
  isAnswered: boolean;
  isSubmitting: boolean;

  setQuestions: (q: Question[]) => void;
  setSelectedAnswer: (a: string | null) => void;
  setSubmitting: (v: boolean) => void;
  submitAnswer: (result: StudyResult) => void;
  nextQuestion: () => void;
  reset: () => void;
}

export const useStudyStore = create<StudyStore>((set) => ({
  questions: [],
  currentIndex: 0,
  selectedAnswer: null,
  results: [],
  isAnswered: false,
  isSubmitting: false,

  setQuestions: (q) => set({ questions: q }),
  setSelectedAnswer: (a) => set({ selectedAnswer: a }),
  setSubmitting: (v) => set({ isSubmitting: v }),
  submitAnswer: (result) =>
    set((state) => ({
      results: [...state.results, result],
      isAnswered: true,
      isSubmitting: false,
      selectedAnswer: null,
    })),
  nextQuestion: () =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      isAnswered: false,
      selectedAnswer: null,
    })),
  reset: () =>
    set({
      questions: [],
      currentIndex: 0,
      selectedAnswer: null,
      results: [],
      isAnswered: false,
      isSubmitting: false,
    }),
}));
```

### Zustand Rules untuk Study Mode
- `questions[]` — fetched once, stored in Zustand for client-side navigation
- `selectedAnswer` — sementara, sebelum submit
- `results[]` — hasil grading, untuk ringkasan akhir
- **Tidak ada data dari DB yang perlu persist** — semua soal sudah di-fetch di awal
- **Reset saat keluar** — `reset()` dipanggil saat navigasi away

## 4. Client-Side Data Flow

```
URL: /study/session?tingkat=SMA&level=OSNK&matpel=Fisika,Matematika
  │
  ▼
useEffect: fetch /api/questions?...
  │
  ▼
Response: { success: true, data: [...] }
  │
  ▼
useStudyStore.setQuestions(data)
  │
  ▼
Render: QuestionCard(questions[0])
  │
  ▼
User selects/types answer → setSelectedAnswer()
  │
  ▼
User clicks "Submit" → setSubmitting(true)
  │
  ▼
fetch POST /api/study/attempt { questionId, userAnswer }
  │
  ▼
Response: { success: true, data: { isCorrect, correctAnswer, explanation } }
  │
  ▼
useStudyStore.submitAnswer(result)
  │
  ▼
Render: FeedbackPanel(result)
  │
  ▼
User clicks "Next" → nextQuestion()
  │
  ▼
Render: QuestionCard(questions[currentIndex+1])
```

## 5. Image Handling

```tsx
// Inside QuestionCard component
{question.imageUrl && (
  <div className="mt-4">
    <img
      src={question.imageUrl}
      alt="Gambar soal"
      className="max-w-full rounded-lg"
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.display = "none";
        e.currentTarget.nextElementSibling?.classList.remove("hidden");
      }}
    />
    <div className="hidden text-gray-500 text-sm">
      Gambar tidak tersedia
    </div>
  </div>
)}
```

## 6. KaTeX Integration

- Konten soal dan pembahasan menggunakan `KatexRenderer` dari `components/shared/`
- Tidak ada import `katex` langsung di komponen study mode
- Parser memisahkan `$...$` dan `$$...$$` dari plain text

```tsx
// Inside QuestionCard
<QuestionDisplay content={question.content} />

// QuestionDisplay uses KatexRenderer internally
// components/shared/QuestionDisplay.tsx
import { KatexRenderer } from "./KatexRenderer";

export function QuestionDisplay({ content }: { content: string }) {
  // Parse content for $...$ and $$...$$ segments
  // Render each segment with KatexRenderer or plain text
}
```
