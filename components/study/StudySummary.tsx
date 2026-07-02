"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface StudySummaryProps {
  total: number;
  correct: number;
  wrong: number;
  onBackToDashboard: () => void;
}

export function StudySummary({
  total,
  correct,
  wrong,
  onBackToDashboard,
}: StudySummaryProps) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold text-center mb-6">
          Latihan Selesai! 🎉
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold">{total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold">{accuracy}%</div>
            <div className="text-sm text-muted-foreground">Akurasi</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{correct}</div>
            <div className="text-sm text-muted-foreground">Benar</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{wrong}</div>
            <div className="text-sm text-muted-foreground">Salah</div>
          </div>
        </div>

        <Button onClick={onBackToDashboard} className="w-full">
          Kembali ke Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
