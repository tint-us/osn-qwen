import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SubjectAccuracyItem {
  matpel: string;
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
}

interface SubjectAccuracyChartProps {
  data: SubjectAccuracyItem[];
}

function getBarColor(accuracy: number): string {
  if (accuracy >= 70) return "bg-green-500";
  if (accuracy >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export function SubjectAccuracyChart({ data }: SubjectAccuracyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Akurasi per Mata Pelajaran</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Belum ada data study. Mulai latihan di Study Mode untuk melihat statistik.
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.matpel} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.matpel}</span>
                  <span className="text-muted-foreground">
                    {item.totalCorrect}/{item.totalAttempts} benar ({item.accuracy}%)
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(
                      item.accuracy
                    )}`}
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
