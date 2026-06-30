# Component Guidelines — CONTENT PROCESSING Module

## Components List

| # | Component | Type | Location |
|---|---|---|---|
| 1 | FileUpload | Client | `components/content/FileUpload.tsx` |
| 2 | PreviewTable | Client | `components/content/PreviewTable.tsx` |
| 3 | ImportConfirmModal | Client | `components/content/ImportConfirmModal.tsx` |
| 4 | TemplateDownload | Client | `components/content/TemplateDownload.tsx` |
| 5 | AIPromptHelper | Client | `components/content/AIPromptHelper.tsx` |

---

## 1. FileUpload

**Purpose:** Drag & drop file upload area.

**Props:**
```typescript
interface FileUploadProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
}
```

**Behavior:**
- Drag & drop zone with dashed border
- Click to browse (hidden `<input type="file">`)
- Accept: `.csv,.json,.xml`
- Max file size: 5MB (client-side check, server enforces too)
- On file selected: call onFileSelected
- Loading state: spinner + "Memproses file..."
- Error state: red border + error message + "Coba Lagi" button
- Formats hint: "Format: .csv, .json, .xml. Max: 5MB"

---

## 2. PreviewTable

**Purpose:** Display parsed questions with validation status and selection checkboxes.

**Props:**
```typescript
interface PreviewTableProps {
  questions: Array<{
    index: number;
    isValid: boolean;
    errors: string[];
    question: {
      tingkat: string;
      level: string;
      matpel: string;
      questionType: string;
      content: string;
    };
  }>;
  onImport: (selectedQuestions: SanitizedQuestion[]) => void;
  isImporting?: boolean;
}
```

**State:**
```typescript
const [selected, setSelected] = useState<Set<number>>(new Set(
  questions.filter(q => q.isValid).map(q => q.index)
));
const [currentPage, setCurrentPage] = useState(0);
const pageSize = 50;
```

**Behavior:**
- Table columns: checkbox, #, tingkat, level, matpel, questionType, content (truncated 50 chars), status
- Valid rows: green background, checked by default
- Invalid rows: red background, unchecked by default, error message below row
- Toggle checkbox per row
- "Select All Valid" button: check all valid rows
- "Deselect All" button: uncheck all
- Summary bar: "X soal valid, Y soal error, Z dipilih untuk import"
- Pagination: 50 rows per page
- "Import Z Soal" button: calls onImport with selected questions
- Content truncated with ellipsis, full content on hover (tooltip)

---

## 3. ImportConfirmModal

**Purpose:** Confirmation before importing.

**Props:**
```typescript
interface ImportConfirmModalProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**Behavior:**
- Display: "Anda akan mengimport {count} soal."
- Warning text about irreversibility
- [Batal] and [Import] buttons
- If isLoading: disable buttons, spinner on Import
- Closes on Batal

---

## 4. TemplateDownload

**Purpose:** Download template buttons for CSV/JSON/XML.

**Props:**
```typescript
interface TemplateDownloadProps {}
```

**Behavior:**
- 3 buttons: [CSV] [JSON] [XML]
- On click: redirect to GET /api/admin/import/template/[format]
- Triggers browser download via `window.location.href` or `<a>` element
- No loading state needed (instant redirect)

---

## 5. AIPromptHelper

**Purpose:** Display static AI prompt with copy-to-clipboard functionality.

**Props:**
```typescript
interface AIPromptHelperProps {}
```

**State:**
```typescript
const [copied, setCopied] = useState(false);
```

**Behavior:**
- Read-only textarea containing the static AI prompt (see below)
- Scrollable if content is long
- "Copy AI Prompt" button below textarea
- On click: `navigator.clipboard.writeText(STATIC_AI_PROMPT)`
- Show toast "Prompt berhasil disalin" for 2 seconds
- Button text changes to "✓ Tersalin" temporarily

### Static AI Prompt Text

The following text MUST be used verbatim in the component:

```
Kamu adalah asisten konversi soal. Tugasmu adalah mengkonversi soal-soal dari dokumen yang diberikan ke format JSON standar untuk platform SoaLatihan.

## Format Output

Output HARUS berupa array JSON yang valid, tanpa markdown code blocks, tanpa penjelasan tambahan. Setiap elemen array merepresentasikan satu soal.

## Schema JSON

Setiap soal harus memiliki struktur berikut:

{
  "tingkat": "SD" | "SMP" | "SMA",
  "level": "OSNK" | "OSNP" | "SEMIFINAL" | "FINAL",
  "matpel": "Nama mata pelajaran (contoh: Matematika, Fisika, Kimia)",
  "questionType": "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY",
  "content": "Teks soal dalam plain text. Gunakan $...$ untuk inline math dan $$...$$ untuk display math.",
  "options": [],
  "correctOption": null,
  "acceptableAnswers": [],
  "explanation": "Pembahasan jawaban. Gunakan LaTeX untuk math."
}

## Aturan per Question Type

### MULTIPLE_CHOICE
- "options": array of string, minimal 2 pilihan. Contoh: ["A", "B", "C", "D"]
- "correctOption": integer index (0-based) dari jawaban benar. Contoh: 0 untuk pilihan pertama.
- "acceptableAnswers": [] (kosong)

### SHORT_ANSWER
- "options": [] (kosong)
- "correctOption": null
- "acceptableAnswers": array of string, minimal 1. Contoh: ["3e8", "300000000"]. Sertakan variasi format jawaban yang diterima.

### ESSAY
- "options": [] (kosong)
- "correctOption": null
- "acceptableAnswers": array dengan 1 elemen berupa angka (string). Contoh: ["20"]. Jawaban harus berupa angka final saja, bukan cara pengerjaan.

