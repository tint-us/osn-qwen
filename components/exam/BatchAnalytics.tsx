"use client";

import { Card, CardContent } from "@/components/ui/card";

interface BatchAnalyticsProps {
  batchScores: {
    batchIndex: number;
    score: number;
    totalCorrect: number;
    totalWrong: number;
  }[];
  currentBatchIndex: number;
}

export function BatchAnalytics({
  batchScores,
  currentBatchIndex,
}: BatchAnalyticsProps) {
  const maxScore = 100;

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold mb-4">Skor per Batch</h3>
        <div className="flex items-end gap-2 h-32">
          {batchScores.map((b) => {
            const isCurrent = b.batchIndex === currentBatchIndex;
            const height = `${(b.score / maxScore) * 100}%`;
            return (
              <div
                key={b.batchIndex}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-xs font-medium">
                  {b.score > 0 ? b.score.toFixed(0) : "-"}
                </span>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t ${
                      isCurrent ? "bg-primary" : "bg-primary/40"
                    }`}
                    style={{ height }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  B{b.batchIndex + 1}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
