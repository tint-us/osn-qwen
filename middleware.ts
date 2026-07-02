import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = ["/", "/login"];

const SISWA_ROUTE_PREFIXES = ["/dashboard", "/study", "/exam", "/history"];

export default auth((req) => {
  const { nextUrl } = req;
  const token = req.auth as { role?: string } | null;
  const isLoggedIn = !!token;
  const role = token?.role;

  const pathname = nextUrl.pathname;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAdminRoute = pathname.startsWith("/admin");
  const isSiswaRoute = SISWA_ROUTE_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );

  if (isPublicRoute) return;

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isSiswaRoute && role !== "SISWA") {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
