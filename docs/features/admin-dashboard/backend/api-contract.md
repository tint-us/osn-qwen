# API Contract — ADMIN DASHBOARD Module

## Endpoints

### 1. GET /api/admin/stats

Get dashboard summary statistics.

**Auth:** Required (ADMIN)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalQuestions": 1500,
    "totalUsers": 120,
    "totalSessions": 450,
    "totalAttempts": 5200
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 401 | "Unauthorized" |
| 403 | "Forbidden: admin access required" |

---

### 2. GET /api/admin/questions

Get paginated list of questions with optional filters.

**Auth:** Required (ADMIN)

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page (max 50) |
| tingkat | string | — | Filter: SD, SMP, SMA |
| level | string | — | Filter: OSNK, OSNP, SEMIFINAL, FINAL |
| matpel | string | — | Partial match (case-insensitive) |
| questionType | string | — | Filter: MULTIPLE_CHOICE, SHORT_ANSWER, ESSAY |
| search | string | — | Content search (case-insensitive, partial match) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": 1,
        "content": "Hitung nilai dari $\\frac{1}{2} + \\frac{1}{3}$...",
        "tingkat": "SMA",
        "level": "OSNP",
        "matpel": "Matematika",
        "questionType": "MULTIPLE_CHOICE",
        "createdAt": "2025-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1500,
      "totalPages": 150
    }
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 401 | "Unauthorized" |
| 403 | "Forbidden: admin access required" |

---

### 3. POST /api/admin/questions

Create a new question.

**Auth:** Required (ADMIN)

**Request Body:**
```json
{
  "tingkat": "SMA",
  "level": "OSNP",
  "matpel": "Matematika",
  "questionType": "MULTIPLE_CHOICE",
  "content": "Hitung nilai dari $\\frac{1}{2} + \\frac{1}{3}$",
  "imageUrl": null,
  "explanation": "Penjumlahan pecahan: $\\frac{3+2}{6} = \\frac{5}{6}$",
  "options": ["1/6", "5/6", "1/2", "2/3"],
  "correctOption": 1,
  "acceptableAnswers": []
}
```

**Question Type Field Requirements:**
| Type | Required Fields |
|---|---|
| MULTIPLE_CHOICE | options[] (min 2), correctOption |
| SHORT_ANSWER | acceptableAnswers[] (min 1) |
| ESSAY | acceptableAnswers[] (min 1) |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 1501,
    "content": "Hitung nilai dari $\\frac{1}{2} + \\frac{1}{3}$",
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Matematika",
    "questionType": "MULTIPLE_CHOICE",
    "createdAt": "2025-01-15T12:00:00Z"
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 400 | "Validation error: [detail]" |
| 401 | "Unauthorized" |
| 403 | "Forbidden: admin access required" |

---

### 4. GET /api/admin/questions/[id]

Get full question data for editing.

**Auth:** Required (ADMIN)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Matematika",
    "questionType": "MULTIPLE_CHOICE",
    "content": "Hitung nilai dari $\\frac{1}{2} + \\frac{1}{3}$",
    "imageUrl": null,
    "explanation": "Penjumlahan pecahan: $\\frac{3+2}{6} = \\frac{5}{6}$",
    "options": ["1/6", "5/6", "1/2", "2/3"],
    "correctOption": 1,
    "acceptableAnswers": [],
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 404 | "Question not found" |
| 401 | "Unauthorized" |
| 403 | "Forbidden: admin access required" |

---

### 5. PATCH /api/admin/questions/[id]

Update an existing question.

**Auth:** Required (ADMIN)

**Request Body:** Same structure as POST (all fields required).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Matematika",
    "questionType": "MULTIPLE_CHOICE",
    "content": "Updated content...",
    "explanation": "Updated explanation...",
    "updatedAt": "2025-01-15T13:00:00Z"
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 400 | "Validation error: [detail]" |
| 404 | "Question not found" |
| 401 | "Unauthorized" |
| 403 | "Forbidden: admin access required" |

---

### 6. DELETE /api/admin/questions/[id]

Delete a question (hard delete, cascades StudyAttempt).

**Auth:** Required (ADMIN)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "deletedId": 1,
    "studyAttemptsDeleted": 15
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 404 | "Question not found" |
| 401 | "Unauthorized" |
| 403 | "Forbidden: admin access required" |

---

### 7. GET /api/admin/users

Get paginated list of users.

