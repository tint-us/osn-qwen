# Workflow — CONTENT PROCESSING Module

## 1. Import Flow (Main)

```
/admin/questions/import
  │
  ▼
Admin upload file (.csv, .json, .xml)
  │
  ▼
POST /api/admin/import/preview
  │ Body: FormData (file)
  │
  ▼
Server:
  │ 1. Validate file extension & size
  │ 2. Parse file sesuai format:
  │    - CSV: papaparse (header row → keys)
  │    - JSON: JSON.parse (expect array)
  │    - XML: fast-xml-parser
  │ 3. If parse error → return error, stop
  │ 4. Validate each question object:
  │    - Check mandatory fields
  │    - Check enum values
  │    - Check questionType-specific fields
  │ 5. Sanitize content (strip HTML, keep LaTeX)
  │ 6. Return: array of { question, isValid, errors[] }
  │
  ▼
Client: render preview tabel
  │ - Valid rows: green, checked
  │ - Invalid rows: red, unchecked, error messages
  │ - Admin toggle checkboxes
  │ - Summary: X valid, Y error, Z selected
  │
  ▼ Admin klik "Import Z Soal"
Modal konfirmasi: "Import Z soal?"
  │
  ▼ Admin klik "Import"
POST /api/admin/import/confirm
  │ Body: { questions: [...selected valid questions] }
  │
  ▼
Server:
  │ 1. Re-validate each question (safety)
  │ 2. Sanitize content again
  │ 3. Bulk insert via prisma.question.createMany()
  │ 4. Transaction: all-or-nothing
  │ 5. Return: { imported: Z }
  │
  ▼
Client: redirect to /admin/questions
  │ Toast: "Z soal berhasil diimport"
```

## 2. Template Download Flow

```
Admin klik "Download Template [CSV/JSON/XML]"
  │
  ▼
GET /api/admin/import/template/[format]
  │
  ▼
Server:
  │ 1. Generate template content (static string)
  │ 2. Set Content-Type & Content-Disposition headers
  │ 3. Return file
  │
  ▼
Browser: download file
```

## 3. AI Prompt Copy Flow

```
Admin klik "Copy AI Prompt"
  │
  ▼
Client:
  │ 1. navigator.clipboard.writeText(STATIC_AI_PROMPT)
  │ 2. Show toast "Prompt berhasil disalin"
  │
  ▼
Admin paste ke AI eksternal (ChatGPT, Claude, dll)
  │ → Upload PDF/dokumen soal
  │ → AI generate JSON sesuai schema
  │ → Admin copy JSON, save ke file
  │ → Upload file JSON ke halaman import
```

## 4. Parse Error Flow

```
POST /api/admin/import/preview
  │
  ├── Parse success → preview tabel
  │
  └── Parse error
      │
      ▼
      Return error:
      - CSV: "Format CSV tidak valid: {detail}"
      - JSON: "Format JSON tidak valid: {detail}"
      - XML: "Format XML tidak valid: {detail}"
      │
      ▼
      Client: tampilkan error di upload area
      Tombol "Coba Lagi" → reset upload area
```

## 5. Validation Detail

```
For each parsed question object:
  │
  ├── Missing mandatory field?
  │   → invalid: "Field {field} wajib diisi"
  │
  ├── tingkat not in [SD, SMP, SMA]?
  │   → invalid: "Tingkat harus SD/SMP/SMA"
  │
  ├── level not in [OSNK, OSNP, SEMIFINAL, FINAL]?
  │   → invalid: "Level harus OSNK/OSNP/SEMIFINAL/FINAL"
  │
  ├── questionType not in [MC, SA, ESSAY]?
  │   → invalid: "Tipe soal tidak valid"
  │
  ├── questionType = MULTIPLE_CHOICE?
  │   ├── options not array or length < 2?
  │   │   → invalid: "Options minimal 2 pilihan"
  │   ├── correctOption not integer or >= options.length?
  │   │   → invalid: "correctOption harus index valid (0-{max})"
  │   └── OK → valid
  │
  ├── questionType = SHORT_ANSWER?
  │   ├── acceptableAnswers not array or empty?
  │   │   → invalid: "acceptableAnswers minimal 1 jawaban"
  │   └── OK → valid
  │
  ├── questionType = ESSAY?
  │   ├── acceptableAnswers not array or empty?
  │   │   → invalid: "acceptableAnswers minimal 1 jawaban"
  │   ├── acceptableAnswers[0] not numeric?
  │   │   → invalid: "Jawaban essay harus berupa angka"
  │   └── OK → valid
  │
  └── All checks pass → valid
```

## 6. Sanitization Flow

```
Raw content from file
  │
  ▼
Strip HTML tags (regex: /<[^>]*>/g)
  │ - <script>, <iframe>, dll → removed
  │ - <b>, <i>, <div> → removed (plain text)
  │
  ▼
Preserve LaTeX notation
  │ - $...$ → preserved
  │ - $$...$$ → preserved
  │ - \frac, \int, dll → preserved
  │
  ▼
Trim whitespace
  │
  ▼
Sanitized content → ready for DB insert
```
