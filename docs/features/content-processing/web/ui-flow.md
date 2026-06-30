# UI Flow — CONTENT PROCESSING Module

## 1. Import Page (/admin/questions/import)

### Initial State
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Import Soal                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              Upload File                            │     │
│  │                                                      │     │
│  │  ┌─────────────────────────────────────────────┐     │     │
│  │  │                                             │     │     │
│  │  │     📁 Drag & drop file di sini              │     │     │
│  │  │        atau klik untuk browse               │     │     │
│  │  │                                             │     │     │
│  │  │     Format: .csv, .json, .xml               │     │     │
│  │  │     Max: 5MB                                │     │     │
│  │  │                                             │     │     │
│  │  └─────────────────────────────────────────────┘     │     │
│  │                                                      │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                             │
│  ── atau ──                                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Download Template                                  │     │
│  │  [CSV]  [JSON]  [XML]                              │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                             │
│  ── atau ──                                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  AI Prompt Helper                                   │     │
│  │  ┌─────────────────────────────────────────────┐    │     │
│  │  │  [Static prompt text — read-only textarea]  │    │     │
│  │  │                                              │    │     │
│  │  │  (scrollable)                                │    │     │
│  │  │                                              │    │     │
│  │  └─────────────────────────────────────────────┘    │     │
│  │  [Copy AI Prompt]                                   │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Upload Error State
```
┌─────────────────────────────────────────────────────┐
│  Upload File                                        │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │                                              │    │
│  │     ❌ Format file tidak didukung            │    │
│  │        Gunakan .csv, .json, atau .xml        │    │
│  │                                              │    │
│  │     [Coba Lagi]                              │    │
│  │                                              │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### States
| State | Condition | UI |
|---|---|---|
| Empty | No file uploaded | Upload area + template + AI prompt |
| Uploading | File being sent | Progress bar |
| Parsing | Server parsing file | Spinner "Memproses file..." |
| Error | Parse/validation error | Error message + "Coba Lagi" |
| Preview | Parse success | Preview table |

## 2. Preview Table

### Desktop Layout
```
┌──────────────────────────────────────────────────────────────────┐
│  Preview: 50 soal diparsed — 45 valid, 5 error, 45 dipilih      │
│                                                                   │
│  [Select All Valid]  [Deselect All]          [Import 45 Soal]   │
├──────────────────────────────────────────────────────────────────┤
│ ☑ │ # │ Tingkat │ Level │ Matpel    │ Type │ Content... │ Status│
├───┼───┼──────────┼───────┼───────────┼──────┼────────────┼──────┤
│ ☑ │ 1 │ SMA      │ OSNP  │ Matematika│ MC   │ Hitung...  │ ✅    │
│ ☑ │ 2 │ SMA      │ OSNP  │ Fisika    │ SA   │ Berapa...  │ ✅    │
│ ☐ │ 3 │ SMA      │ OSNP  │ Kimia     │ MC   │ Manakah... │ ❌    │
│   │   │          │       │           │      │            │ Error:│
│   │   │          │       │           │      │            │ correct│
│   │   │          │       │           │      │            │ Option│
│   │   │          │       │           │      │            │ out of│
│   │   │          │       │           │      │            │ bounds│
│ ☑ │ 4 │ SMA      │ OSNP  │ Matematika│ ESSAY│ Sebuah...  │ ✅    │
│ ☑ │ 5 │ SMA      │ OSNP  │ Fisika    │ MC   │ Berapa...  │ ✅    │
│   │   │          │       │           │      │            │       │
│  ... (50 rows, pagination 50/page)                              │
│                                                                   │
│  ◀ Prev  Page 1 of 1  Next ▶                                    │
├──────────────────────────────────────────────────────────────────┤
│                                            [Import 45 Soal]     │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌──────────────────────────────┐
│ Preview: 45 valid, 5 error   │
│ [Select All] [Deselect All]  │
│                              │
│ ┌──────────────────────────┐ │
│ │ ☑ #1 SMA/OSNP/Matematika│ │
│ │ MC: Hitung nilai dari... │ │
│ │ ✅ Valid                 │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ ☐ #3 SMA/OSNP/Kimia     │ │
│ │ MC: Manakah yang...      │ │
│ │ ❌ correctOption out of  │ │
│ │    bounds                │ │
│ └──────────────────────────┘ │
│                              │
│ ... (scrollable)             │
│                              │
│ Page 1 of 1                  │
│                              │
│ [Import 45 Soal]             │
└──────────────────────────────┘
```

### States
| State | Condition | UI |
|---|---|---|
| Valid row | isValid=true | Green bg, checkbox checked, ✅ icon |
| Invalid row | isValid=false | Red bg, checkbox unchecked, ❌ icon + error msg |
| Selected | Checkbox toggled | Checkbox checked (regardless of valid/invalid) |
| Importing | Submit in progress | Disable all, spinner |

## 3. Import Confirmation Modal

```
┌───────────────────────────────────┐
│  Konfirmasi Import                 │
├───────────────────────────────────┤
│                                   │
│  Anda akan mengimport 45 soal.    │
│                                   │
│  Pastikan data sudah benar.       │
│  Setelah import, soal akan        │
│  tersimpan di bank soal.          │
│                                   │
│  [Batal]         [Import]         │
└───────────────────────────────────┘
```

## 4. Import Success State

```
┌───────────────────────────────────┐
│  ✅ Import Berhasil               │
├───────────────────────────────────┤
│                                   │
│  45 soal berhasil diimport.       │
│                                   │
│  Mengalihkan ke daftar soal...    │
│                                   │
│  [Lihat Daftar Soal]              │
└───────────────────────────────────┘
```
→ Auto-redirect to /admin/questions after 2 seconds

## 5. AI Prompt Section

```
┌─────────────────────────────────────────────────────┐
│  AI Prompt Helper                                    │
│                                                      │
│  Salin prompt di bawah, tempel ke AI eksternal      │
│  (ChatGPT, Claude, dll) bersama dokumen soal Anda   │
│  untuk mengkonversi ke format JSON.                  │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ Kamu adalah asisten konversi soal. Tugasmu  │    │
│  │ adalah mengkonversi soal-soal dari dokumen  │    │
│  │ yang diberikan ke format JSON standar...    │    │
│  │                                              │    │
│  │ (scrollable, read-only)                     │    │
│  │                                              │    │
│  │ ... [full prompt text] ...                   │    │
│  │                                              │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  [📋 Copy AI Prompt]                                │
│                                                      │
│  → Setelah copy: toast "Prompt berhasil disalin"    │
└─────────────────────────────────────────────────────┘
```
