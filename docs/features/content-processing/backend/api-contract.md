# API Contract — CONTENT PROCESSING Module

## Endpoints

### 1. POST /api/admin/import/preview

Upload and parse a file, returning validated question objects for preview.

**Auth:** Required (ADMIN)

**Request:** `multipart/form-data`
```
file: <uploaded file (.csv, .json, .xml)>
```

**Validation:**
| Field | Rule |
|---|---|
| file | Required, max 5MB |
| Extension | .csv, .json, or .xml |

**Response 200 (parse success):**
```json
{
  "success": true,
  "data": {
    "totalParsed": 50,
    "validCount": 45,
    "invalidCount": 5,
    "questions": [
      {
        "index": 0,
        "isValid": true,
        "errors": [],
        "question": {
          "tingkat": "SMA",
          "level": "OSNP",
          "matpel": "Matematika",
          "questionType": "MULTIPLE_CHOICE",
          "content": "Hitung nilai dari $\\int_0^1 x^2 \\, dx$",
          "explanation": "Integral dari $x^2$ adalah $\\frac{x^3}{3}$...",
          "options": ["1/3", "1/2", "1", "0"],
          "correctOption": 0,
          "acceptableAnswers": [],
          "imageUrl": null
        }
      },
      {
        "index": 1,
        "isValid": false,
        "errors": ["Field explanation wajib diisi"],
        "question": {
          "tingkat": "SMA",
          "level": "OSNP",
          "matpel": "Fisika",
          "questionType": "SHORT_ANSWER",
          "content": "Berapa kecepatan cahaya?",
          "explanation": "",
          "options": [],
          "correctOption": null,
          "acceptableAnswers": ["3e8"],
          "imageUrl": null
        }
      }
    ]
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 400 | "File wajib diupload" |
| 400 | "Format file tidak didukung. Gunakan .csv, .json, atau .xml" |
| 400 | "Ukuran file maksimal 5MB" |
| 400 | "File kosong" |
| 400 | "Format CSV tidak valid: {detail}" |
| 400 | "Format JSON tidak valid: {detail}" |
| 400 | "Format XML tidak valid: {detail}" |
| 401 | "Unauthorized" |
| 403 | "Forbidden: admin access required" |

---

### 2. POST /api/admin/import/confirm

Save selected questions to database.

**Auth:** Required (ADMIN)

**Request:**
```json
{
  "questions": [
    {
      "tingkat": "SMA",
      "level": "OSNP",
      "matpel": "Matematika",
      "questionType": "MULTIPLE_CHOICE",
      "content": "Hitung nilai dari $\\int_0^1 x^2 \\, dx$",
      "explanation": "Integral dari $x^2$ adalah $\\frac{x^3}{3}$...",
      "options": ["1/3", "1/2", "1", "0"],
      "correctOption": 0,
      "acceptableAnswers": [],
      "imageUrl": null
    }
  ]
}
```

**Validation:**
| Field | Rule |
|---|---|
| questions | Required, array, min 1 |
| Each question | Re-validated server-side (same rules as preview) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "imported": 45
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 400 | "Tidak ada soal untuk diimport" |
| 400 | "Validasi gagal: soal {index} - {error}" |
| 500 | "Import gagal: {db error}. Tidak ada soal yang disimpan." |
| 401 | "Unauthorized" |
| 403 | "Forbidden: admin access required" |

---

### 3. GET /api/admin/import/template/[format]

Download a template file for the specified format.

**Auth:** Required (ADMIN)

**Path Parameters:**
| Param | Rule |
|---|---|
| format | Required, enum: csv, json, xml |

**Response 200:**
- Content-Type: `text/csv` | `application/json` | `application/xml`
- Content-Disposition: `attachment; filename="template-import.{format}"`
- Body: template file content

**CSV Template:**
```csv
tingkat,level,matpel,questionType,content,options,correctOption,acceptableAnswers,explanation
SMA,OSNP,Matematika,MULTIPLE_CHOICE,"Hitung nilai dari $\int_0^1 x^2 \, dx$","[""1/3"",""1/2"",""1"",""0""]",0,[],"Integral dari $x^2$ adalah $\frac{x^3}{3}$, evaluasi dari 0 ke 1 memberikan $\frac{1}{3}$."
SMA,OSNP,Fisika,SHORT_ANSWER,"Berapa kecepatan cahaya dalam ruang hampa (dalam m/s)?",[],null,"[""3e8"",""300000000""]","Kecepatan cahaya adalah $3 \times 10^8$ m/s."
SMA,OSNP,Matematika,ESSAY,"Sebuah bola dilempar vertikal ke atas dengan kecepatan awal $20 \text{ m/s}$. Berapa ketinggian maksimum? (g = 10 m/s²)",[],null,"[""20""]","$h = \frac{v_0^2}{2g} = \frac{400}{20} = 20$ meter."
```

**JSON Template:**
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

**XML Template:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<questions>
  <question>
    <tingkat>SMA</tingkat>
    <level>OSNP</level>
    <matpel>Matematika</matpel>
    <questionType>MULTIPLE_CHOICE</questionType>
    <content>Hitung nilai dari $\int_0^1 x^2 \, dx$</content>
    <options>["1/3", "1/2", "1", "0"]</options>
    <correctOption>0</correctOption>
    <acceptableAnswers>[]</acceptableAnswers>
    <explanation>Integral dari $x^2$ adalah $\frac{x^3}{3}$, evaluasi dari 0 ke 1 memberikan $\frac{1}{3}$.</explanation>
  </question>
  <question>
    <tingkat>SMA</tingkat>
    <level>OSNP</level>
    <matpel>Fisika</matpel>
    <questionType>SHORT_ANSWER</questionType>
    <content>Berapa kecepatan cahaya dalam ruang hampa (dalam m/s)?</content>
    <options>[]</options>
    <correctOption>null</correctOption>
    <acceptableAnswers>["3e8", "300000000", "3x10^8"]</acceptableAnswers>
    <explanation>Kecepatan cahaya dalam ruang hampa adalah tepat 299.792.458 m/s, dibulatkan menjadi $3 \times 10^8$ m/s.</explanation>
  </question>
  <question>
    <tingkat>SMA</tingkat>
    <level>OSNP</level>
    <matpel>Matematika</matpel>
    <questionType>ESSAY</questionType>
    <content>Sebuah bola dilempar vertikal ke atas dengan kecepatan awal $20 \text{ m/s}$. Berapa ketinggian maksimum? (g = 10 m/s²)</content>
    <options>[]</options>
    <correctOption>null</correctOption>
    <acceptableAnswers>["20"]</acceptableAnswers>
    <explanation>Dengan $v_0 = 20$ m/s dan $g = 10$ m/s², ketinggian maksimum adalah $h = \frac{v_0^2}{2g} = \frac{400}{20} = 20$ meter.</explanation>
  </question>
</questions>
```

**Errors:**
| Status | Error |
|---|---|
| 400 | "Format template tidak valid. Gunakan csv, json, atau xml" |
| 401 | "Unauthorized" |
| 403 | "Forbidden: admin access required" |

---

## Summary Table

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/admin/import/preview | Upload + parse + validate file |
| POST | /api/admin/import/confirm | Save selected questions to DB |
| GET | /api/admin/import/template/[format] | Download template file |
