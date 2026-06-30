# Backend Architecture — AUTH Module

## 1. NextAuth.js v5 (Auth.js) Configuration

### File: `lib/auth.ts`

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;
        if (!user.isActive) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.userId = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).userId = token.userId;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect handled in middleware/client based on role
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
};
```

### Key Points
- **CredentialsProvider:** Email + password, divalidasi via bcrypt
- **JWT strategy:** Stateless, no session store needed
- **Callbacks:**
  - `jwt`: Inject `role` and `userId` into JWT token
  - `session`: Expose `role` and `userId` on session object
  - `redirect`: Safe redirect (only same-origin)
- **Custom page:** `/login` (bukan default NextAuth page)

## 2. Middleware — Route Protection

### File: `middleware.ts`

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role as string;
    const path = req.nextUrl.pathname;

    // Admin routes: only ADMIN
    if (path.startsWith("/admin")) {
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Siswa routes: only SISWA
    if (path.startsWith("/study") || path.startsWith("/exam") || 
        path.startsWith("/history") || path.startsWith("/dashboard")) {
      if (role !== "SISWA") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public routes: / and /login
        if (path === "/" || path === "/login") {
          // If logged in, redirect away (handled in page)
          return true;
        }

        // Protected routes: must have token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### Route Protection Logic

| Path | Token Check | Role Check | Redirect If Fail |
|---|---|---|---|
| `/` | Skip | Skip | — |
| `/login` | Skip | Skip | — (page-level redirect if logged in) |
| `/admin/*` | Required | Must be ADMIN | SISWA → `/dashboard`; no token → `/login` |
| `/dashboard`, `/study/*`, `/exam/*`, `/history/*` | Required | Must be SISWA | ADMIN → `/admin`; no token → `/login` |

## 3. Session Callbacks — Data Flow

```
Login Request
  │
  ▼
authorize() → returns user object { id, name, email, role }
  │
  ▼
jwt() callback → injects role + userId into JWT token
  │ token = { ...token, role: "SISWA", userId: "5" }
  │
  ▼
session() callback → injects role + userId into session
  │ session.user = { name, email, role: "SISWA", userId: "5" }
  │
  ▼
Client receives session (via useSession() or getServerSession())
```

## 4. Service Layer

### File: `lib/services/auth-service.ts`

```typescript
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authService = {
  async createUser(data: { name: string; email: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "SISWA",
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
  },

  async getAllUsers(page: number = 1, pageSize: number = 20) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);
    return { users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async updateUserRole(userId: number, role: "ADMIN" | "SISWA", currentUserId: number) {
    if (userId === currentUserId) throw new Error("CANNOT_CHANGE_OWN_ROLE");
    return prisma.user.update({ where: { id: userId }, data: { role } });
  },

  async toggleUserActive(userId: number, isActive: boolean, currentUserId: number) {
    if (userId === currentUserId) throw new Error("CANNOT_DEACTIVATE_OWN_ACCOUNT");
    return prisma.user.update({ where: { id: userId }, data: { isActive } });
  },

  async isEmailTaken(email: string) {
    return prisma.user.findUnique({ where: { email } }) !== null;
  },
};
```

## 5. Security Considerations

| Concern | Mitigation |
|---|---|
| Password in JWT | Never. JWT only has userId, role, name, email |
| Password hashing | bcrypt, 10 salt rounds |
| Session hijacking | HttpOnly + Secure cookie, SameSite=lax |
| Brute force | Rate limit: 5 attempts/min/IP |
| Enumeration attack | Same error message for "user not found" and "wrong password" |
| CSRF | NextAuth handles CSRF token internally |
| Redirect attack | Only allow same-origin redirects |
| Inactive account login | Checked in authorize() callback |
