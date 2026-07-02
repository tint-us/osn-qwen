"use client";

import { UserTable } from "@/components/admin/UserTable";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manajemen User</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola user: ubah role, aktifkan/nonaktifkan akun
        </p>
      </div>

      <UserTable />
    </div>
  );
}
