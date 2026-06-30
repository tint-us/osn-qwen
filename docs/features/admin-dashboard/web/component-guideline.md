# Component Guidelines — ADMIN DASHBOARD Module

## Components List

| # | Component | Type | Location |
|---|---|---|---|
| 1 | AdminLayout | Server | `components/admin/AdminLayout.tsx` |
| 2 | AdminStatsOverview | Client | `components/admin/AdminStatsOverview.tsx` |
| 3 | QuestionTable | Client | `components/admin/QuestionTable.tsx` |
| 4 | QuestionForm | Client | `components/admin/QuestionForm.tsx` |
| 5 | UserTable | Client | `components/admin/UserTable.tsx` |
| 6 | AIConfigForm | Client | `components/admin/AIConfigForm.tsx` |
| 7 | ExamConfigForm | Client | `components/admin/ExamConfigForm.tsx` |
| 8 | DBHealthCard | Client | `components/admin/DBHealthCard.tsx` |

---

## 1. AdminLayout

**Purpose:** Sidebar navigation layout for all admin pages.

**Props:**
```typescript
interface AdminLayoutProps {
  children: React.ReactNode;
  activePage: "dashboard" | "questions" | "import" | "users" | "config-ai" | "config-exam" | "diagnostics";
}
```

**Behavior:**
- Fixed sidebar on left (desktop), collapsible drawer (mobile with hamburger menu)
- Sidebar items:
  - 📊 Dashboard → `/admin`
  - 📝 Bank Soal → `/admin/questions`
  - 📤 Import Soal → `/admin/import`
  - 👥 Manajemen User → `/admin/users`
  - ⚙️ Konfigurasi AI → `/admin/config/ai`
  - ⏱️ Konfigurasi Exam → `/admin/config/exam`
  - 🗄️ Diagnostik DB → `/admin/diagnostics`
- Active item highlighted with background color
- Content area on right (scrollable)
- Sidebar collapse on mobile (< 768px)
- Header bar with page title + user avatar dropdown

---

## 2. AdminStatsOverview

**Purpose:** Display 4 stat cards on dashboard home.

**Props:**
```typescript
interface AdminStatsOverviewProps {
  stats: {
    totalQuestions: number;
    totalUsers: number;
    totalSessions: number;
    totalAttempts: number;
  };
  isLoading?: boolean;
}
```

**Behavior:**
- Grid: 4 StatsCards (reuses StatsCard from history module, or standalone)
- Each card: icon, value (with thousand separator), label
- Cards:
  - 📝 Total Soal (blue)
  - 👥 Total User (green)
  - 📊 Total Sesi Exam (purple)
  - ✏️ Total Study Attempts (orange)
- Loading: skeleton cards (pulsing gray)
- Responsive: 4 cols desktop, 2 cols tablet, 1 col mobile
- Quick action buttons below: "Tambah Soal", "Import Soal"

---

## 3. QuestionTable

**Purpose:** DataTable showing paginated, filterable question list.

**Props:**
```typescript
interface QuestionTableProps {
  questions: QuestionSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  filters: {
    tingkat?: string;
    level?: string;
    matpel?: string;
    questionType?: string;
    search?: string;
  };
  onFilterChange: (filters: Partial<QuestionTableProps["filters"]>) => void;
  onPageChange: (page: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
}
```

**Behavior:**
- **Filter bar** above table:
  - Tingkat dropdown (SD/SMP/SMA/All)
  - Level dropdown (OSNK/OSNP/SEMIFINAL/FINAL/All)
  - Matpel text input (partial match)
  - QuestionType dropdown (MC/SA/ESSAY/All)
  - Search input (content search)
  - "Reset Filter" button
  - "+ Tambah Soal" button (navigates to /admin/questions/new)
