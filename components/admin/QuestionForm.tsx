"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionDisplay } from "@/components/shared/QuestionDisplay";

export interface QuestionFormData {
  tingkat: string;
  level: string;
  matpel: string;
  questionType: string;
  content: string;
  imageUrl: string | null;
  options: string[];
  correctOption: number | null;
  acceptableAnswers: string[];
  explanation: string;
}

interface QuestionFormProps {
  questionId?: number | null;
  onSaved: () => void;
  onCancel: () => void;
}

const EMPTY_FORM: QuestionFormData = {
  tingkat: "SD",
  level: "OSNK",
  matpel: "",
  questionType: "MULTIPLE_CHOICE",
  content: "",
  imageUrl: null,
  options: ["", ""],
  correctOption: 0,
  acceptableAnswers: [],
  explanation: "",
};

export function QuestionForm({ questionId, onSaved, onCancel }: QuestionFormProps) {
  const [form, setForm] = useState<QuestionFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const isEditing = questionId != null;

  const fetchQuestion = useCallback(async () => {
    if (!questionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/questions/${questionId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal memuat soal");
      const q = json.data;
      setForm({
        tingkat: q.tingkat,
        level: q.level,
        matpel: q.matpel,
        questionType: q.questionType,
        content: q.content,
        imageUrl: q.imageUrl,
        options: Array.isArray(q.options) ? q.options : ["", ""],
        correctOption: q.correctOption,
        acceptableAnswers: Array.isArray(q.acceptableAnswers)
          ? q.acceptableAnswers
          : [],
        explanation: q.explanation,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    if (questionId) {
      fetchQuestion();
    }
  }, [questionId, fetchQuestion]);

  function updateField<K extends keyof QuestionFormData>(
    key: K,
    value: QuestionFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateOption(index: number, value: string) {
    setForm((prev) => {
      const options = [...prev.options];
      options[index] = value;
      return { ...prev, options };
    });
  }

  function addOption() {
    setForm((prev) => ({ ...prev, options: [...prev.options, ""] }));
  }

  function removeOption(index: number) {
    setForm((prev) => {
      const options = prev.options.filter((_, i) => i !== index);
      const correctOption =
        prev.correctOption === index
          ? 0
          : prev.correctOption !== null && prev.correctOption > index
            ? prev.correctOption - 1
            : prev.correctOption;
      return { ...prev, options, correctOption };
    });
  }

  function updateAcceptableAnswer(index: number, value: string) {
    setForm((prev) => {
      const acceptableAnswers = [...prev.acceptableAnswers];
      acceptableAnswers[index] = value;
      return { ...prev, acceptableAnswers };
    });
  }

  function addAcceptableAnswer() {
    setForm((prev) => ({
      ...prev,
      acceptableAnswers: [...prev.acceptableAnswers, ""],
    }));
  }

  function removeAcceptableAnswer(index: number) {
    setForm((prev) => ({
      ...prev,
      acceptableAnswers: prev.acceptableAnswers.filter((_, i) => i !== index),
    }));
  }

  function handleQuestionTypeChange(type: string) {
    setForm((prev) => ({
      ...prev,
      questionType: type,
      options: type === "MULTIPLE_CHOICE" ? prev.options.length >= 2 ? prev.options : ["", ""] : [],
      correctOption: type === "MULTIPLE_CHOICE" ? prev.correctOption ?? 0 : null,
      acceptableAnswers: type !== "MULTIPLE_CHOICE" ? prev.acceptableAnswers : [],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);

    const payload = {
      tingkat: form.tingkat,
      level: form.level,
      matpel: form.matpel,
      questionType: form.questionType,
      content: form.content,
      imageUrl: form.imageUrl,
      options: form.questionType === "MULTIPLE_CHOICE" ? form.options.filter((o) => o.trim()) : [],
      correctOption: form.questionType === "MULTIPLE_CHOICE" ? form.correctOption : null,
      acceptableAnswers:
        form.questionType !== "MULTIPLE_CHOICE"
          ? form.acceptableAnswers.filter((a) => a.trim())
          : [],
      explanation: form.explanation,
    };

    const url = isEditing
      ? `/api/admin/questions/${questionId}`
      : "/api/admin/questions";
    const method = isEditing ? "PATCH" : "POST";

    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        if (res.status === 400) {
          setValidationErrors([json.error]);
        } else {
          throw new Error(json.error || "Gagal menyimpan soal");
        }
        return;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEditing ? "Edit Soal" : "Tambah Soal Baru"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && isEditing ? (
          <div className="space-y-2">
            <div className="h-8 animate-pulse rounded bg-muted" />
            <div className="h-8 animate-pulse rounded bg-muted" />
            <div className="h-8 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            {validationErrors.length > 0 && (
              <div className="rounded-md border border-destructive bg-destructive/10 p-3">
                {validationErrors.map((err, i) => (
                  <p key={i} className="text-sm text-destructive">{err}</p>
                ))}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Tingkat</Label>
                <select
                  value={form.tingkat}
                  onChange={(e) => updateField("tingkat", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <select
                  value={form.level}
                  onChange={(e) => updateField("level", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="OSNK">OSNK</option>
                  <option value="OSNP">OSNP</option>
                  <option value="SEMIFINAL">Semifinal</option>
                  <option value="FINAL">Final</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Matpel</Label>
                <Input
                  value={form.matpel}
                  onChange={(e) => updateField("matpel", e.target.value)}
                  placeholder="Matematika"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipe Soal</Label>
                <select
                  value={form.questionType}
                  onChange={(e) => handleQuestionTypeChange(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="ESSAY">Essay</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Konten Soal</Label>
              <textarea
                value={form.content}
                onChange={(e) => updateField("content", e.target.value)}
                placeholder="Tulis soal di sini. Gunakan $...$ untuk inline math atau $$...$$ untuk display math."
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <Label className="mb-2 block text-xs text-muted-foreground">
                Preview (KaTeX)
              </Label>
              <div className="min-h-[2rem] text-sm">
                {form.content ? (
                  <QuestionDisplay content={form.content} />
                ) : (
                  <span className="text-muted-foreground">
                    Preview akan muncul di sini...
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL Gambar (opsional)</Label>
              <Input
                value={form.imageUrl ?? ""}
                onChange={(e) =>
                  updateField("imageUrl", e.target.value || null)
                }
                placeholder="/uploads/questions/image.png"
              />
            </div>

            {form.questionType === "MULTIPLE_CHOICE" && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="space-y-2">
                  {form.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={form.correctOption === index}
                        onChange={() => updateField("correctOption", index)}
                        className="h-4 w-4"
                      />
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      {form.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                >
                  + Tambah Option
                </Button>
              </div>
            )}

            {form.questionType !== "MULTIPLE_CHOICE" && (
              <div className="space-y-2">
                <Label>Acceptable Answers</Label>
                <div className="space-y-2">
                  {form.acceptableAnswers.map((answer, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={answer}
                        onChange={(e) =>
                          updateAcceptableAnswer(index, e.target.value)
                        }
                        placeholder={`Jawaban yang diterima ${index + 1}`}
                      />
                      {form.acceptableAnswers.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAcceptableAnswer(index)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAcceptableAnswer}
                >
                  + Tambah Jawaban
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label>Pembahasan</Label>
              <textarea
                value={form.explanation}
                onChange={(e) => updateField("explanation", e.target.value)}
                placeholder="Pembahasan jawaban. Mendukung LaTeX."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <Label className="mb-2 block text-xs text-muted-foreground">
                Preview Pembahasan (KaTeX)
              </Label>
              <div className="min-h-[2rem] text-sm">
                {form.explanation ? (
                  <QuestionDisplay content={form.explanation} />
                ) : (
                  <span className="text-muted-foreground">
                    Preview akan muncul di sini...
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Menyimpan..."
                  : isEditing
                    ? "Simpan Perubahan"
                    : "Tambah Soal"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
