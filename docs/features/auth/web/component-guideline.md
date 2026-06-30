# Component Guideline — AUTH Module

## 1. LoginForm

### File: `components/auth/LoginForm.tsx`

```tsx
"use client";
```

**Props:** None

**State:**
| State | Type | Default | Keterangan |
|---|---|---|---|
| `email` | string | `""` | Bound to email input |
| `password` | string | `""` | Bound to password input |
| `error` | string \| null | `null` | Error message, null jika tidak ada |
| `isSubmitting` | boolean | `false` | True saat login in progress |

**Behavior:**
1. User isi email + password
2. Client validation: email format, password >= 8 char
3. Submit: `signIn("credentials", { email, password, redirect: false })`
4. If `result.error` → set error message, re-enable button
5. If success → fetch `/api/auth/session` → get role → `router.push` ke `/admin` atau `/dashboard`
6. `router.refresh()` untuk update server components

**API Calls:**
- `signIn()` from `next-auth/react` (credentials provider)
- `fetch("/api/auth/session")` — untuk ambil role setelah login

**UI Elements:**
```
┌─────────────────────────────────┐
│         SoaLatihan              │
│                                 │
│   ┌─────────────────────────┐   │
│   │ Email                    │   │
│   │ ┌──────────────────────┐ │   │
│   │ │ user@example.com     │ │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │ Password                │   │
│   │ ┌──────────────────────┐ │   │
│   │ │ ••••••••••            │ │   │
│   └─────────────────────────┘   │
│                                 │
│   ⚠ Email atau password salah   │  ← hanya jika error
│                                 │
│   ┌─────────────────────────┐   │
│   │       Login             │   │  ← disabled saat isSubmitting
│   └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

---

## 2. SessionProvider Wrapper

### File: `app/providers.tsx`

```tsx
"use client";

import { SessionProvider } from "next-auth/react";
```

**Props:**
| Prop | Type | Keterangan |
|---|---|---|
| `children` | ReactNode | Child components |

**Behavior:**
- Wrap entire app di root layout
- Enables `useSession()` hook di semua Client Components
- No additional logic

---

## 3. RoleGuard

### File: `components/auth/RoleGuard.tsx`

```tsx
"use client";

import { useSession } from "next-auth/react";
```

**Props:**
| Prop | Type | Keterangan |
|---|---|---|
| `allowedRoles` | `("ADMIN" \| "SISWA")[]` | Role yang boleh akses |
| `children` | ReactNode | Konten yang diproteksi |

**State:** Uses `useSession()` — `status: "loading" | "authenticated" | "unauthenticated"`

**Behavior:**
1. `status === "loading"` → render `<LoadingSpinner />`
2. `status === "unauthenticated"` → `redirect("/login")`
3. `status === "authenticated"` → cek `session.user.role`
4. If role not in `allowedRoles` → redirect ke `/admin` (ADMIN) atau `/dashboard` (SISWA)
5. If role matches → render `children`

**Usage:**
```tsx
<RoleGuard allowedRoles={["ADMIN"]}>
  <AdminDashboard />
</RoleGuard>
```

**Note:** RoleGuard adalah defense-in-depth layer. Middleware sudah handle route protection di edge. RoleGuard untuk kasus di mana komponen perlu额外 proteksi.

---

## 4. LogoutButton

### File: `components/auth/LogoutButton.tsx`

```tsx
"use client";

