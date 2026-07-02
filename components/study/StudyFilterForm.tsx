"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

export function StudyFilterForm() {
  const router = useRouter();
  const [tingkat, setTingkat] = useState("");
  const [level, setLevel] = useState("");
  const [matpels, setMatpels] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);

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
    setIsStarting(true);
    const params = new URLSearchParams({
      tingkat,
      level,
      matpel: matpels.join(","),
    });
    router.push(`/study/session?${params.toString()}`);
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Pilih Filter Latihan</CardTitle>
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

        <Button
          onClick={handleStart}
          disabled={!canStart || isStarting}
          className="w-full"
        >
          {isStarting ? "Memuat..." : "Mulai Latihan"}
        </Button>
      </CardContent>
    </Card>
  );
}
