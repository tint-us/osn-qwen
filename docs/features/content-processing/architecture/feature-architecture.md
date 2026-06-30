# Feature Architecture — CONTENT PROCESSING Module

## 1. Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  CONTENT PROCESSING                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Import Page (Container)                 │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │ FileUpload   │  │ TemplateDownload│ │ AIPrompt  │ │   │
│  │  │ (drag&drop)  │  │ (CSV/JSON/XML)│  │ (copy)    │ │   │
│  │  └──────┬───────┘  └──────────────┘  └────────────┘ │   │
│  │         │                                              │   │
│  │         ▼                                              │   │
│  │  ┌──────────────────────────────────────────────┐     │   │
│  │  │            Preview Table                     │     │   │
│  │  │  ┌────────┐  ┌────────┐  ┌────────────────┐ │     │   │
│  │  │  │Checkbox│  │Question│  │ Error Message  │ │     │   │
│  │  │  │ per row│  │Summary │  │ (if invalid)   │ │     │   │
│  │  │  └────────┘  └────────┘  └────────────────┘ │     │   │
│  │  │  Pagination: 50/page                       │     │   │
│  │  └──────────────────────────────────────────────┘     │   │
│  │         │                                              │   │
│  │         ▼                                              │   │
│  │  ┌──────────────────────────────────────────────┐     │   │
│  │  │  [Import Z Soal] → ConfirmModal → Save       │     │   │
│  │  └──────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 2. Data Flow

```
┌──────────┐    FormData (file)    ┌────────────────┐
│  Client  │ ───────────────────▶  │   Server       │
│ (Upload) │                       │                │
└──────────┘                       │  1. Validate   │
                                   │     extension  │
                                   │  2. Parse file │
                                   │     (csv/json/ │
                                   │      xml)      │
                                   │  3. Validate   │
                                   │     each row   │
                                   │  4. Sanitize   │
                                   │     (strip HTML│
                                   │      keep LaTeX│
                                   │  5. Return     │
                                   │     preview    │
┌──────────┐  JSON: questions[]  ◀────────────────┘
│  Client  │
│ (Preview)│
└────┬─────┘
     │
     │ Admin selects rows + clicks "Import"
     ▼
┌──────────┐  JSON: selected[]   ┌────────────────┐
│  Client  │ ──────────────────▶ │   Server       │
│ (Confirm)│                     │  1. Re-validate│
└──────────┘                     │  2. Sanitize   │
                                 │  3. Bulk insert │
                                 │     (transaction│
                                 │  4. Return      │
                                 │     count       │
                      ◀──────────┘
┌──────────┐  JSON: {imported:Z}
│  Client  │
│ (Success)│ → redirect /admin/questions
└──────────┘
```

## 3. Parse Logic

### CSV Parsing (papaparse)

```typescript
import Papa from "papaparse";

function parseCSV(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,          // First row = field names
      dynamicTyping: false,  // Keep everything as strings
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parse error: ${results.errors[0].message}`));
          return;
        }
        resolve(results.data as Record<string, string>[]);
      },
      error: (err) => reject(new Error(`CSV parse error: ${err.message}`)),
    });
  });
}
```

### JSON Parsing

```typescript
function parseJSON(content: string): any[] {
  try {
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
      throw new Error("Format JSON tidak valid: expected array");
    }
    return data;
  } catch (err) {
    throw new Error(`Format JSON tidak valid: ${(err as Error).message}`);
  }
}
```

### XML Parsing (fast-xml-parser)

```typescript
import { XMLParser } from "fast-xml-parser";

function parseXML(content: string): any[] {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });
    const result = parser.parse(content);

    if (!result.questions || !result.questions.question) {
      throw new Error("Format XML tidak valid: root element harus <questions>");
    }

    const questions = Array.isArray(result.questions.question)
      ? result.questions.question
      : [result.questions.question];

    return questions;
  } catch (err) {
    throw new Error(`Format XML tidak valid: ${(err as Error).message}`);
  }
}
```

## 4. Validation Logic

```typescript
interface ValidatedQuestion {
  question: SanitizedQuestion;
  isValid: boolean;
  errors: string[];
}

interface SanitizedQuestion {
  tingkat: string;
  level: string;
  matpel: string;
  questionType: string;
  content: string;
  explanation: string;
  options: string[];
  correctOption: number | null;
  acceptableAnswers: string[];
  imageUrl: null;
}

