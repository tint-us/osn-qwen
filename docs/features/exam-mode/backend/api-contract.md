# API Contract — EXAM MODE Module

## Endpoints

### 1. POST /api/exam/sessions

Create a new exam session.

**Auth:** Required (SISWA)

**Request:**
```json
{
  "filter": {
    "tingkat": "SMA",
    "level": "OSNP",
    "matpels": ["Matematika", "Fisika"]
  },
  "batchSize": 10,
  "timerEnabled": true,
  "timerDuration": 30
}
```

**Validation:**
| Field | Rule |
|---|---|
| filter.tingkat | Required, enum: SD, SMP, SMA |
| filter.level | Required, enum: OSNK, OSNP, SEMIFINAL, FINAL |
| filter.matpels | Required, array of strings, min 1 |
| batchSize | Required, integer, 10-30 |
| timerEnabled | Required, boolean |
| timerDuration | Required if timerEnabled=true, integer, 1-180 |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "filter": {
      "tingkat": "SMA",
      "level": "OSNP",
      "matpels": ["Matematika", "Fisika"]
    },
    "totalQuestions": 50,
    "batchSize": 10,
    "totalBatches": 5,
    "currentBatchIndex": 0,
    "status": "ACTIVE",
    "timerEnabled": true,
    "timerDuration": 30
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 400 | "Filter wajib: tingkat, level, matpel" |
| 400 | "Batch size harus 10-30" |
| 400 | "Timer duration minimal 1 menit" |
| 400 | "Minimal 10 soal untuk memulai exam" |
| 400 | "Tidak ada soal untuk filter ini" |
| 400 | "Anda memiliki sesi aktif. Resume atau abandon terlebih dahulu." |
| 401 | "Unauthorized" |

---

### 2. GET /api/exam/sessions/active

Get the user's active (uncompleted) session, if any.

**Auth:** Required (SISWA)

