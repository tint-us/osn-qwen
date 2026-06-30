# API Contract — HISTORY & ANALITIK Module

## Endpoints

### 1. GET /api/history/sessions

Get paginated list of user's exam sessions.

**Auth:** Required (SISWA)

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page (max 50) |
| status | string | — | Filter: COMPLETED, ACTIVE, ABANDONED |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 1,
        "createdAt": "2025-01-15T10:00:00Z",
        "filter": {
          "tingkat": "SMA",
          "level": "OSNP",
          "matpels": ["Matematika", "Fisika"]
        },
        "totalQuestions": 50,
        "batchSize": 10,
        "status": "COMPLETED",
        "avgScore": 82.5,
        "batchesSubmitted": 5,
        "totalBatches": 5
      },
      {
        "id": 2,
        "createdAt": "2025-01-16T14:00:00Z",
        "filter": {
          "tingkat": "SMA",
          "level": "OSNK",
          "matpels": ["Kimia"]
        },
        "totalQuestions": 30,
        "batchSize": 10,
        "status": "ACTIVE",
        "avgScore": 75.0,
        "batchesSubmitted": 2,
        "totalBatches": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 401 | "Unauthorized" |

---

### 2. GET /api/history/sessions/[id]

Get detailed session info including all batches.

**Auth:** Required (SISWA, session owner)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "createdAt": "2025-01-15T10:00:00Z",
    "filter": {
      "tingkat": "SMA",
      "level": "OSNP",
      "matpels": ["Matematika", "Fisika"]
    },
    "totalQuestions": 50,
    "batchSize": 10,
    "status": "COMPLETED",
    "currentBatchIndex": 5,
    "timerEnabled": true,
    "timerDuration": 30,
    "avgScore": 82.5,
    "batches": [
      {
        "batchIndex": 0,
        "questionCount": 10,
        "score": 80.0,
        "totalCorrect": 8,
        "totalWrong": 2,
        "submittedAt": "2025-01-15T10:30:00Z",
        "answers": {
          "101": { "userAnswer": "1/3", "isCorrect": true, "correctAnswer": "1/3" },
          "102": { "userAnswer": "0", "isCorrect": false, "correctAnswer": "2" }
        }
      },
      {
        "batchIndex": 1,
        "questionCount": 10,
        "score": 70.0,
        "totalCorrect": 7,
        "totalWrong": 3,
        "submittedAt": "2025-01-15T11:00:00Z",
        "answers": {}
      }
    ]
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 403 | "Forbidden: session belongs to another user" |
| 404 | "Session not found" |
| 401 | "Unauthorized" |

---

### 3. GET /api/history/analytics

Get aggregated analytics data for cumulative stats + score journey chart.

**Auth:** Required (SISWA)

**Query Parameters (optional, for chart filter):**
| Param | Type | Description |
|---|---|---|
| tingkat | string | Filter: SD, SMP, SMA |
| level | string | Filter: OSNK, OSNP, SEMIFINAL, FINAL |
| matpel | string | Filter: single matpel name |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalQuestions": 150,
    "totalCorrect": 105,
    "totalWrong": 45,
    "accuracy": 70.0,
    "batchScores": [
      {
        "index": 0,
        "batchIndex": 0,
        "score": 80.0,
        "submittedAt": "2025-01-15T10:30:00Z",
        "sessionDate": "2025-01-15T10:00:00Z",
        "sessionFilter": {
          "tingkat": "SMA",
          "level": "OSNP",
          "matpels": ["Matematika"]
        }
      },
      {
        "index": 1,
        "batchIndex": 1,
        "score": 70.0,
        "submittedAt": "2025-01-15T11:00:00Z",
        "sessionDate": "2025-01-15T10:00:00Z",
        "sessionFilter": {
          "tingkat": "SMA",
          "level": "OSNP",
          "matpels": ["Matematika"]
        }
      }
    ]
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 401 | "Unauthorized" |

---

### 4. GET /api/history/streak

Get user's current streak data.

**Auth:** Required (SISWA)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "currentStreak": 7,
    "lastActiveDate": "2025-01-15T00:00:00Z",
    "milestones": {
      "3": true,
      "7": true,
      "14": false,
      "30": false
    }
  }
}
```

**Response 200 (no streak):**
```json
{
  "success": true,
  "data": {
    "currentStreak": 0,
    "lastActiveDate": null,
    "milestones": {
      "3": false,
      "7": false,
      "14": false,
      "30": false
    }
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 401 | "Unauthorized" |

---

### 5. GET /api/history/study-stats

Get study attempt statistics grouped by matpel (for SubjectAccuracyChart).

**Auth:** Required (SISWA)

**Query Parameters (optional):**
| Param | Type | Description |
|---|---|---|
| tingkat | string | Filter by tingkat |
| level | string | Filter by level |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "matpel": "Matematika",
      "totalAttempts": 45,
      "totalCorrect": 32,
      "accuracy": 71.1
    },
    {
      "matpel": "Fisika",
      "totalAttempts": 30,
      "totalCorrect": 25,
      "accuracy": 83.3
    },
    {
      "matpel": "Kimia",
      "totalAttempts": 20,
      "totalCorrect": 10,
      "accuracy": 50.0
    }
  ]
}
```

**Response 200 (no data):**
```json
{
  "success": true,
  "data": []
}
```

**Errors:**
| Status | Error |
|---|---|
| 401 | "Unauthorized" |

---

## Summary Table

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/history/sessions | Paginated session history list |
| GET | /api/history/sessions/[id] | Session detail with all batches |
| GET | /api/history/analytics | Cumulative stats + batch scores for chart |
| GET | /api/history/streak | Current streak + milestone flags |
| GET | /api/history/study-stats | Study accuracy per matpel |
