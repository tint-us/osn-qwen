# Feature Architecture — ADMIN DASHBOARD Module

## 1. Component Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                       ADMIN DASHBOARD                                 │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────┐       │
│  │  AdminLayout (sidebar + content area)                     │       │
│  │                                                            │       │
│  │  ┌─ Sidebar ──────────┐  ┌─ Content ─────────────────┐    │       │
│  │  │ 📊 Dashboard       │  │                            │    │       │
│  │  │ 📝 Bank Soal       │  │  (route-dependent content) │    │       │
│  │  │ 📤 Import Soal     │  │                            │    │       │
│  │  │ 👥 Manajemen User  │  │                            │    │       │
│  │  │ ⚙️ Konfigurasi AI  │  │                            │    │       │
│  │  │ ⏱️ Konfigurasi Exam│  │                            │    │       │
│  │  │ 🗄️ Diagnostik DB   │  │                            │    │       │
│  │  └────────────────────┘  └────────────────────────────┘    │       │
│  └───────────────────────────────────────────────────────────┘       │
│                                                                       │
│  ┌─ /admin (Dashboard Home) ─────────────────────────────────┐      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │      │
│  │  │ StatsCard│ │ StatsCard│ │ StatsCard│ │ StatsCard│       │      │
│  │  │ Total    │ │ Total    │ │ Total    │ │ Total    │       │      │
│  │  │ Soal     │ │ User     │ │ Sesi     │ │ Attempts │       │      │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │      │
│  │  ┌──────────────────┐  ┌──────────────────┐               │      │
│  │  │ Quick Actions    │  │ Recent Activity  │               │      │
│  │  │ [Tambah Soal]    │  │ (optional, future)│              │      │
│  │  │ [Import Soal]    │  │                  │               │      │
│  │  └──────────────────┘  └──────────────────┘               │      │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                       │
│  ┌─ /admin/questions (Bank Soal List) ───────────────────────┐      │
│  │  ┌─ Filter Bar ──────────────────────────────────────┐    │      │
│  │  │ [Tingkat▾] [Level▾] [Matpel] [Type▾] [Search]     │    │      │
│  │  │ [Reset]                          [Tambah Soal +]  │    │      │
│  │  └────────────────────────────────────────────────────┘    │      │
│  │  ┌─ QuestionTable (DataTable) ──────────────────────┐     │      │
│  │  │ ID │ Content │ Tingkat │ Level │ Matpel │ Type  │  │     │      │
│  │  │  1 │ Hitung… │ SMA     │ OSNP  │ Mat    │ MC    │  │     │      │
│  │  │  2 │ Manaka… │ SMP     │ OSNK  │ Fis    │ SA    │  │     │      │
│  │  │ ...                                              │  │     │      │
│  │  │ [Edit] [Delete] per row                          │  │     │      │
│  │  └──────────────────────────────────────────────────┘  │     │      │
│  │  ┌─ Pagination ─────────────────────────────────────┐   │     │      │
│  │  │ ‹ First  ‹ Prev  1 2 3  Next ›  Last ›          │   │     │      │
│  │  └──────────────────────────────────────────────────┘   │     │      │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                       │
│  ┌─ /admin/questions/new & /admin/questions/[id]/edit ──────┐      │
│  │  ┌─ QuestionForm ───────────────────────────────────┐     │      │
│  │  │ Tingkat [▾]  Level [▾]  Matpel [____]            │     │      │
│  │  │ Type [▾]                                          │     │      │
│  │  │                                                    │     │      │
│  │  │ Content:                                           │     │      │
│  │  │ ┌──────────────────────┐ ┌──────────────────────┐│     │      │
│  │  │ │ textarea              │ │ KaTeX Live Preview   ││     │      │
│  │  │ │ $x = \frac{1}{2}$    │ │ x = ½                ││     │      │
│  │  │ └──────────────────────┘ └──────────────────────┘│     │      │
│  │  │                                                    │     │      │
│  │  │ Explanation:                                       │     │      │
│  │  │ ┌──────────────────────┐ ┌──────────────────────┐│     │      │
│  │  │ │ textarea              │ │ KaTeX Live Preview   ││     │      │
│  │  │ └──────────────────────┘ └──────────────────────┘│     │      │
│  │  │                                                    │     │      │
│  │  │ Conditional Fields (based on questionType):      │     │      │
│  │  │ MC:  Options[] [add/remove] + correctOption radio │     │      │
│  │  │ SA:  acceptableAnswers[] [add/remove]             │     │      │
│  │  │ ESSAY: acceptableAnswers[] [add/remove]            │     │      │
│  │  │                                                    │     │      │
│  │  │ [Batal]                        [Simpan]            │     │      │
│  │  └──────────────────────────────────────────────────┘     │      │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                       │
│  ┌─ /admin/users ───────────────────────────────────────────┐      │
│  │  ┌─ Filter Bar ──────────────────────────────────────┐    │      │
│  │  │ [Role▾] [Status▾] [Search name/email]   [Reset]   │    │      │
│  │  └────────────────────────────────────────────────────┘    │      │
│  │  ┌─ UserTable ──────────────────────────────────────┐     │      │
│  │  │ ID │ Nama │ Email │ Role │ Status │ Actions      │     │      │
│  │  │  1 │ Admin│ a@b.c │ ADMIN │ Aktif │ [Toggle Role] │     │      │
│  │  │  2 │ Siswa│ x@y.z │ SISWA │ Aktif │ [Edit][Deact]│     │      │
│  │  └──────────────────────────────────────────────────┘     │      │
│  │  ┌─ Pagination ─────────────────────────────────────┐    │      │
│  │  └──────────────────────────────────────────────────┘    │      │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                       │
│  ┌─ /admin/config/ai ───────────────────────────────────────┐       │
│  │  ┌─ AIConfigForm ────────────────────────────────────┐   │       │
│  │  │ API Key:     [••••••••ab3f]            [👁 Show]  │   │       │
│  │  │ Base URL:    [https://api.openai.com/v1]         │   │       │
│  │  │ System Prompt:                                    │   │       │
│  │  │ ┌────────────────────────────────────────────┐    │   │       │
│  │  │ │ textarea (multi-line)                      │    │   │       │
│  │  │ └────────────────────────────────────────────┘    │   │       │
│  │  │                              [Simpan]             │   │       │
│  │  └──────────────────────────────────────────────────┘   │       │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                       │
│  ┌─ /admin/config/exam ────────────────────────────────────┐       │
│  │  ┌─ ExamConfigForm ──────────────────────────────────┐   │       │
│  │  │ Default Batch Size: [10] (min 10, max 30)         │   │       │
│  │  │                              [Simpan]             │   │       │
│  │  └──────────────────────────────────────────────────┘   │       │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                       │
│  ┌─ /admin/diagnostics ────────────────────────────────────┐       │
│  │  ┌─ DBHealthCard ────────────────────────────────────┐   │       │
│  │  │  Status: ✅ Connected                               │   │       │
│  │  │  Latency: 12ms                                     │   │       │
│  │  │  ┌──────────┐┌──────────┐┌──────────┐┌──────────┐│   │       │
│  │  │  │ Total    ││ Total    ││ Total    ││ Total    ││   │       │
│  │  │  │ Soal     ││ User     ││ Sesi     ││ Attempts ││   │       │
│  │  │  │ 1,500    ││ 120      ││ 450      ││ 5,200    ││   │       │
│  │  │  └──────────┘└──────────┘└──────────┘└──────────┘│   │       │
│  │  │  [Refresh]  Last updated: 10:30:25               │   │       │
│  │  └──────────────────────────────────────────────────┘   │       │
│  └────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────┘
```

## 2. Data Flow

```
/admin (Dashboard Home)
  └── GET /api/admin/stats
        → AdminStatsOverview (4 StatsCards)

/admin/questions (Bank Soal List)
  └── GET /api/admin/questions?page=X&limit=10&...filters
        → QuestionTable

/admin/questions/new (Add Question)
  └── POST /api/admin/questions (on submit)
        → Redirect to /admin/questions

/admin/questions/[id]/edit (Edit Question)
  ├── GET /api/admin/questions/[id] (fetch data)
  └── PATCH /api/admin/questions/[id] (on submit)

/admin/questions (Delete)
  └── DELETE /api/admin/questions/[id] (on confirm)

/admin/users (User Management)
  ├── GET /api/admin/users?page=X&limit=10&...filters
  ├── PATCH /api/admin/users/[id] { role } (toggle role)
  └── PATCH /api/admin/users/[id] { isActive } (toggle status)

/admin/config/ai (AI Configuration)
  ├── GET /api/admin/config (fetch ai_* keys)
  └── PATCH /api/admin/config { ai_api_key, ai_base_url, ai_system_prompt }

/admin/config/exam (Exam Configuration)
  ├── GET /api/admin/config (fetch exam_default_batch_size)
  └── PATCH /api/admin/config { exam_default_batch_size }

/admin/diagnostics (DB Diagnostics)
  └── GET /api/admin/diagnostics (polling every 30s)
```

## 3. API Key Encryption Logic

```typescript
// lib/services/configService.ts

import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 char string
const ALGORITHM = "aes-256-gcm";

function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY not configured");
  }

  const key = Buffer.from(ENCRYPTION_KEY, "utf8");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY not configured");
  }

  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
  const key = Buffer.from(ENCRYPTION_KEY, "utf8");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 4) {
    return "••••";
  }
  return `••••••••${apiKey.slice(-4)}`;
}

