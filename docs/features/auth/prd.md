# PRD — AUTH Module

## 1. Overview

Modul AUTH mengelola autentikasi dan otorisasi untuk platform SoaLatihan. Platform ini menggunakan sistem tertutup: tidak ada registrasi publik. Admin yang membuat akun siswa. Autentikasi menggunakan email + password via NextAuth.js (Auth.js v5).

## 2. Scope

### In Scope
- Login dengan email + password
- Logout
- RBAC: 2 role — `ADMIN` dan `SISWA`
- Tidak ada registrasi publik — admin membuat akun siswa
- Proteksi route berbasis role:
  - `/admin/*` → hanya `ADMIN`
  - `/study/*`, `/exam/*`, `/history/*` → hanya `SISWA` yang sudah login
  - Halaman publik: landing page (`/`) dan login page (`/login`) saja
- Redirect setelah login berdasarkan role:
  - `ADMIN` → `/admin`
  - `SISWA` → `/dashboard`
- Manajemen user oleh admin: buat akun siswa, ubah role, nonaktifkan akun

### Out of Scope
- Registrasi publik (self-service sign up)
- OAuth / social login (Google, GitHub, dll)
- Password reset via email
- Multi-factor authentication (MFA)
- Email verification

## 3. Functional Requirements

### FR-1: Login
- Sistem login menggunakan email + password
- Password diverifikasi menggunakan bcrypt hash
- Jika login berhasil: buat session, redirect berdasarkan role
- Jika login gagal: tampilkan pesan error generic ("Email atau password salah")
- Login form di halaman `/login`

### FR-2: Logout
- Tombol logout tersedia di sidebar/navbar user yang sudah login
- Logout menghapus session NextAuth
- Setelah logout: redirect ke landing page (`/`)

### FR-3: Route Protection
- Middleware mengecek session dan role untuk setiap request
- `/admin/*`: hanya role `ADMIN`, jika bukan → redirect `/login`
- `/study/*`, `/exam/*`, `/history/*`, `/dashboard`: hanya role `SISWA` yang login, jika tidak → redirect `/login`
- `/` dan `/login`: publik, tidak butuh auth
- Jika sudah login dan akses `/login`: redirect ke dashboard/admin sesuai role

### FR-4: User Management (Admin only)
- Admin bisa melihat daftar semua user
- Admin bisa membuat akun siswa baru (name, email, password)
- Admin bisa mengubah role user (ADMIN ↔ SISWA)
- Admin bisa menonaktifkan akun (isActive = false) — akun nonaktif tidak bisa login
- Admin tidak bisa menonaktifkan akunnya sendiri

### FR-5: Session Management
- Session disimpan di JWT (stateless)
- Session duration: 7 hari
- Session otomatis refresh saat user aktif

## 4. Non-Functional Requirements

### NFR-1: Security
- Password disimpan sebagai bcrypt hash (salt rounds: 10)
- Password minimum 8 karakter
- Rate limiting: maksimal 5 percobaan login gagal per menit per IP
- Session token di HttpOnly + Secure cookie
- Tidak ada sensitive info di JWT payload (hanya userId, role, name, email)

### NFR-2: Performance
- Login response time < 500ms
- Session check di middleware < 50ms
- User list query < 200ms

### NFR-3: UX
- Loading state saat login (disable button, spinner)
- Redirect instan setelah login berhasil
- Pesan error jelas untuk user
- Setelah logout, user tidak bisa kembali ke halaman protected via back button

## 5. Dependencies

| Dependency | Modul | Keterangan |
|---|---|---|
| NextAuth.js (Auth.js v5) | External | Library autentikasi |
| bcrypt | External | Password hashing |
| Prisma | Internal | Akses tabel User |
| User table | DB | Schema sudah didefinisikan di prisma/schema.prisma |
