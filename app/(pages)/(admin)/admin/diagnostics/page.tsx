"use client";

import { DBHealthCard } from "@/components/admin/DBHealthCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDiagnosticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Diagnostik Database</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cek kesehatan koneksi database dan statistik dasar
        </p>
      </div>

      <DBHealthCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Sistem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Runtime</span>
              <span className="font-medium">Node.js</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Database</span>
              <span className="font-medium">PostgreSQL</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">ORM</span>
              <span className="font-medium">Prisma</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Framework</span>
              <span className="font-medium">Next.js 15 (App Router)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
