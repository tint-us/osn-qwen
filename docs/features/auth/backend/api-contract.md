# API Contract — AUTH Module

## Endpoints

---

### 1. POST `/api/auth/[...nextauth]`

**Description:** NextAuth handler — login, session, logout. Dikelola sepenuhnya oleh NextAuth.js.

**Auth Required:** No

**Request Body (login via credentials):**
```
Content-Type: application/x-www-form-urlencoded

email=user@example.com
password=secretpassword
```

**Response Sukses (200):**
```json
{
  "user": {
    "name": "Ahmad Doe",
    "email": "user@example.com"
  },
  "expires": "2026-07-06T00:00:00.000Z"
}
```

**Response Error (401):**
```json
{
  "error": "CredentialsSignin",
  "status": 401,
  "ok": false,
  "url": "http://localhost:3000/api/auth/error?error=CredentialsSignin"
}
```

**Notes:**
- Endpoint ini adalah catch-all NextAuth route, bukan custom API
- Request/response format dikelola oleh NextAuth internal
- Tidak perlu custom handler

---

### 2. GET `/api/auth/session`

**Description:** Ambil session user yang sedang login.

**Auth Required:** No (returns null jika tidak login)

**Response Sukses (200) — User Logged In:**
```json
{
  "user": {
    "name": "Ahmad Doe",
    "email": "user@example.com",
    "role": "SISWA",
    "userId": "5"
  },
  "expires": "2026-07-06T00:00:00.000Z"
}
```

**Response Sukses (200) — Not Logged In:**
```json
{}
```

---

### 3. POST `/api/admin/users`

**Description:** Buat akun user baru. Admin only.

**Auth Required:** Yes — role `ADMIN`

**Request Body:**
```json
{
  "name": "Siswa Baru",
  "email": "siswa@example.com",
  "password": "password123"
}
```

**Validation:**
| Field | Rule |
|---|---|
| `name` | Required, min 2 karakter |
| `email` | Required, valid email format, unique |
| `password` | Required, min 8 karakter |

**Response Sukses (201):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "Siswa Baru",
    "email": "siswa@example.com",
    "role": "SISWA",
    "isActive": true,
    "createdAt": "2026-06-29T10:00:00.000Z"
  }
}
```

**Response Error — Email Duplikat (400):**
```json
{
  "success": false,
  "error": "Email sudah terdaftar"
}
```

**Response Error — Validation (400):**
```json
{
  "success": false,
  "error": "Password minimal 8 karakter"
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
  "error": "Forbidden: Admin access required"
}
```

---

### 4. GET `/api/admin/users`

**Description:** Ambil daftar semua user (paginated). Admin only.

**Auth Required:** Yes — role `ADMIN`

**Query Parameters:**
| Param | Type | Default | Keterangan |
|---|---|---|---|
| `page` | int | 1 | Halaman saat ini |
| `pageSize` | int | 20 | Jumlah user per halaman (max 50) |
| `search` | string | — | Filter by name atau email (partial match) |

**Response Sukses (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Admin Utama",
      "email": "admin@soalatihan.id",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2026-06-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Siswa A",
      "email": "siswa.a@example.com",
      "role": "SISWA",
      "isActive": true,
      "createdAt": "2026-06-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  }
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
  "error": "Forbidden: Admin access required"
}
```

---

### 5. PATCH `/api/admin/users/[id]`

**Description:** Update user — ubah role atau toggle isActive. Admin only.

**Auth Required:** Yes — role `ADMIN`

**Path Parameter:**
| Param | Type | Keterangan |
|---|---|---|
| `id` | int | User ID yang akan diupdate |

**Request Body (minimal salah satu field):**
```json
{
  "role": "ADMIN",
  "isActive": false
}
```

| Field | Type | Rule |
|---|---|---|
| `role` | `"ADMIN"` \| `"SISWA"` | Optional. Tidak boleh ubah role diri sendiri. |
| `isActive` | boolean | Optional. Tidak boleh nonaktifkan diri sendiri. |

**Response Sukses (200):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Siswa A",
    "email": "siswa.a@example.com",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-06-15T00:00:00.000Z"
  }
}
```

**Response Error — User Not Found (404):**
```json
{
  "success": false,
  "error": "User tidak ditemukan"
}
```

**Response Error — Cannot Change Own Role (403):**
```json
{
  "success": false,
  "error": "Tidak bisa mengubah role diri sendiri"
}
```

**Response Error — Cannot Deactivate Self (403):**
```json
{
  "success": false,
  "error": "Tidak bisa menonaktifkan akun sendiri"
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
  "error": "Forbidden: Admin access required"
}
```

**Response Error — Validation (400):**
```json
{
  "success": false,
  "error": "Role harus ADMIN atau SISWA"
}
```

---

## Status Code Summary

| Endpoint | 200 | 201 | 400 | 401 | 403 | 404 | 429 |
|---|---|---|---|---|---|---|---|
| POST `/api/auth/[...nextauth]` | ✅ | — | — | ✅ | — | — | ✅ |
| GET `/api/auth/session` | ✅ | — | — | — | — | — | — |
| POST `/api/admin/users` | — | ✅ | ✅ | ✅ | ✅ | — | — |
| GET `/api/admin/users` | ✅ | — | ✅ | ✅ | ✅ | — | — |
| PATCH `/api/admin/users/[id]` | ✅ | — | ✅ | ✅ | ✅ | ✅ | — |