- **Table columns:** ID, Content (truncated 50 chars), Tingkat, Level, Matpel, Type, Created At, Actions
- **Actions per row:** [Edit] [Delete] buttons
- **Pagination:** First, Prev, page numbers, Next, Last + "Menampilkan X-Y dari Z soal"
- **Sorting:** by createdAt (default desc) — column header clickable
- **Loading:** skeleton rows
- **Empty:** "Tidak ada soal yang sesuai" + Reset Filter + Tambah Soal buttons
- **Delete:** triggers confirmation modal (handled by parent)
- Uses shadcn/ui DataTable component

---

## 4. QuestionForm

**Purpose:** Form for adding/editing questions with KaTeX live preview.

**Props:**
```typescript
interface QuestionFormProps {
  initialData?: QuestionFormData; // present when editing, absent when adding
  onSubmit: (data: QuestionFormData) => Promise<void>;
  isSubmitting?: boolean;
}
```

**Behavior:**
- **Fields:**
  - tingkat: select (SD/SMP/SMA)
  - level: select (OSNK/OSNP/SEMIFINAL/FINAL)
  - matpel: text input
  - questionType: select (MULTIPLE_CHOICE/SHORT_ANSWER/ESSAY)
  - content: textarea with KaTeX live preview panel side-by-side
  - imageUrl: text input (optional)
  - explanation: textarea with KaTeX live preview panel side-by-side
- **Conditional fields (based on questionType):**
  - MULTIPLE_CHOICE:
    - options[]: dynamic list (add/remove), each a text input
    - correctOption: radio button per option
    - Minimum 2 options required
  - SHORT_ANSWER:
    - acceptableAnswers[]: dynamic list (add/remove), each a text input
    - Minimum 1 required
  - ESSAY:
    - acceptableAnswers[]: dynamic list (add/remove), each a text input (numeric answer)
    - Minimum 1 required
- **KaTeX live preview:**
  - Renders in real-time as user types in content/explanation
  - Supports `$...$` (inline) and `$$...$$` (block)
  - Uses `KatexRenderer` component (shared, from Study/Exam mode)
  - Preview panel on right side of textarea (desktop), below (mobile)
- **questionType change:**
  - MC → SA/ESSAY: clear options[] + correctOption, init acceptableAnswers[] with 1 empty field
  - SA/ESSAY → MC: clear acceptableAnswers[], init options[] with 2 empty fields, correctOption = null
  - SA ↔ ESSAY: keep acceptableAnswers[] (same structure)
- **Validation (client-side):**
  - tingkat, level, matpel, content, explanation: required
  - MC: options ≥ 2, correctOption selected
  - SA/ESSAY: acceptableAnswers ≥ 1, no empty strings
- **Buttons:** [Batal] (redirect back) [Simpan] (submit)
- **Error display:** inline error text below each invalid field
- **Submitting:** Simpan button disabled, shows spinner

**KaTeX Preview Implementation:**
```typescript
// Inside QuestionForm component
<div className="grid grid-cols-2 gap-4">
  <div>
    <label>Content</label>
    <textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      className="w-full min-h-[150px] ..."
    />
  </div>
  <div className="border rounded p-4 bg-gray-50">
    <p className="text-sm text-gray-500 mb-2">Preview</p>
    <KatexRenderer content={content} />
  </div>
</div>
```

---

## 5. UserTable

**Purpose:** DataTable showing paginated, filterable user list.

**Props:**
```typescript
interface UserTableProps {
  users: UserSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  filters: { role?: string; isActive?: boolean; search?: string };
  currentUserId: number;
  onFilterChange: (filters: Partial<UserTableProps["filters"]>) => void;
  onPageChange: (page: number) => void;
  onToggleRole: (userId: number, currentRole: string) => void;
  onToggleStatus: (userId: number, currentStatus: boolean) => void;
  isLoading?: boolean;
}
```

**Behavior:**
- **Filter bar:**
  - Role dropdown (All/ADMIN/SISWA)
  - Status dropdown (All/Aktif/Non-aktif)
  - Search input (name or email)
  - "Reset Filter" button
- **Table columns:** ID, Nama, Email, Role, Status, Actions
- **Status badge:**
  - Aktif: green badge "✅ Aktif"
  - Non-aktif: red badge "❌ Non-aktif"