// Save AI config
async function saveAIConfig(data: {
  apiKey?: string;
  baseUrl: string;
  systemPrompt: string;
}) {
  if (data.apiKey && data.apiKey.length > 0) {
    // New API key provided — encrypt and save
    await prisma.appConfig.upsert({
      where: { key: "ai_api_key" },
      create: {
        key: "ai_api_key",
        value: encrypt(data.apiKey),
        isEncrypted: true,
      },
      update: {
        value: encrypt(data.apiKey),
        isEncrypted: true,
      },
    });
  }
  // If apiKey is empty string, keep existing (do nothing)

  await prisma.appConfig.upsert({
    where: { key: "ai_base_url" },
    create: { key: "ai_base_url", value: data.baseUrl, isEncrypted: false },
    update: { value: data.baseUrl },
  });

  await prisma.appConfig.upsert({
    where: { key: "ai_system_prompt" },
    create: { key: "ai_system_prompt", value: data.systemPrompt, isEncrypted: false },
    update: { value: data.systemPrompt },
  });
}

// Get AI config (API Key masked)
async function getAIConfig() {
  const apiKeyRow = await prisma.appConfig.findUnique({ where: { key: "ai_api_key" } });
  const baseUrlRow = await prisma.appConfig.findUnique({ where: { key: "ai_base_url" } });
  const promptRow = await prisma.appConfig.findUnique({ where: { key: "ai_system_prompt" } });

  let maskedApiKey = "";
  if (apiKeyRow?.value) {
    try {
      const decrypted = decrypt(apiKeyRow.value);
      maskedApiKey = maskApiKey(decrypted);
    } catch {
      maskedApiKey = "••••••••";
    }
  }

  return {
    apiKey: maskedApiKey,
    baseUrl: baseUrlRow?.value || "",
    systemPrompt: promptRow?.value || "",
  };
}
```

## 4. Stats Query

```typescript
// lib/services/adminService.ts

