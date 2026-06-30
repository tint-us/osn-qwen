# Coding Standard — SoaLatihan

## 1. Konvensi Penamaan

| Elemen | Konvensi | Contoh |
|---|---|---|
| File (semua) | kebab-case | `exam-session.ts`, `question-card.tsx` |
| Komponen React | PascalCase | `QuestionCard`, `ExamTimer`, `StreakBadge` |
| Fungsi / variabel | camelCase | `getQuestions()`, `handleSubmit()`, `batchSize` |
| Constant (module-level) | UPPER_SNAKE_CASE | `MAX_BATCH_SIZE`, `DEFAULT_TIMER_DURATION` |
| Tabel Prisma / Model | PascalCase | `User`, `Question`, `ExamSession` |
| Field database | camelCase | `createdAt`, `isActive`, `questionType` |
| Enum Prisma | UPPER_SNAKE_CASE | `ADMIN`, `SISWA`, `MULTIPLE_CHOICE` |
| API Route folder | kebab-case | `app/api/exam-sessions/`, `app/api/study-attempts/` |
| Zustand store | camelCase + `Store` suffix | `useExamStore`, `useStudyStore` |
| CSS class (Tailwind) | kebab-case | `question-container`, `feedback-banner` |

## 2. Struktur Folder Next.js App Router

```
/opt/osn-cl/
├── app/
│   ├── (auth)/                 ← Halaman publik: login, register
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (admin)/                ← Halaman admin (RBAC: ADMIN only)
│   │   ├── admin/
│   │   │   ├── questions/
│   │   │   ├── users/
│   │   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (siswa)/                ← Halaman siswa (RBAC: SISWA only)
│   │   ├── study/
│   │   ├── exam/
│   │   ├── history/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── questions/
│   │   ├── exam-sessions/
│   │   ├── study-attempts/
│   │   ├── import/
│   │   └── admin/
│   ├── layout.tsx              ← Root layout
│   ├── page.tsx                ← Landing page
│   └── globals.css
├── components/
│   ├── ui/                     ← shadcn/ui primitives (Button, Input, dll)
│   ├── shared/                 ← Komponen shared lintas modul
│   │   ├── KatexRenderer.tsx
│   │   ├── QuestionDisplay.tsx
│   │   └── FilterBar.tsx
│   ├── auth/
│   ├── study/
│   ├── exam/
│   ├── history/
│   └── admin/
├── hooks/
│   ├── use-exam-session.ts
│   ├── use-study-attempts.ts
│   └── use-auth.ts
├── store/                      ← Zustand stores
│   ├── exam-store.ts
│   └── study-store.ts
├── lib/
│   ├── prisma.ts               ← Prisma client singleton
│   ├── auth.ts                 ← NextAuth config
│   ├── validators/             ← Zod schemas untuk validasi input
│   ├── services/               ← Business logic (Prisma queries ada di sini)
│   │   ├── question-service.ts
│   │   ├── exam-service.ts
│   │   └── import-service.ts
│   └── utils.ts                ← Helper functions
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── middleware.ts               ← Route protection (RBAC)
└── public/
    └── uploads/
        └── questions/          ← Gambar soal
```

### Aturan Folder
- **`app/`** — hanya halaman dan API routes. Tidak ada business logic di sini.
- **`components/`** — komponen UI reusable. Dibagi per modul.
- **`lib/services/`** — semua business logic dan Prisma queries.
- **`hooks/`** — custom React hooks yang membungkus API calls.
- **`store/`** — Zustand stores (hanya UI session state).
- **`lib/validators/`** — Zod schemas untuk validasi request body.

## 3. Server Component vs Client Component

### Aturan Dasar
- **Default: Server Component.** Semua komponen adalah Server Component kecuali ada alasan eksplisit.
- Gunakan `"use client"` **hanya** jika komponen membutuhkan:
  - Interaktivitas (onClick, onChange, form state)
  - React hooks (useState, useEffect, useRef)
  - Browser API (window, localStorage, IntersectionObserver)
  - Zustand store access
  - KaTeX rendering (client-side only)

### Pola yang Dianjurkan
```tsx
// ✅ Server Component — fetch data di server
export default async function StudyPage() {
  const questions = await getQuestions(filter); // lib/services
  return <QuestionList questions={questions} />;
}

// ✅ Client Component — interaktivitas
"use client";
export function QuestionCard({ question }: Props) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  // ...
}
```

### Anti-Pattern
```tsx
// ❌ Jangan: "use client" di page level untuk fetch data
"use client";
export default function StudyPage() {
  const [questions, setQuestions] = useState([]);
  useEffect(() => {
    fetch('/api/questions').then(...)
  }, []);
}
```

## 4. Aturan Zustand

### Prinsip
Zustand **hanya untuk UI session state** — state yang sementara, hilang saat refresh, dan tidak perlu persisten.

### Yang BOLEH di Zustand
- Exam state: current question index, selected answers (belum submit), timer state, batch navigation
- Study state: current question index, filter selection (sebelum fetch)
- UI state: modal open/close, sidebar toggle, theme

### Yang TIDAK BOLEH di Zustand
- Data dari database (questions, users, sessions) — selalu fetch via server
- Data yang perlu persist setelah refresh — simpan di DB
- Data yang dipakai bersama oleh multiple users — simpan di DB

