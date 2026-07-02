"use client";

import { AdminStatsOverview } from "@/components/admin/AdminStatsOverview";
import { DBHealthCard } from "@/components/admin/DBHealthCard";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan statistik platform SoaLatihan
        </p>
      </div>

      <AdminStatsOverview />

      <DBHealthCard />
    </div>
  );
}
