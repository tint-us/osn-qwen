"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BatchScoreItem {
  index: number;
  batchIndex: number;
  score: number;
  submittedAt: string;
  sessionDate: string;
  sessionFilter: {
    tingkat: string;
    level: string;
    matpels: string[];
  };
}

interface BatchScoreChartProps {
  data: BatchScoreItem[];
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 220;
const PADDING = { top: 20, right: 20, bottom: 30, left: 40 };
const Y_TICKS = [0, 25, 50, 75, 100];

export function BatchScoreChart({ data }: BatchScoreChartProps) {
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  function getX(index: number) {
    if (data.length <= 1) return PADDING.left + plotWidth / 2;
    return PADDING.left + (index / (data.length - 1)) * plotWidth;
  }

  function getY(score: number) {
    return PADDING.top + plotHeight - (score / 100) * plotHeight;
  }

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(d.index)} ${getY(d.score)}`)
    .join(" ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Perjalanan Skor Batch</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Belum ada data skor batch. Selesaikan batch exam untuk melihat grafik.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="w-full"
              style={{ minWidth: 400 }}
            >
              {/* Y-axis grid lines */}
              {Y_TICKS.map((tick) => (
                <g key={tick}>
                  <line
                    x1={PADDING.left}
                    y1={getY(tick)}
                    x2={CHART_WIDTH - PADDING.right}
                    y2={getY(tick)}
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                    strokeDasharray={tick === 0 ? "0" : "4 4"}
                  />
                  <text
                    x={PADDING.left - 8}
                    y={getY(tick) + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {tick}
                  </text>
                </g>
              ))}

              {/* Line path */}
              <path
                d={linePath}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Area under the line */}
              {data.length > 1 && (
                <path
                  d={`${linePath} L ${getX(data[data.length - 1].index)} ${getY(0)} L ${getX(data[0].index)} ${getY(0)} Z`}
                  fill="hsl(var(--primary))"
                  opacity={0.08}
                />
              )}

              {/* Data points */}
              {data.map((d) => (
                <g key={`point-${d.index}`}>
                  <circle
                    cx={getX(d.index)}
                    cy={getY(d.score)}
                    r={4}
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    <title>
                      {`Batch ${d.batchIndex}: ${d.score}%\n${new Date(
                        d.submittedAt
                      ).toLocaleDateString("id-ID")}`}
                    </title>
                  </circle>
                </g>
              ))}

              {/* X-axis labels */}
              {data.map((d, i) => {
                if (data.length > 10 && i % Math.ceil(data.length / 8) !== 0)
                  return null;
                return (
                  <text
                    key={`x-${d.index}`}
                    x={getX(d.index)}
                    y={CHART_HEIGHT - 8}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {d.batchIndex}
                  </text>
                );
              })}
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
