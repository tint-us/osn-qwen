# Workflow — AUTH Module

## 1. Login Flow

```
User di halaman /login
  │
  ▼
Isi email + password → klik "Login"
  │
  ▼
Client-side validation
  │ ── invalid → tampilkan error, jangan submit
  │
  ▼ valid
POST /api/auth/[...nextauth] (credentials provider)
  │
  ▼
NextAuth credentials callback:
  │ 1. Cari user by email di DB
  │    ── tidak ditemukan → return null (login gagal)
  │
  │ 2. Cek isActive
  │    ── isActive = false → return null (login gagal)
  │
  │ 3. Compare password dengan bcrypt hash
  │    ── tidak match → return null (login gagal)
  │
  │ 4. Login berhasil → return { id, name, email, role }
  │
  ▼
JWT callback:
  │ - Tambahkan `role` ke JWT payload
  │ - Set expiry: 7 hari
  │
  ▼
Session callback:
  │ - Tambahkan `role` ke session object
  │ - Tambahkan `userId` ke session object
  │
  ▼
Redirect callback:
  │ - Cek role dari JWT
  │ - ADMIN → redirect ke /admin
  │ - SISWA → redirect ke /dashboard
  │
  ▼
Set cookie (HttpOnly, Secure)
  │
  ▼
User berada di halaman sesuai role
```

## 2. Logout Flow

```
User klik tombol "Logout"
  │
  ▼
POST /api/auth/signout (NextAuth)
  │
  ▼
NextAuth menghapus session JWT
  │
  ▼
Cookie session dihapus dari browser
  │
  ▼
Redirect ke / (landing page)
  │
  ▼
User di landing page (publik)
```

## 3. Route Protection Flow (Middleware)

```
Setiap request masuk
  │
  ▼
middleware.ts mengecek path + session
  │
  ├── Path: / atau /login (publik)
  │   ├── Ada session? → redirect ke /admin atau /dashboard (sesuai role)
  │   └── Tidak ada session? → lanjut ke halaman
  │
  ├── Path: /admin/* (protected, ADMIN only)
  │   ├── Tidak ada session? → redirect /login
  │   ├── Ada session, role = ADMIN? → lanjut
  │   └── Ada session, role = SISWA? → redirect /dashboard
  │
  ├── Path: /study/*, /exam/*, /history/*, /dashboard (protected, SISWA only)
  │   ├── Tidak ada session? → redirect /login
  │   ├── Ada session, role = SISWA? → lanjut
  │   └── Ada session, role = ADMIN? → redirect /admin
  │
  └── Path: /api/* (API routes)
      ├── /api/auth/* → lewat (NextAuth handler)
      ├── Tidak ada session? → 401 Unauthorized
      └── Ada session → cek role per endpoint
```

## 4. Unauthorized Access Flow

```
User tanpa login akses URL protected langsung
  │ contoh: /exam/session/1
  │
  ▼
Middleware intercept request
  │
  ▼
Cek session token (JWT)
  │ ── tidak ada token → redirect /login (302)
  │
  ▼
User di halaman /login
  │ ── setelah login berhasil, redirect ke halaman sesuai role
  │   (tidak kembali ke URL yang diminta, untuk keamanan)
```

## 5. User Management Flow (Admin)

### 5a. Create User

```
Admin di /admin/users → klik "Tambah User"
  │
  ▼
Form: name, email, password (min 8 char)
  │
  ▼
Client validation
  │ ── invalid → tampilkan error
  │
  ▼ valid
POST /api/admin/users
  │
  ▼
Server validation:
  │ 1. Cek email unik
  │    ── duplikat → 400 { error: "Email sudah terdaftar" }
  │ 2. Hash password (bcrypt, 10 rounds)
  │ 3. Create user di DB (role: SISWA default)
  │
  ▼
Response: { success: true, data: { id, name, email, role, isActive } }
  │
  ▼
Update daftar user di UI
```

### 5b. Update User Role

```
Admin di daftar user → klik "Ubah Role"
  │
  ▼
Modal konfirmasi: "Ubah role [name] menjadi [ADMIN/SISWA]?"
  │
  ▼
Konfirmasi → PATCH /api/admin/users/[id]
  │ Body: { role: "ADMIN" }
  │
  ▼
Server validation:
  │ 1. Cek target user exists
  │ 2. Cek admin tidak ubah role dirinya sendiri
  │    ── same user → 403 { error: "Tidak bisa mengubah role diri sendiri" }
  │ 3. Update role di DB
  │
  ▼
Response: { success: true, data: { id, name, email, role, isActive } }
```

### 5c. Toggle Active Status

```
Admin di daftar user → klik toggle "Aktif/Nonaktif"
  │
  ▼
Cek: apakah ini akun sendiri?
  │ ── ya → tampilkan pesan "Tidak bisa menonaktifkan akun sendiri"
  │
  ▼ tidak
PATCH /api/admin/users/[id]
  │ Body: { isActive: false }
  │
  ▼
Server validation + update
  │
  ▼
Response: { success: true, data: { ...user, isActive: false } }
```