async function getStats() {
  const [totalQuestions, totalUsers, totalSessions, totalAttempts] = await Promise.all([
    prisma.question.count(),
    prisma.user.count(),
    prisma.examSession.count(),
    prisma.studyAttempt.count(),
  ]);

  return {
    totalQuestions,
    totalUsers,
    totalSessions,
    totalAttempts,
  };
}
```

## 5. Question List Query with Filter

```typescript
async function getQuestions(params: {
  page: number;
  limit: number;
  tingkat?: string;
  level?: string;
  matpel?: string;
  questionType?: string;
  search?: string;
}) {
  const where: Prisma.QuestionWhereInput = {};

  if (params.tingkat) where.tingkat = params.tingkat as Tingkat;
  if (params.level) where.level = params.level as Level;
  if (params.questionType) where.questionType = params.questionType as QuestionType;
  if (params.matpel) {
    where.matpel = { contains: params.matpel, mode: "insensitive" };
  }
  if (params.search) {
    where.content = { contains: params.search, mode: "insensitive" };
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      select: {
        id: true,
        content: true,
        tingkat: true,
        level: true,
        matpel: true,
        questionType: true,
        createdAt: true,
      },
    }),
    prisma.question.count({ where }),
  ]);

  return {
    questions: questions.map(q => ({
      ...q,
      content: q.content.slice(0, 50) + (q.content.length > 50 ? "..." : ""),
    })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}
```

## 6. DB Diagnostics Query

```typescript
async function getDiagnostics() {
  const startTime = Date.now();

  try {
    // Connection check + latency
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    // Stats (parallel)
    const [totalQuestions, totalUsers, totalSessions, totalAttempts] = await Promise.all([
      prisma.question.count(),
      prisma.user.count(),
      prisma.examSession.count(),
      prisma.studyAttempt.count(),
    ]);

    return {
      status: "connected",
      latency: `${latency}ms`,
      stats: {
        totalQuestions,
        totalUsers,
        totalSessions,
        totalAttempts,
      },
    };
  } catch (error) {
    return {
      status: "disconnected",
      latency: "—",
      stats: {
        totalQuestions: "—",
        totalUsers: "—",
        totalSessions: "—",
        totalAttempts: "—",
      },
    };
  }
}
```

## 7. User Management Logic

```typescript
async function updateUser(
  userId: number,
  currentUserId: number,
  data: { role?: Role; isActive?: boolean }
) {
  // Prevent self-deactivation
  if (userId === currentUserId && data.isActive === false) {
    throw new Error("Cannot deactivate own account");
  }

  // Prevent self role change
  if (userId === currentUserId && data.role) {
    throw new Error("Cannot change own role");
  }

  return await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.role && { role: data.role }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });
}
```

## 8. Middleware — Admin Route Protection

```typescript
// middleware.ts

export function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  // Admin routes protection
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/study", request.url));
    }
  }

  // API routes protection
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    if (!token || token.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}
```
