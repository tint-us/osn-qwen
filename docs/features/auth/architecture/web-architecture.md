# Web Architecture — AUTH Module

## 1. Halaman

### `/` — Landing Page (Server Component)
- Halaman publik, tidak butuh auth
- Jika user sudah login (cek via `getServerSession`), redirect ke `/admin` atau `/dashboard`
- Konten: deskripsi SoaLatihan, tombol "Masuk" → `/login`

### `/login` — Login Page (Client Component)
- Halaman publik
- Jika user sudah login, redirect ke `/admin` atau `/dashboard` (cek di Server Component wrapper)
- Berisi: `LoginForm` component
- Tidak ada navbar/sidebar (standalone page)

### `/admin/*` — Admin Pages (Protected, ADMIN)
- Layout: `app/(admin)/layout.tsx` — cek role ADMIN
- Sidebar: Soal, Users, Settings, Diagnostik
- Tombol Logout di sidebar

### `/dashboard` — Siswa Dashboard (Protected, SISWA)
- Layout: `app/(siswa)/layout.tsx` — cek role SISWA
- Card: Study Mode, Exam Mode, History & Analitik
- Tombol Logout di navbar

## 2. SessionProvider Wrapper

### File: `app/providers.tsx`

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

### File: `app/layout.tsx` (root layout)

```tsx
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Tujuan
- `SessionProvider` membungkus seluruh aplikasi
- Memungkinkan `useSession()` di Client Components
- Hanya di-root layout, tidak perlu di-repeat per route group

## 3. Redirect Logic

### Server-side redirect (page level)

```tsx
// app/login/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    const role = (session.user as any).role;
    redirect(role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return <LoginForm />;
}
```

### Client-side redirect (after login)

```tsx
// components/auth/LoginForm.tsx
"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      // tampilkan error
      setIsSubmitting(false);
    } else {
      // Fetch session to get role, then redirect
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;
      router.push(role === "ADMIN" ? "/admin" : "/dashboard");
      router.refresh();
    }
  }

  // ...render form
}
```

## 4. RoleGuard Component

### File: `components/auth/RoleGuard.tsx`

```tsx
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

interface RoleGuardProps {
  allowedRoles: ("ADMIN" | "SISWA")[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { data: session, status } = useSession();

  if (status === "loading") return <LoadingSpinner />;
  if (!session) redirect("/login");

  const role = (session.user as any)?.role;
  if (!allowedRoles.includes(role)) {
    redirect(role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return <>{children}</>;
}
```

### Penggunaan
- Wrap halaman atau layout yang butuh role-specific access
- Bisa digunakan sebagai fallback selain middleware (defense in depth)

## 5. Logout Button

### File: `components/auth/LogoutButton.tsx`

```tsx
"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  return <button onClick={handleLogout}>Logout</button>;
}
```

## 6. Layout Structure

```
app/
├── layout.tsx                    ← Root layout (SessionProvider)
├── page.tsx                      ← Landing page (publik, server component)
├── providers.tsx                 ← SessionProvider wrapper
├── (auth)/
│   └── login/
│       └── page.tsx              ← Login page (server component, redirect check)
├── (admin)/
│   ├── layout.tsx                ← Admin layout (sidebar + logout)
│   └── admin/
│       ├── page.tsx              ← Admin dashboard
│       ├── questions/
│       ├── users/
│       │   └── page.tsx          ← User management (ADMIN only)
│       └── settings/
├── (siswa)/
│   ├── layout.tsx                ← Siswa layout (navbar + logout)
│   ├── dashboard/
│   │   └── page.tsx
│   ├── study/
│   ├── exam/
│   └── history/
```

## 7. State Management

Auth module **tidak menggunakan Zustand**. Session state dikelola oleh NextAuth:
- **Server Components:** `getServerSession(authOptions)` untuk ambil session
- **Client Components:** `useSession()` hook dari `next-auth/react`
- **Tidak perlu Zustand** untuk auth state — NextAuth sudah handle caching/refresh
