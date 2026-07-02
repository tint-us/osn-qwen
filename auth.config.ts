import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role as "ADMIN" | "SISWA";
        token.userId = (user as { id: string }).id;
        token.username = (user as { username: string }).username;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "ADMIN" | "SISWA";
        session.user.userId = token.userId as string;
        session.user.username = token.username as string;
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
