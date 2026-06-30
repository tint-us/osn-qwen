# UI Flow — AUTH Module

## 1. Overall Flow

```
                    ┌─────────────┐
                    │  Landing /  │
                    │  (publik)   │
                    └──────┬──────┘
                           │ klik "Masuk"
                           ▼
                    ┌─────────────┐
                    │   /login    │
                    │             │
                    │  [email]    │
                    │  [password] │
                    │  [Login]    │
                    └──────┬──────┘
                           │ submit
                           ▼
                    ┌─────────────┐
                    │  Validasi   │
                    │  kredensial │
                    └──────┬──────┘
                      ┌────┴────┐
                      │         │
                   gagal     berhasil
                      │         │
                      ▼         ▼
            ┌──────────┐  ┌──────────────┐
            │ Tampil   │  │ Cek role     │
            │ error    │  └──────┬───────┘
            │ di form │    ┌────┴────┐
            └──────────┘    │         │
                         ADMIN     SISWA
                            │         │
                            ▼         ▼
                   ┌──────────┐ ┌───────────┐
                   │  /admin  │ │ /dashboard │
                   └──────┬───┘ └─────┬─────┘
                          │           │
                          ▼           ▼
                   ┌──────────────────────────┐
                   │     Logout Button        │
                   │  (di sidebar/navbar)     │
                   └────────────┬─────────────┘
                                │ klik
                                ▼
                   ┌──────────────────────────┐
                   │   Redirect to /          │
                   │   (landing page)         │
                   └──────────────────────────┘
```

## 2. Login Page Flow (Detail)

```
User membuka /login
  │
  ▼
Cek session (server-side getServerSession)
  │
  ├── Ada session?
  │   ├── Role = ADMIN → redirect /admin (server-side)
  │   └── Role = SISWA → redirect /dashboard (server-side)
  │
  └── Tidak ada session
      │
      ▼
Render LoginForm (client component)
  │
  ├── Field: email (type=email, required)
  ├── Field: password (type=password, required, min 8 char)
  └── Button: "Login" (disabled saat isSubmitting)
  │
  ▼
User isi form → klik "Login"
  │
  ▼
Client-side validation
  │ ├── Email format valid?
  │ ├── Password >= 8 char?
  │ └── Jika invalid → tampilkan inline error, jangan submit
  │
  ▼ valid
signIn("credentials", { email, password, redirect: false })
  │
  ├── result.error?
  │   ├── Tampilkan error: "Email atau password salah"
  │   ├── Re-enable button
  │   └── Stay di /login
  │
  └── result.ok
      │
      ▼
      Fetch /api/auth/session
      │
      ▼
      Cek role dari session
      │
      ├── ADMIN → router.push("/admin")
      └── SISWA → router.push("/dashboard")
      │
      ▼
      router.refresh() — refresh server components
```

## 3. Admin User Management Flow

```
/admin/users
  │
  ▼
Tabel daftar user
  │
  ├── Search bar (filter by name/email)
  ├── Pagination controls
  │
  ├── Per row:
  │   ├── Name, Email, Role badge, Status badge
  │   ├── Dropdown "Ubah Role" → [ADMIN / SISWA]
  │   └── Toggle "Aktif/Nonaktif"
  │
  └── Button: "+ Tambah User"
      │
      ▼
  Modal "Tambah User"
  │ ├── Field: Name
  │ ├── Field: Email
  │ ├── Field: Password (min 8 char)
  │ ├── Button: "Batal"
  │ └── Button: "Simpan"
  │
  ▼ (submit)
  POST /api/admin/users
  │
  ├── Sukses → close modal, refresh tabel, toast "User berhasil dibuat"
  └── Error → tampilkan error di modal
```

## 4. Protected Page Access Flow

```
User akses URL protected (misal: /study)
  │
  ▼
Middleware (middleware.ts)
  │
  ├── Tidak ada session token?
  │   └── Redirect 302 → /login
  │
  ├── Ada session, tapi role salah?
  │   ├── SISWA akses /admin → Redirect 302 → /dashboard
  │   └── ADMIN akses /study → Redirect 302 → /admin
  │
  └── Session valid + role match
      └── Lanjut ke page rendering
```

## 5. States per Page

| Page | Loading State | Error State | Empty State |
|---|---|---|---|
| `/login` | Button disabled + spinner | Error message below form | N/A |
| `/admin/users` | Skeleton tabel | Toast error | "Belum ada user" + tombol tambah |
| `/admin/users` (search no result) | — | — | "Tidak ada user yang cocok" |
| Modal tambah user | Button disabled + spinner | Inline error di field | — |
