"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";

interface RoleGuardProps {
  role: Role | Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ role, children, fallback }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const roles = Array.isArray(role) ? role : [role];

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/login");
      return;
    }
    if (!roles.includes(session.user.role)) {
      router.replace(
        session.user.role === "ADMIN" ? "/admin" : "/dashboard"
      );
    }
  }, [session, status, router, roles]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  if (!session?.user || !roles.includes(session.user.role)) {
    return (
      <>{fallback ?? null}</>
    );
  }

  return <>{children}</>;
}