- **Actions per row:**
  - Toggle Role button:
    - If SISWA: "Jadikan ADMIN"
    - If ADMIN: "Jadikan SISWA"
    - If userId === currentUserId: disabled + tooltip "Tidak dapat mengubah role sendiri"
  - Toggle Status button:
    - If active: "Nonaktifkan"
    - If inactive: "Aktifkan"
    - If userId === currentUserId: disabled + tooltip "Tidak dapat menonaktifkan akun sendiri"
- Both actions trigger confirmation modal (handled by parent)
- **Pagination:** same as QuestionTable
- **Loading:** skeleton rows
- **Empty:** "Tidak ada user yang sesuai"

---

## 6. AIConfigForm

**Purpose:** Form for configuring AI settings (API Key masked, Base URL, System Prompt).

**Props:**
```typescript
interface AIConfigFormProps {
  initialData: {
    apiKey: string; // masked: "••••••••ab3f"
    baseUrl: string;
    systemPrompt: string;
  };
  onSubmit: (data: { apiKey: string; baseUrl: string; systemPrompt: string }) => Promise<void>;
  isSubmitting?: boolean;
}
```

**Behavior:**
- **API Key field:**
  - Input type: password (masked by default)
  - Shows masked value from API: `••••••••ab3f`
  - Show/hide toggle (eye icon button)
  - If user starts typing: field clears, new value entered
  - If field left as-is (masked): client sends empty string → server keeps existing
  - Placeholder: "Masukkan API key baru (kosongkan jika tidak diubah)"
- **Base URL field:**
  - Text input, full value from API
  - Placeholder: "https://api.openai.com/v1"
- **System Prompt field:**
  - Textarea (multi-line), full value from API
  - Placeholder: "You are a helpful assistant..."
  - Resizable
- **Submit:** [Simpan] button
- **Validation:** Base URL and System Prompt required (not empty)
- **Success:** toast "Konfigurasi AI berhasil disimpan"
- **Error:** toast "Gagal menyimpan konfigurasi"

---

## 7. ExamConfigForm

**Purpose:** Form for configuring exam default batch size.

**Props:**
```typescript
interface ExamConfigFormProps {
  initialData: { defaultBatchSize: number };
  onSubmit: (data: { defaultBatchSize: number }) => Promise<void>;
  isSubmitting?: boolean;
}
```

**Behavior:**
- **Default Batch Size field:**
  - Number input
  - Min: 10, Max: 30
  - Default: 10
  - Helper text: "Jumlah soal per batch untuk sesi exam baru. Nilai ini dapat diubah oleh siswa saat setup exam."
- **Submit:** [Simpan] button
- **Validation:** 10 ≤ value ≤ 30
- **Error:** inline "Batch size harus antara 10 dan 30"
- **Success:** toast "Konfigurasi exam berhasil disimpan"

---

## 8. DBHealthCard

**Purpose:** Display database connection health and statistics.

**Props:**
```typescript
interface DBHealthCardProps {
  data: {
    status: "connected" | "disconnected";
    latency: string;
    stats: {
      totalQuestions: number | string;
      totalUsers: number | string;
      totalSessions: number | string;
      totalAttempts: number | string;
    };
  };
  isLoading?: boolean;
  onRefresh: () => void;
  lastUpdated: Date;
}
```

**Behavior:**
- **Connection status:**
  - Connected: green "✅ Connected"
  - Disconnected: red "❌ Disconnected"
- **Latency:** display value (e.g., "12ms") or "—" if disconnected
- **Stats grid:** 4 mini-cards (Soal, User, Sesi, Attempts)
  - Numbers with thousand separator when connected
  - "—" when disconnected
- **Refresh button:** [🔄 Refresh] — triggers manual fetch
- **Auto-refresh:** every 30 seconds (setInterval in parent)
- **Last updated:** "Last updated: HH:MM:SS"
- **Loading:** skeleton card
- **Disconnected state:** warning message "⚠️ Database tidak dapat dijangkau" + retry button

