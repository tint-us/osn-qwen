# API Contract — STUDY MODE Module

## Endpoints

---

### 1. GET `/api/questions`

**Description:** Fetch soal dengan filter, urutan soal dan pilihan jawaban sudah diacak.

**Auth Required:** Yes — role `SISWA`

**Query Parameters:**
| Param | Type | Required | Keterangan |
|---|---|---|---|
| `tingkat` | `SD` \| `SMP` \| `SMA` | Yes | Tingkat pendidikan |
| `level` | `OSNK` \| `OSNP` \| `SEMIFINAL` \| `FINAL` | Yes | Level kompetisi |
| `matpel` | string (comma-separated) | Yes | Mata pelajaran, misal: `Fisika,Matematika` |

**Request Example:**
```
GET /api/questions?tingkat=SMA&level=OSNK&matpel=Fisika,Matematika
```

**Response Sukses (200) — Soal Ditemukan:**
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "tingkat": "SMA",
      "level": "OSNK",
      "matpel": "Fisika",
      "questionType": "MULTIPLE_CHOICE",
      "content": "Sebuah benda bergerak dengan kecepatan $v = 10 \\text{ m/s}$. Berapa jarak tempuhnya dalam 5 sekon?",
      "imageUrl": null,
      "options": ["25 m", "50 m", "10 m", "5 m"],
      "correctOption": null,
      "acceptableAnswers": [],
      "explanation": "Jarak = kecepatan × waktu = $10 \\times 5 = 50 \\text{ m}$"
    },
    {
      "id": 15,
      "tingkat": "SMA",
      "level": "OSNK",
      "matpel": "Matematika",
      "questionType": "SHORT_ANSWER",
      "content": "Berapa hasil dari $\\sqrt{144}$?",
      "imageUrl": null,
      "options": [],
      "correctOption": null,
      "acceptableAnswers": [],
      "explanation": "$\\sqrt{144} = 12$ karena $12^2 = 144$"
    }
  ]
}
```

**Note:** `correctOption` dan `acceptableAnswers` di-set ke `null`/`[]` di response. Jawaban benar tidak dikirim ke client sebelum submit. Server tetap menyimpan correctOption asli untuk grading.

**Response Sukses (200) — Tidak Ada Soal:**
```json
{
  "success": true,
  "data": []
}
```

**Response Error — Missing Filter (400):**
```json
{
  "success": false,
  "error": "Invalid filter"
}
```

**Response Error — Unauthorized (401):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Response Error — Forbidden (403):**
```json
{
  "success": false,
  "error": "Forbidden"
}
```

---

### 2. POST `/api/study/attempt`

**Description:** Submit jawaban soal, grading di server, simpan StudyAttempt, update streak.

**Auth Required:** Yes — role `SISWA`

**Request Body:**
```json
{
  "questionId": 42,
  "userAnswer": "1"
}
```

| Field | Type | Required | Keterangan |
|---|---|---|---|
| `questionId` | int | Yes | ID soal yang dijawab |
| `userAnswer` | string | Yes | Jawaban user. MC: index (string). SA: text. Essay: number (string). |

**Response Sukses (200) — Jawaban Benar:**
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "correctAnswer": "50 m",
    "explanation": "Jarak = kecepatan × waktu = $10 \\times 5 = 50 \\text{ m}$"
  }
}
```

**Response Sukses (200) — Jawaban Salah:**
```json
{
  "success": true,
  "data": {
    "isCorrect": false,
    "correctAnswer": "50 m",
    "explanation": "Jarak = kecepatan × waktu = $10 \\times 5 = 50 \\text{ m}$"
  }
}
```

**Response Sukses (200) — SHORT_ANSWER Example:**
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "correctAnswer": "12",
    "explanation": "$\\sqrt{144} = 12$ karena $12^2 = 144$"
  }
}
```

**Response Error — Validation (400):**
```json
{
  "success": false,
  "error": "Invalid input"
}
```

**Response Error — Question Not Found (404):**
```json
{
  "success": false,
  "error": "Soal tidak ditemukan"
}
```

**Response Error — Unauthorized (401):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Response Error — Forbidden (403):**
```json
{
  "success": false,
  "error": "Forbidden"
}
```

**Response Error — Server Error (500):**
```json
{
  "success": false,
  "error": "Terjadi kesalahan"
}
```

---

## Status Code Summary

| Endpoint | 200 | 400 | 401 | 403 | 404 | 500 |
|---|---|---|---|---|---|---|
| GET `/api/questions` | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| POST `/api/study/attempt` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Notes

- **Correct answer security:** `correctOption` dan `acceptableAnswers` TIDAK dikirim di GET /api/questions response. Server menyimpan nilai asli untuk grading saat POST /api/study/attempt.
- **Shuffle happens server-side:** Urutan soal dan pilihan jawaban diacak di server sebelum dikirim ke client.
- **No pagination:** Semua soal yang match filter dikirim sekaligus (client-side navigation antar soal).