## Aturan LaTeX

- Inline math: $...$ contoh: $\frac{1}{2}$
- Display math: $$...$$ contoh: $$\int_0^1 x^2 \, dx$$
- Jangan gunakan \( \) atau \[ \]
- Escape backslash di JSON: \\frac bukan \frac

## Contoh Output

[
  {
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Matematika",
    "questionType": "MULTIPLE_CHOICE",
    "content": "Hitung nilai dari $\\int_0^1 x^2 \\, dx$",
    "options": ["1/3", "1/2", "1", "0"],
    "correctOption": 0,
    "acceptableAnswers": [],
    "explanation": "Integral dari $x^2$ adalah $\\frac{x^3}{3}$, evaluasi dari 0 ke 1 memberikan $\\frac{1}{3}$."
  },
  {
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Fisika",
    "questionType": "SHORT_ANSWER",
    "content": "Berapa kecepatan cahaya dalam ruang hampa (dalam m/s)?",
    "options": [],
    "correctOption": null,
    "acceptableAnswers": ["3e8", "300000000", "3x10^8"],
    "explanation": "Kecepatan cahaya dalam ruang hampa adalah tepat 299.792.458 m/s, dibulatkan menjadi $3 \\times 10^8$ m/s."
  },
  {
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Matematika",
    "questionType": "ESSAY",
    "content": "Sebuah bola dilempar vertikal ke atas dengan kecepatan awal $20 \\text{ m/s}$. Berapa ketinggian maksimum yang dicapai bola? (g = 10 m/s²)",
    "options": [],
    "correctOption": null,
    "acceptableAnswers": ["20"],
    "explanation": "Dengan $v_0 = 20$ m/s dan $g = 10$ m/s², ketinggian maksimum adalah $h = \\frac{v_0^2}{2g} = \\frac{400}{20} = 20$ meter."
  }
]

## Instruksi

1. Baca dokumen soal yang diberikan.
2. Identifikasi setiap soal beserta jawaban dan pembahasannya.
3. Konversi ke format JSON di atas.
4. Tentukan questionType yang sesuai (MULTIPLE_CHOICE jika ada pilihan, SHORT_ANSWER jika jawaban singkat teks, ESSAY jika jawaban berupa angka final).
5. Pastikan LaTeX sudah di-escape dengan benar untuk JSON (double backslash).
6. Output HANYA array JSON, tanpa teks lain.
```

### Component Implementation

```typescript
const STATIC_AI_PROMPT = `Kamu adalah asisten konversi soal...`; // Full text above

export function AIPromptHelper() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(STATIC_AI_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <textarea readOnly value={STATIC_AI_PROMPT} rows={10} />
      <button onClick={handleCopy}>
        {copied ? "✓ Tersalin" : "📋 Copy AI Prompt"}
      </button>
    </div>
  );
}
```

---

## JSON Import Format (Reference)

The exact JSON format that must be accepted by the import system:

```json
[
  {
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Matematika",
    "questionType": "MULTIPLE_CHOICE",
    "content": "Hitung nilai dari $\\int_0^1 x^2 \\, dx$",
    "options": ["1/3", "1/2", "1", "0"],
    "correctOption": 0,
    "acceptableAnswers": [],
    "explanation": "Integral dari $x^2$ adalah $\\frac{x^3}{3}$, evaluasi dari 0 ke 1 memberikan $\\frac{1}{3}$."
  },
  {
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Fisika",
    "questionType": "SHORT_ANSWER",
    "content": "Berapa kecepatan cahaya dalam ruang hampa (dalam m/s)?",
    "options": [],
    "correctOption": null,
    "acceptableAnswers": ["3e8", "300000000", "3x10^8"],
    "explanation": "Kecepatan cahaya dalam ruang hampa adalah tepat 299.792.458 m/s, dibulatkan menjadi $3 \\times 10^8$ m/s."
  },
  {
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Matematika",
    "questionType": "ESSAY",
    "content": "Sebuah bola dilempar vertikal ke atas dengan kecepatan awal $20 \\text{ m/s}$. Berapa ketinggian maksimum yang dicapai bola? (g = 10 m/s²)",
    "options": [],
    "correctOption": null,
    "acceptableAnswers": ["20"],
    "explanation": "Dengan $v_0 = 20$ m/s dan $g = 10$ m/s², ketinggian maksimum adalah $h = \\frac{v_0^2}{2g} = \\frac{400}{20} = 20$ meter."
  }
]
```

### Field Specifications

| Field | Type | Required | Description |
|---|---|---|---|
| tingkat | string | ✅ | Enum: "SD", "SMP", "SMA" |
| level | string | ✅ | Enum: "OSNK", "OSNP", "SEMIFINAL", "FINAL" |
| matpel | string | ✅ | Mata pelajaran, non-empty |
| questionType | string | ✅ | Enum: "MULTIPLE_CHOICE", "SHORT_ANSWER", "ESSAY" |
| content | string | ✅ | Soal text, non-empty. LaTeX: `$...$` and `$$...$$` |
| options | string[] | MC only | Array of options, min 2. `[]` for SA/ESSAY |
| correctOption | number\|null | MC only | 0-based index. `null` for SA/ESSAY |
| acceptableAnswers | string[] | SA/ESSAY only | Min 1. `[]` for MC. ESSAY: numeric string |
| explanation | string | ✅ | Pembahasan, non-empty. LaTeX supported. |

### Notes

- `imageUrl` is NOT settable via import. It defaults to `null`.
- HTML tags in any field will be stripped during sanitization.
- LaTeX notation is preserved (not stripped).
- Backslashes in LaTeX must be escaped in JSON: `\\frac` not `\frac`.
