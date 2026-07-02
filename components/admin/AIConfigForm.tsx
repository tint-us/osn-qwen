"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AIConfig {
  apiKey: string;
  baseUrl: string;
  systemPrompt: string;
}

export function AIConfigForm() {
  const [config, setConfig] = useState<AIConfig>({
    apiKey: "",
    baseUrl: "",
    systemPrompt: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/admin/config");
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Gagal memuat config");
        setConfig({
          apiKey: json.data.aiConfig.apiKey,
          baseUrl: json.data.aiConfig.baseUrl,
          systemPrompt: json.data.aiConfig.systemPrompt,
        });
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
        body: JSON.stringify({
          aiConfig: {
            apiKey: config.apiKey === "••••••••" ? undefined : config.apiKey,
            baseUrl: config.baseUrl,
            systemPrompt: config.systemPrompt,
          },
        }),
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
            <div className="h-20 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Konfigurasi AI</CardTitle>
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
              <p className="text-sm text-green-600">Konfigurasi AI berhasil disimpan</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input
                type={showApiKey ? "text" : "password"}
                value={config.apiKey}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder="Masukkan API Key"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? "Sembunyikan" : "Lihat"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              API Key disimpan terenkripsi (AES-256-GCM) di database
            </p>
          </div>

          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input
              value={config.baseUrl}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, baseUrl: e.target.value }))
              }
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div className="space-y-2">
            <Label>System Prompt</Label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, systemPrompt: e.target.value }))
              }
              placeholder="System prompt untuk AI assistant"
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Konfigurasi AI"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