function validateQuestion(raw: Record<string, any>): ValidatedQuestion {
  const errors: string[] = [];

  // Mandatory fields
  if (!raw.tingkat) errors.push("Field tingkat wajib diisi");
  if (!raw.level) errors.push("Field level wajib diisi");
  if (!raw.matpel) errors.push("Field matpel wajib diisi");
  if (!raw.questionType) errors.push("Field questionType wajib diisi");
  if (!raw.content) errors.push("Field content wajib diisi");
  if (!raw.explanation) errors.push("Field explanation wajib diisi");

  // Enum validation
  if (raw.tingkat && !["SD", "SMP", "SMA"].includes(raw.tingkat)) {
    errors.push("Tingkat harus SD/SMP/SMA");
  }
  if (raw.level && !["OSNK", "OSNP", "SEMIFINAL", "FINAL"].includes(raw.level)) {
    errors.push("Level harus OSNK/OSNP/SEMIFINAL/FINAL");
  }
  if (raw.questionType &&
      !["MULTIPLE_CHOICE", "SHORT_ANSWER", "ESSAY"].includes(raw.questionType)) {
    errors.push("Tipe soal tidak valid");
  }

  // questionType-specific validation
  if (raw.questionType === "MULTIPLE_CHOICE") {
    const options = Array.isArray(raw.options) ? raw.options : [];
    if (options.length < 2) {
      errors.push("Options minimal 2 pilihan");
    }
    const correctOption = Number(raw.correctOption);
    if (isNaN(correctOption) || correctOption < 0 ||
        correctOption >= options.length) {
      errors.push(`correctOption harus index valid (0-${options.length - 1})`);
    }
  } else if (raw.questionType === "SHORT_ANSWER") {
    const answers = Array.isArray(raw.acceptableAnswers) ? raw.acceptableAnswers : [];
    if (answers.length < 1) {
      errors.push("acceptableAnswers minimal 1 jawaban");
    }
  } else if (raw.questionType === "ESSAY") {
    const answers = Array.isArray(raw.acceptableAnswers) ? raw.acceptableAnswers : [];
    if (answers.length < 1) {
      errors.push("acceptableAnswers minimal 1 jawaban");
    }
    if (answers.length > 0 && isNaN(parseFloat(answers[0]))) {
      errors.push("Jawaban essay harus berupa angka");
    }
  }

  // Sanitize
  const sanitized: SanitizedQuestion = {
    tingkat: sanitizeString(raw.tingkat),
    level: sanitizeString(raw.level),
    matpel: sanitizeString(raw.matpel),
    questionType: sanitizeString(raw.questionType),
    content: sanitizeString(raw.content),
    explanation: sanitizeString(raw.explanation),
    options: raw.questionType === "MULTIPLE_CHOICE"
      ? (Array.isArray(raw.options) ? raw.options.map(sanitizeString) : [])
      : [],
    correctOption: raw.questionType === "MULTIPLE_CHOICE"
      ? Number(raw.correctOption) : null,
    acceptableAnswers:
      raw.questionType === "SHORT_ANSWER" || raw.questionType === "ESSAY"
        ? (Array.isArray(raw.acceptableAnswers)
            ? raw.acceptableAnswers.map(sanitizeString)
            : [])
        : [],
    imageUrl: null,
  };

  return {
    question: sanitized,
    isValid: errors.length === 0,
    errors,
  };
}
```

## 5. Sanitization Logic

```typescript
function sanitizeString(str: string): string {
  if (!str) return "";
  // Strip HTML tags
  let result = str.replace(/<[^>]*>/g, "");
  // Trim whitespace
  result = result.trim();
  return result;
}

// Note: LaTeX notation ($...$ and $$...$$) is preserved because
// the HTML strip regex only matches <...> patterns.
// $...$ does not contain < > so it's untouched.
```

## 6. Bulk Insert Logic

```typescript
import { prisma } from "@/lib/prisma";

async function bulkInsertQuestions(questions: SanitizedQuestion[]) {
  return prisma.$transaction(async (tx) => {
    const result = await tx.question.createMany({
      data: questions.map(q => ({
        tingkat: q.tingkat,
        level: q.level,
        matpel: q.matpel,
        questionType: q.questionType,
        content: q.content,
        imageUrl: null,
        options: q.options,
        correctOption: q.correctOption,
        acceptableAnswers: q.acceptableAnswers,
        explanation: q.explanation,
      })),
    });
    return result.count;
  });
}
```

## 7. Template Generation

```typescript
// Static template content

const CSV_TEMPLATE = `tingkat,level,matpel,questionType,content,options,correctOption,acceptableAnswers,explanation
SMA,OSNP,Matematika,MULTIPLE_CHOICE,"Hitung nilai dari $\\\\int_0^1 x^2 \\\\, dx$","[\"1/3\",\"1/2\",\"1\",\"0\"]",0,[],"Integral dari $x^2$ adalah $\\\\frac{x^3}{3}$, evaluasi dari 0 ke 1 memberikan $\\\\frac{1}{3}$."
SMA,OSNP,Fisika,SHORT_ANSWER,"Berapa kecepatan cahaya dalam ruang hampa (dalam m/s)?",[],null,"[\"3e8\",\"300000000\"]","Kecepatan cahaya adalah $3 \\\\times 10^8$ m/s."
SMA,OSNP,Matematika,ESSAY,"Sebuah bola dilempar vertikal ke atas dengan kecepatan awal $20 \\\\text{ m/s}$. Berapa ketinggian maksimum? (g = 10 m/s²)",[],null,"[\"20\"]","$h = \\\\frac{v_0^2}{2g} = \\\\frac{400}{20} = 20$ meter."`;

const JSON_TEMPLATE = `[ ... ]`; // See PRD section 5 for full JSON
const XML_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>...`;
```

## 8. File Size & Performance

| Operation | Target | Strategy |
|---|---|---|
| Parse 1000 rows | < 2s | papaparse stream mode for large CSV |
| Validate 1000 rows | < 500ms | Sync validation, no DB calls |
| Preview render 1000 rows | < 1s | Pagination 50/page |
| Bulk insert 1000 rows | < 5s | createMany in single transaction |
| Max file size | 5MB | Reject at upload |

## 9. Security

| Concern | Mitigation |
|---|---|
| XSS via content | Strip all HTML tags during sanitization |
| LaTeX injection | KaTeX renders in sandboxed mode (no HTML execution) |
| File type spoofing | Validate extension + content-type header |
| Large file DoS | 5MB limit enforced at server level |
| SQL injection | Prisma parameterized queries (no raw SQL) |
| Unauthorized access | Middleware checks ADMIN role on all endpoints |