import { signOut } from "next-auth/react";
```

**Props:**
| Prop | Type | Default | Keterangan |
|---|---|---|---|
| `className` | string | `""` | Custom CSS classes |

**State:** None (fire and forget)

**Behavior:**
1. User klik → `signOut({ redirect: false })`
2. Setelah signOut selesai → `router.push("/")` + `router.refresh()`
3. Loading state optional (disable button saat proses)

**UI:**
```
┌──────────┐
│  Logout  │   ← di sidebar/navbar
└──────────┘
```

---

## 5. UserManagementTable (Admin)

### File: `components/admin/UserManagementTable.tsx`

```tsx
"use client";
```

**Props:**
| Prop | Type | Keterangan |
|---|---|---|
| `initialUsers` | User[] | Initial data dari Server Component |
| `currentPage` | number | Halaman saat ini |
| `totalPages` | number | Total halaman |

**State:**
| State | Type | Keterangan |
|---|---|---|
| `users` | User[] | Data user (di-update setelah CRUD) |
| `searchQuery` | string | Filter by name/email |
| `page` | number | Halaman saat ini |
| `isCreateModalOpen` | boolean | Modal tambah user |
| `selectedUser` | User \| null | User yang sedang di-edit |
| `toast` | { type, message } \| null | Notifikasi |

**Behavior:**
1. Search: debounced fetch `/api/admin/users?search=...&page=1`
2. Pagination: fetch `/api/admin/users?page=N`
3. Create: POST `/api/admin/users` → update `users` state
4. Update role: PATCH `/api/admin/users/[id]` → update `users` state
5. Toggle active: PATCH `/api/admin/users/[id]` → update `users` state

**API Calls:**
- `GET /api/admin/users?page=&pageSize=&search=`
- `POST /api/admin/users`
- `PATCH /api/admin/users/[id]`

**UI:**
```
┌─────────────────────────────────────────────────────┐
│  Manajemen User                    [+ Tambah User]  │
│                                                     │
│  Search: [________________]                        │
│                                                     │
│  ┌───┬──────────┬─────────┬───────┬────────┬─────┐ │
│  │ # │ Name     │ Email   │ Role  │ Status │ Aksi│ │
│  ├───┼──────────┼─────────┼───────┼────────┼─────┤ │
│  │ 1 │ Admin    │ a@b.com │ ADMIN │ Active │  …  │ │
│  │ 2 │ Siswa A  │ c@d.com │ SISWA │ Active │  …  │ │
│  │ 3 │ Siswa B  │ e@f.com │ SISWA │ Nonaktif│ …  │ │
│  └───┴──────────┴─────────┴───────┴────────┴─────┘ │
│                                                     │
│              ← 1 2 3 →                              │
└─────────────────────────────────────────────────────┘
```

---

## 6. CreateUserModal (Admin)

### File: `components/admin/CreateUserModal.tsx`

```tsx
"use client";
```

**Props:**
| Prop | Type | Keterangan |
|---|---|---|
| `isOpen` | boolean | Kontrol visibility |
| `onClose` | () => void | Callback saat modal ditutup |
| `onCreated` | (user: User) => void | Callback setelah user berhasil dibuat |

**State:**
| State | Type | Default |
|---|---|---|
| `name` | string | `""` |
| `email` | string | `""` |
| `password` | string | `""` |
| `errors` | Record<string, string> | `{}` |
| `isSubmitting` | boolean | `false` |

**Behavior:**
1. Form fields: name, email, password
2. Client validation: name >= 2 char, email format, password >= 8 char
3. Submit: POST `/api/admin/users`
4. On success: `onCreated(user)`, close modal, reset form
5. On error (email duplicate): show inline error on email field

**UI:**
```
┌─────────────────────────────┐
│  Tambah User          [×]   │
│                             │
│  Name                       │
│  [____________________]     │
│                             │
│  Email                      │
│  [____________________]     │
│  ⚠ Email sudah terdaftar   │  ← jika duplikat
│                             │
│  Password (min 8 karakter)  │
│  [____________________]     │
│                             │
│  [Batal]      [Simpan]      │
└─────────────────────────────┘
```

---

## 7. Component Dependency Graph

```
app/layout.tsx
  └── Providers (SessionProvider)
        └── (all pages)

app/(auth)/login/page.tsx
  └── LoginForm
        ├── signIn() → NextAuth
        └── fetch() → /api/auth/session

app/(admin)/layout.tsx
  ├── RoleGuard (allowedRoles: ["ADMIN"])
  ├── Sidebar
  │   └── LogoutButton
  └── {children}

app/(siswa)/layout.tsx
  ├── RoleGuard (allowedRoles: ["SISWA"])
  ├── Navbar
  │   └── LogoutButton
  └── {children}

app/(admin)/admin/users/page.tsx
  └── UserManagementTable
        └── CreateUserModal
```
