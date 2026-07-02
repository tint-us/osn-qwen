"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExamConfig {
  defaultBatchSize: number;
  defaultTimerEnabled: boolean;
  defaultTimerDuration: number;
}

export function ExamConfigForm() {
  const [config, setConfig] = useState<ExamConfig>({
    defaultBatchSize: 10,
    defaultTimerEnabled: false,
    defaultTimerDuration: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/admin/config");
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Gagal memuat config");
        setConfig(json.data.examConfig);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examConfig: config }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menyimpan config");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="h-8 animate-pulse rounded bg-muted" />
            <div className="h-8 animate-pulse rounded bg-muted" />
            <div className="h-8 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Konfigurasi Exam</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-md border border-green-500 bg-green-500/10 p-3">
              <p className="text-sm text-green-600">
                Konfigurasi Exam berhasil disimpan
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Default Batch Size</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={config.defaultBatchSize}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  defaultBatchSize: Number(e.target.value),
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Jumlah soal per batch (1-100)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Timer Enabled</Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={config.defaultTimerEnabled}
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    defaultTimerEnabled: !prev.defaultTimerEnabled,
                  }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  config.defaultTimerEnabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform ${
                    config.defaultTimerEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm text-muted-foreground">
                {config.defaultTimerEnabled ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default Timer Duration (menit)</Label>
            <Input
              type="number"
              min={1}
              value={config.defaultTimerDuration}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  defaultTimerDuration: Number(e.target.value),
                }))
              }
              disabled={!config.defaultTimerEnabled}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Konfigurasi Exam"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