**Auth:** Required (ADMIN)

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page (max 50) |
| role | string | — | Filter: ADMIN, SISWA |
| isActive | boolean | — | Filter: true, false |
| search | string | — | Name or email (partial, case-insensitive) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Admin User",
        "email": "admin@soalatihan.id",
        "role": "ADMIN",
        "isActive": true,
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 120,
      "totalPages": 12
    }
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 401 | "Unauthorized" |
| 403 | "Forbidden: admin access required" |

---

### 8. PATCH /api/admin/users/[id]

Update user role or active status.

**Auth:** Required (ADMIN)

**Request Body:**
```json
{
  "role": "SISWA"
}
```
or
```json
{
  "isActive": false
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Siswa User",
    "email": "siswa@soalatihan.id",
    "role": "SISWA",
    "isActive": true,
    "updatedAt": "2025-01-15T12:00:00Z"
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 400 | "Cannot deactivate own account" / "Cannot change own role" |
| 404 | "User not found" |
| 401 | "Unauthorized" |
| 403 | "Forbidden: admin access required" |

---

### 9. GET /api/admin/config

Get configuration values (API Key masked).

**Auth:** Required (ADMIN)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "ai": {
      "apiKey": "••••••••ab3f",
      "baseUrl": "https://api.openai.com/v1",
      "systemPrompt": "You are a helpful assistant..."
    },
    "exam": {
      "defaultBatchSize": 10
    }
  }
}
```

**Response 200 (no config set):**
```json
{
  "success": true,
  "data": {
    "ai": {
      "apiKey": "",
      "baseUrl": "",
      "systemPrompt": ""
    },
    "exam": {
      "defaultBatchSize": 10
    }
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 401 | "Unauthorized" |
| 403 | "Forbidden: admin access required" |

---

### 10. PATCH /api/admin/config

Update configuration values.

**Auth:** Required (ADMIN)

**Request Body:**
```json
{
  "ai": {
    "apiKey": "sk-new-api-key-1234567890",
    "baseUrl": "https://api.openai.com/v1",
    "systemPrompt": "You are a helpful assistant for generating OSN questions..."
  },
  "exam": {
    "defaultBatchSize": 15
  }
}
```

**Notes:**
- If `ai.apiKey` is empty string `""`: server keeps existing encrypted value
- If `ai.apiKey` is non-empty: server encrypts and saves new value
- `exam.defaultBatchSize`: must be 10-30

**Response 200:**
```json
{
  "success": true,
  "data": {
    "ai": {
      "apiKey": "••••••••7890",
      "baseUrl": "https://api.openai.com/v1",
      "systemPrompt": "You are a helpful assistant for generating OSN questions..."
    },
    "exam": {
      "defaultBatchSize": 15
    }
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 400 | "Batch size must be between 10 and 30" / "Encryption key not configured" |
| 401 | "Unauthorized" |
| 403 | "Forbidden: admin access required" |

---

### 11. GET /api/admin/diagnostics

Get database health and statistics.

**Auth:** Required (ADMIN)

**Response 200 (healthy):**
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "latency": "12ms",
    "stats": {
      "totalQuestions": 1500,
      "totalUsers": 120,
      "totalSessions": 450,
      "totalAttempts": 5200
    }
  }
}
```

**Response 200 (unhealthy):**
```json
{
  "success": true,
  "data": {
    "status": "disconnected",
    "latency": "—",
    "stats": {
      "totalQuestions": "—",
      "totalUsers": "—",
      "totalSessions": "—",
      "totalAttempts": "—"
    }
  }
}
```

**Errors:**
| Status | Error |
|---|---|
| 401 | "Unauthorized" |
| 403 | "Forbidden: admin access required" |

---

## Summary Table

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/admin/stats | Dashboard summary statistics |
| GET | /api/admin/questions | Paginated question list with filters |
| POST | /api/admin/questions | Create new question |
| GET | /api/admin/questions/[id] | Get full question for editing |
| PATCH | /api/admin/questions/[id] | Update question |
| DELETE | /api/admin/questions/[id] | Delete question (cascade) |
| GET | /api/admin/users | Paginated user list with filters |
| PATCH | /api/admin/users/[id] | Update user role or status |
| GET | /api/admin/config | Get config (API Key masked) |
| PATCH | /api/admin/config | Update config (AI + exam) |
| GET | /api/admin/diagnostics | DB health check + stats |
