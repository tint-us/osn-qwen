# Business Rules — CONTENT PROCESSING Module

## BR-CONTENT-01: File Upload

| Aturan | Keterangan |
|---|---|
| Format file | .csv, .json, .xml |
| Max file size | 5MB |
| Upload method | Drag & drop atau browse |
| Multiple files | Tidak. Satu file per upload. |
| Access | ADMIN only |

## BR-CONTENT-02: Parse Rules

| Aturan | Keterangan |
|---|---|
| CSV | Header row wajib. Header = field names. papaparse dengan dynamicTyping. |
| JSON | Harus array of objects. Setiap object = 1 soal. |
| XML | Root element `<questions>`, child `<question>`. fast-xml-parser. |
| Parse error | Return error message, tidak lanjut ke preview. |
| Empty file | Error "File kosong" |

## BR-CONTENT-03: Mandatory Fields

| Field | Wajib | Keterangan |
|---|---|---|
| tingkat | ✅ | Enum: SD, SMP, SMA |
| level | ✅ | Enum: OSNK, OSNP, SEMIFINAL, FINAL |
| matpel | ✅ | String, tidak kosong |
| questionType | ✅ | Enum: MULTIPLE_CHOICE, SHORT_ANSWER, ESSAY |
| content | ✅ | String, tidak kosong |
| explanation | ✅ | String, tidak kosong |
| options | MC only | Array of strings, min 2 |
| correctOption | MC only | Integer, 0-based index, < options.length |
| acceptableAnswers | SA/ESSAY only | Array of strings, min 1 |
| imageUrl | ❌ | Tidak didukung via import (null) |

## BR-CONTENT-04: Validation per QuestionType

### MULTIPLE_CHOICE
| Aturan | Keterangan |
|---|---|
| options | Array, min 2 elemen, setiap elemen string non-empty |
| correctOption | Integer, 0-based, < options.length |
| acceptableAnswers | Dihapus/ignored (diset ke []) |

### SHORT_ANSWER
| Aturan | Keterangan |
|---|---|
| options | Dihapus/ignored (diset ke []) |
| correctOption | Dihapus/ignored (diset ke null) |
| acceptableAnswers | Array, min 1 elemen, setiap elemen string non-empty |

### ESSAY
| Aturan | Keterangan |
|---|---|
| options | Diharuskan kosong atau diabaikan (diset ke []) |
| correctOption | Dihapus/ignored (diset ke null) |
| acceptableAnswers | Array, min 1 elemen, elemen[0] harus numeric string |

## BR-CONTENT-05: Preview & Selection

| Aturan | Keterangan |
|---|---|
| Default checkbox | Valid → checked, Invalid → unchecked |
| Toggle | Admin bisa toggle checkbox per baris |
| Select All Valid | Check semua baris valid |
| Deselect All | Uncheck semua |
| Import button | Menampilkan jumlah checked: "Import Z Soal" |
| Pagination | Jika > 100 baris, pagination 50/page |

## BR-CONTENT-06: Import (Save)

| Aturan | Keterangan |
|---|---|
| Re-validate | Server re-validasi sebelum insert (safety) |
| Sanitize | Strip HTML tags dari content, options, explanation |
| Transaction | Bulk insert dalam 1 transaction (all-or-nothing) |
| Duplicate check | Tidak ada. Soal duplikat diizinkan (content bisa sama). |
| imageUrl | Diset null untuk soal import |
| Success | Return jumlah soal yang diinsert |
| Error | Rollback, return error message |

## BR-CONTENT-07: Template

| Aturan | Keterangan |
|---|---|
| Format | 3 template: CSV, JSON, XML |
| Konten | 3 contoh soal: 1 MC, 1 SA, 1 ESSAY |
| Download | GET /api/admin/import/template/[format] |
| Content-Type | text/csv, application/json, application/xml |
| Filename | template-import.csv, template-import.json, template-import.xml |

## BR-CONTENT-08: AI Prompt

| Aturan | Keterangan |
|---|---|
| Type | Static text (hardcoded di component) |
| Purpose | Convert PDF/dokumen ke JSON format import |
| Copy | navigator.clipboard.writeText |
| Display | Read-only textarea di halaman import |
| Content | Instruksi format + JSON schema + contoh output |

## BR-CONTENT-09: Sanitization

| Aturan | Keterangan |
|---|---|
| Strip HTML | Semua HTML tags dihapus: /<[^>]*>/g |
| Preserve LaTeX | $...$ dan $$...$$ tetap utuh |
| Trim | Whitespace di-trim di awal/akhir |
| Script removal | <script> tags dan content dihapus sepenuhnya |
| Apply to | content, options[], explanation, acceptableAnswers[] |
