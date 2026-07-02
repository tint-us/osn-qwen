"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResumeSessionModalProps {
  filter: { tingkat?: string; level?: string; matpels?: string[] };
  currentBatch: number;
  totalBatches: number;
  onResume: () => void;
  onAbandon: () => void;
}

export function ResumeSessionModal({
  filter,
  currentBatch,
  totalBatches,
  onResume,
  onAbandon,
}: ResumeSessionModalProps) {
  const matpelsStr = filter.matpels?.join(", ") || "-";
  const remaining = totalBatches - currentBatch;

  return (
    <Card className="w-full max-w-md mx-auto border-primary">
      <CardHeader>
        <CardTitle className="text-xl">Sesi Ujian Belum Selesai</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Anda memiliki sesi ujian yang belum selesai.
        </p>

        <div className="rounded-lg border p-3 space-y-1 text-sm">
          <div>
            <span className="font-medium">Filter: </span>
            {filter.tingkat} / {filter.level} / {matpelsStr}
          </div>
          <div>
            <span className="font-medium">Batch tersisa: </span>
            {remaining} dari {totalBatches}
          </div>
          <div>
            <span className="font-medium">Batch terakhir: </span>
            Batch {currentBatch + 1}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Catatan: Mulai baru akan membatalkan sesi saat ini.
        </p>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onAbandon}>
            Mulai Baru
          </Button>
          <Button className="flex-1" onClick={onResume}>
            Resume
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
