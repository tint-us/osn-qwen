"use client";

import { AIConfigForm } from "@/components/admin/AIConfigForm";
import { ExamConfigForm } from "@/components/admin/ExamConfigForm";

export default function AdminConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Konfigurasi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pengaturan AI dan konfigurasi default exam
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AIConfigForm />
        <ExamConfigForm />
      </div>
    </div>
  );
}
