"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TINGKAT_OPTIONS = ["SD", "SMP", "SMA"] as const;
const LEVEL_OPTIONS = ["OSNK", "OSNP", "SEMIFINAL", "FINAL"] as const;
const MATPEL_OPTIONS = [
  "Matematika",
  "Fisika",
  "Kimia",
  "Biologi",
  "Astronomi",
  "Informatika",
  "Geografi",
  "Ekonomi",
  "Kebumian",
];

interface ExamSetupProps {
  onStart: (config: {
    filter: { tingkat: string; level: string; matpels: string[] };
    batchSize: number;
    timerEnabled: boolean;
    timerDuration: number;
  }) => void;
  isLoading?: boolean;
}

export function ExamSetup({ onStart, isLoading }: ExamSetupProps) {
  const [tingkat, setTingkat] = useState("");
  const [level, setLevel] = useState("");
  const [matpels, setMatpels] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState(10);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(30);

  const canStart = tingkat && level && matpels.length > 0;

  function toggleMatpel(matpel: string) {
    setMatpels((prev) =>
      prev.includes(matpel)
        ? prev.filter((m) => m !== matpel)
        : [...prev, matpel]
    );
  }

  function handleStart() {
    if (!canStart) return;
    onStart({
      filter: { tingkat, level, matpels },
      batchSize,
      timerEnabled,
      timerDuration,
    });
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Setup Exam</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Tingkat</Label>
          <div className="flex gap-2">
            {TINGKAT_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTingkat(t)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  tingkat === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Level</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LEVEL_OPTIONS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  level === l
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Mata Pelajaran</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MATPEL_OPTIONS.map((m) => (
              <label
                key={m}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                  matpels.includes(m)
                    ? "border-primary bg-accent"
                    : "hover:bg-accent/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={matpels.includes(m)}
                  onChange={() => toggleMatpel(m)}
                  className="h-4 w-4 accent-primary"
                />
                {m}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Batch Size: {batchSize} soal per batch</Label>
          <input
            type="range"
            min={10}
            max={30}
            step={1}
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTimerEnabled(!timerEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                timerEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  timerEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <Label>Timer {timerEnabled ? "ON" : "OFF"}</Label>
          </div>

          {timerEnabled && (
            <div className="flex items-center gap-2">
              <Label htmlFor="timerDuration">Durasi (menit):</Label>
              <Input
                id="timerDuration"
                type="number"
                min={1}
                max={180}
                value={timerDuration}
                onChange={(e) =>
                  setTimerDuration(Math.max(1, Math.min(180, Number(e.target.value))))
                }
                className="w-24"
              />
            </div>
          )}
        </div>

        <Button
          onClick={handleStart}
          disabled={!canStart || isLoading}
          className="w-full"
        >
          {isLoading ? "Memuat..." : "Mulai Ujian"}
        </Button>
      </CardContent>
    </Card>
  );
}