**Response 200 (with active session):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "filter": { "tingkat": "SMA", "level": "OSNP", "matpels": ["Matematika"] },
    "totalQuestions": 50,
    "batchSize": 10,
    "totalBatches": 5,
    "currentBatchIndex": 2,
    "status": "ACTIVE",
    "timerEnabled": true,
    "timerDuration": 30,
    "batches": [
      { "batchIndex": 0, "submittedAt": "2025-01-15T10:30:00Z", "score": 80 },
      { "batchIndex": 1, "submittedAt": "2025-01-15T11:00:00Z", "score": 70 },
      { "batchIndex": 2, "submittedAt": null, "score": null }
    ]
  }
}
```

**Response 200 (no active session):**
```json
{
  "success": true,
  "data": null
}
```

**Errors:**
| Status | Error |
|---|---|
| 401 | "Unauthorized" |

---

### 3. GET /api/exam/sessions/[id]/batch/[batchIndex]

Get questions for a specific batch. Also handles server-side timer check.

**Auth:** Required (SISWA, session owner)

**Response 200 (normal):**
```json
{
  "success": true,
  "data": {
    "batchIndex": 0,
    "questions": [
      {
        "id": 101,
        "content": "Hitung nilai dari $\\int_0^1 x^2 \\, dx$",
        "imageUrl": null,
        "questionType": "SHORT_ANSWER",
        "options": []
      },
      {
        "id": 102,
        "content": "Manakah yang merupakan bilangan prima?",
        "imageUrl": null,
        "questionType": "MULTIPLE_CHOICE",
        "options": ["2", "4", "6", "8"]
      }
    ],
    "answers": {
      "101": "1/3",
      "102": ""
    },
    "currentQuestionIndex": 0,
    "timer": {
      "enabled": true,
      "duration": 30,
      "startedAt": "2025-01-15T10:00:00Z",
      "timeRemaining": 1798
    },
    "autoSubmitted": false
  }
}
```

**Response 200 (auto-submitted while away):**
```json
{
  "success": true,
  "data": {
    "autoSubmitted": true,
    "redirect": "/exam/session/1/review/2"
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 400 | "Batch 2 is not available. Current batch: 1" |
| 403 | "Forbidden: session belongs to another user" |
| 404 | "Session not found" / "Batch not found" |
| 401 | "Unauthorized" |

---

### 4. POST /api/exam/sessions/[id]/batch/[batchIndex]/submit

Submit all answers for a batch. Triggers server-side grading.

**Auth:** Required (SISWA, session owner)

**Request:**
```json
{
  "answers": {
    "101": "1/3",
    "102": "0",
    "103": "42.5",
    "104": ""
  }
}
```

**Validation:**
| Field | Rule |
|---|---|
| answers | Required, object: { [questionId: string]: string } |
| All questionIds must belong to this batch |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "batchIndex": 0,
    "score": 80.0,
    "totalCorrect": 8,
    "totalWrong": 2,
    "totalQuestions": 10,
    "gradedAnswers": {
      "101": {
        "userAnswer": "1/3",
        "isCorrect": true,
        "correctAnswer": "1/3"
      },
      "102": {
        "userAnswer": "0",
        "isCorrect": false,
        "correctAnswer": "2"
      }
    },
    "isLastBatch": false,
    "allBatchScores": [
      { "batchIndex": 0, "score": 80.0, "totalCorrect": 8, "totalWrong": 2 }
    ],
    "sessionStatus": "ACTIVE"
  }
}
```

**Response 200 (last batch):**
```json
{
  "success": true,
  "data": {
    "batchIndex": 4,
    "score": 90.0,
    "totalCorrect": 9,
    "totalWrong": 1,
    "isLastBatch": true,
    "sessionStatus": "COMPLETED",
    "allBatchScores": [
      { "batchIndex": 0, "score": 80.0, "totalCorrect": 8, "totalWrong": 2 },
      { "batchIndex": 1, "score": 70.0, "totalCorrect": 7, "totalWrong": 3 },
      { "batchIndex": 2, "score": 85.0, "totalCorrect": 8, "totalWrong": 2 },
      { "batchIndex": 3, "score": 75.0, "totalCorrect": 7, "totalWrong": 3 },
      { "batchIndex": 4, "score": 90.0, "totalCorrect": 9, "totalWrong": 1 }
    ]
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 400 | "Batch sudah di-submit" |
| 400 | "Session is not active" |
| 400 | "Batch 2 is not available. Current batch: 1" |
| 403 | "Forbidden: session belongs to another user" |
| 404 | "Session not found" / "Batch not found" |
| 401 | "Unauthorized" |

---

### 5. PATCH /api/exam/sessions/[id]/sync

Sync progress (answers, current question index) to DB. Called every 30 seconds by client.

**Auth:** Required (SISWA, session owner)

**Request:**
```json
{
  "currentBatchIndex": 0,
  "answers": {
    "101": "1/3",
    "102": "0",
    "103": "",
    "104": "42.5"
  },
  "currentQuestionIndex": 3
}
```

**Validation:**
| Field | Rule |
|---|---|
| currentBatchIndex | Required, integer, >= 0 |
| answers | Required, object: { [questionId: string]: string } |
| currentQuestionIndex | Required, integer, >= 0 |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "syncedAt": "2025-01-15T10:00:30Z"
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 400 | "Session is not active" |
| 403 | "Forbidden: session belongs to another user" |
| 404 | "Session not found" |
| 401 | "Unauthorized" |

---

### 6. DELETE /api/exam/sessions/[id]/abandon

Abandon an active session (set status to ABANDONED). Allows creating a new session.

**Auth:** Required (SISWA, session owner)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "ABANDONED"
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 400 | "Session is not active" |
| 403 | "Forbidden: session belongs to another user" |
| 404 | "Session not found" |
| 401 | "Unauthorized" |

---

## Summary Table

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/exam/sessions | Create new exam session |
| GET | /api/exam/sessions/active | Get active session (for resume) |
| GET | /api/exam/sessions/[id]/batch/[batchIndex] | Get batch questions + sync data |
| POST | /api/exam/sessions/[id]/batch/[batchIndex]/submit | Submit batch answers for grading |
| PATCH | /api/exam/sessions/[id]/sync | Sync progress to DB |
| DELETE | /api/exam/sessions/[id]/abandon | Abandon active session |