---

## Shared Components (Reuse)

### KatexRenderer
- Already defined in Study/Exam mode
- Location: `components/shared/KatexRenderer.tsx`
- Used in QuestionForm for live preview of content and explanation

### StatsCard
- Already defined in History & Analitik module
- Location: `components/history/StatsCard.tsx`
- Can be reused for AdminStatsOverview (same props interface)
- Or create admin-specific copy if styling differs

### Confirmation Modal
- Generic confirmation modal (shadcn/ui Dialog)
- Used for: delete question, toggle user role, toggle user status
- Props: title, message, confirmText, cancelText, onConfirm, onCancel

---

## Toast Notifications

All CRUD operations should show toast notifications:

| Action | Success Toast | Error Toast |
|---|---|---|
| Add Question | "Soal berhasil ditambahkan" | "Gagal menambah soal" |
| Edit Question | "Soal berhasil diperbarui" | "Gagal memperbarui soal" |
| Delete Question | "Soal berhasil dihapus" | "Gagal menghapus soal" |
| Toggle User Role | "Role user berhasil diubah" | "Gagal mengubah role" |
| Toggle User Status | "Status user berhasil diubah" | "Gagal mengubah status" |
| Save AI Config | "Konfigurasi AI berhasil disimpan" | "Gagal menyimpan konfigurasi" |
| Save Exam Config | "Konfigurasi exam berhasil disimpan" | "Gagal menyimpan konfigurasi" |

Uses shadcn/ui Toast component.

---

## Page Integration

### Admin Pages Structure

```
app/(pages)/admin/
  layout.tsx              → AdminLayout wrapper (server component, checks auth)
  page.tsx                → Dashboard home (AdminStatsOverview)
  questions/
    page.tsx              → Question bank list (QuestionTable)
    new/
      page.tsx            → Add question form (QuestionForm)
    [id]/
      edit/
        page.tsx          → Edit question form (QuestionForm with initialData)
  import/
    page.tsx              → Redirect to Content Processing module
  users/
    page.tsx              → User management (UserTable)
  config/
    ai/
      page.tsx            → AI configuration (AIConfigForm)
    exam/
      page.tsx            → Exam configuration (ExamConfigForm)
  diagnostics/
    page.tsx              → DB diagnostics (DBHealthCard)
```

### Dashboard Page Example

```typescript
// app/(pages)/admin/page.tsx

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useFetch("/api/admin/stats");

  return (
    <AdminLayout activePage="dashboard">
      <h1>Dashboard</h1>
      <AdminStatsOverview stats={stats} isLoading={isLoading} />
      <div className="flex gap-4 mt-6">
        <Link href="/admin/questions/new">
          <Button>📝 Tambah Soal</Button>
        </Link>
        <Link href="/admin/import">
          <Button>📤 Import Soal</Button>
        </Link>
      </div>
    </AdminLayout>
  );
}
```

### Questions Page Example

```typescript
// app/(pages)/admin/questions/page.tsx

export default function AdminQuestionsPage() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const { data, isLoading } = useFetch(`/api/admin/questions?page=${page}&limit=10&${qs(filters)}`);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  return (
    <AdminLayout activePage="questions">
      <h1>Bank Soal</h1>
      <QuestionTable
        questions={data?.questions}
        pagination={data?.pagination}
        filters={filters}
        onFilterChange={(f) => { setFilters({ ...filters, ...f }); setPage(1); }}
        onPageChange={setPage}
        onEdit={(id) => router.push(`/admin/questions/${id}/edit`)}
        onDelete={(id) => setDeleteTarget(id)}
        isLoading={isLoading}
      />
      {deleteTarget && (
        <ConfirmModal
          title="Konfirmasi Hapus"
          message="Yakin ingin menghapus soal ini?"
          onConfirm={async () => {
            await apiDelete(`/api/admin/questions/${deleteTarget}`);
            setDeleteTarget(null);
            refetch();
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AdminLayout>
  );
}
```