### Struktur Store
```typescript
// store/exam-store.ts
interface ExamState {
  // State
  currentQuestionIndex: number;
  selectedAnswers: Record<number, string>;
  timeRemaining: number | null;
  isPaused: boolean;

  // Actions (hanya mengubah UI state, tidak fetch data)
  setAnswer: (questionId: number, answer: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  pauseExam: () => void;
  resetExam: () => void;
}
```

## 5. Format Response API Standar

### Response Sukses
```json
{
  "success": true,
  "data": { ... }
}
```

### Response Error
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Response dengan Pagination
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### HTTP Status Codes
| Code | Kapan dipakai |
|---|---|
| 200 | GET, PUT, PATCH berhasil |
| 201 | POST create berhasil |
| 204 | DELETE berhasil (no content) |
| 400 | Validation error, bad request |
| 401 | Tidak terautentikasi |
| 403 | Terotentikasi tapi tidak ada akses (RBAC) |
| 404 | Resource tidak ditemukan |
| 500 | Server error |

### Implementasi di API Route
```typescript
// app/api/questions/route.ts
import { NextResponse } from "next/server";
import { questionService } from "@/lib/services/question-service";

export async function GET(request: Request) {
  try {
    const questions = await questionService.getAll(filter);
    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
```

## 6. Aturan Prisma

### Prinsip
Semua Prisma query **wajib** berada di `lib/services/` atau server action. Tidak boleh ada Prisma query langsung di komponen, halaman, atau API route handler.

### Struktur Service Layer
```typescript
// lib/services/question-service.ts
import { prisma } from "@/lib/prisma";

export const questionService = {
  async getAll(filter: QuestionFilter) {
    return prisma.question.findMany({
      where: {
        tingkat: filter.tingkat,
        level: filter.level,
        matpel: { in: filter.matpels },
      },
    });
  },

  async create(data: QuestionInput) {
    return prisma.question.create({ data });
  },
};
```

### Prisma Client Singleton
```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Yang Dilarang
```tsx
// ❌ Jangan: Prisma query di komponen
"use client";
import { prisma } from "@/lib/prisma"; // Prisma tidak bisa di client component!

// ❌ Jangan: Prisma query langsung di API route handler
export async function GET() {
  const questions = await prisma.question.findMany(); // Logic di service layer!
  return Response.json(questions);                    // Gunakan format standar!
}
```

## 7. Aturan Environment Variables

### Prinsip
**Tidak ada hardcode config.** Semua nilai yang bisa berubah antar environment wajib di `.env`.

### Yang Wajib di .env
- `DATABASE_URL` — connection string PostgreSQL
- `NEXTAUTH_SECRET` — secret untuk JWT signing
- `NEXTAUTH_URL` — base URL aplikasi
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — kredensial DB
- `PORT` — port aplikasi (default 3000)

### Cara Akses
```typescript
// ✅ Benar
const databaseUrl = process.env.DATABASE_URL!;

// ❌ Salah — hardcode
const databaseUrl = "postgresql://user:pass@localhost:5432/db";
```

### `.env.example` wajib ada dengan placeholder:
```env
DATABASE_URL=postgresql://soalatihan:change-this-password@db:5432/soalatihan
NEXTAUTH_SECRET=generate-random-32-char-string
NEXTAUTH_URL=http://localhost:3000
POSTGRES_USER=soalatihan
POSTGRES_PASSWORD=change-this-password
POSTGRES_DB=soalatihan
PORT=3000
```

## 8. Aturan KaTeX

### Prinsip
KaTeX **hanya boleh diimport** di satu tempat: `components/shared/KatexRenderer.tsx`. Semua komponen lain yang butuh render LaTeX wajib menggunakan wrapper ini.

### Wrapper Component
```tsx
// components/shared/KatexRenderer.tsx
"use client";

import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface KatexRendererProps {
  content: string;
  display?: boolean; // true untuk $$...$$ (display mode)
}

export function KatexRenderer({ content, display = false }: KatexRendererProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(content, {
        displayMode: display,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return content; // Fallback: tampilkan plain text
    }
  }, [content, display]);

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
```

### Aturan Penggunaan
- Konten soal disimpan sebagai plain string dengan `$...$` (inline) dan `$$...$$` (display).
- Komponen lain (QuestionDisplay, Explanation, dll) menggunakan `KatexRenderer` tanpa import `katex` langsung.
- Untuk render konten campuran (text + LaTeX), gunakan parser yang memisahkan segmen `$...$` dari plain text, lalu render masing-masing dengan `KatexRenderer` atau plain text.

### Yang Dilarang
```tsx
// ❌ Jangan: import katex di komponen lain
import katex from "katex"; // Hanya di KatexRenderer.tsx!
```

## 9. Aturan Gambar Soal

### Storage
- Lokasi: `/public/uploads/questions/`
- Path di DB: relative path, misalnya `/uploads/questions/2024-01-15-abc123.png`

### Constraint
| Aturan | Nilai |
|---|---|
| Max file size | 2 MB |
| Format yang didukung | `.jpg`, `.jpeg`, `.png`, `.webp` |
| Naming convention | `{timestamp}-{random-hash}.{ext}` |

### Validasi Upload
```typescript
// lib/validators/image-upload.ts
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImage(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File size exceeds 2MB limit" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Format must be JPG, PNG, or WebP" };
  }
  return { valid: true };
}
```

### Sanitasi Path
- Path file **tidak boleh** dikonstruksi dari user input tanpa validasi.
- Gunakan generated filename (timestamp + hash), bukan nama file asli dari user.
- Validasi terhadap directory traversal (`../`, `..\\`).
