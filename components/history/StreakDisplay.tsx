import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  currentStreak: number;
  lastActiveDate: string | null;
  milestones: Record<string, boolean>;
}

const MILESTONE_DAYS = [3, 7, 14, 30];

function formatLastActive(dateStr: string | null): string {
  if (!dateStr) return "Belum mulai";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function StreakDisplay({
  currentStreak,
  lastActiveDate,
  milestones,
}: StreakDisplayProps) {
  return (
    <Card className="overflow-hidden border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 dark:border-orange-900 dark:from-orange-950/30 dark:to-yellow-950/20">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-3xl",
              currentStreak > 0
                ? "bg-orange-100 dark:bg-orange-900/40"
                : "bg-muted"
            )}
          >
            {currentStreak > 0 ? "🔥" : "💤"}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Streak Harian
            </p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {currentStreak} hari
            </p>
            <p className="text-xs text-muted-foreground">
              {currentStreak > 0
                ? `Terakhir aktif: ${formatLastActive(lastActiveDate)}`
                : "Mulai latihan hari ini untuk memulai streak!"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          {MILESTONE_DAYS.map((day) => {
            const achieved = milestones[String(day)];
            return (
              <div
                key={day}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg border p-2 text-center",
                  achieved
                    ? "border-orange-300 bg-orange-100 dark:border-orange-700 dark:bg-orange-900/30"
                    : "border-border bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-bold",
                    achieved
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-muted-foreground"
                  )}
                >
                  {day} hari
                </span>
                <span className="text-sm">{achieved ? "✅" : "⭕"}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
