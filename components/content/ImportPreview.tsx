"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PreviewData, PreviewQuestionData } from "./ImportUploader";

const ITEMS_PER_PAGE = 50;

interface ImportPreviewProps {
  data: PreviewData;
  onConfirm: (count: number) => void;
  onReset: () => void;
}

export function ImportPreview({ data, onConfirm, onReset }: ImportPreviewProps) {
  const [selected, setSelected] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    data.questions.forEach((q) => {
      if (q.isValid) initial.add(q.index);
    });
    return initial;
  });
  const [page, setPage] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(data.questions.length / ITEMS_PER_PAGE);
  const pageItems = useMemo(
    () =>
      data.questions.slice(
        page * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
      ),
    [data.questions, page]
  );

  function toggleSelect(index: number) {
    const next = new Set(selected);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelected(next);
  }

  function toggleAllPage() {
    const allOnPageSelected = pageItems.every((q) => selected.has(q.index));
    const next = new Set(selected);
    if (allOnPageSelected) {
      pageItems.forEach((q) => {
        if (q.isValid) next.delete(q.index);
      });
    } else {
      pageItems.forEach((q) => {
        if (q.isValid) next.add(q.index);
      });
    }
    setSelected(next);
  }

  async function handleImport() {
    const questionsToImport = data.questions
      .filter((q) => selected.has(q.index) && q.isValid)
      .map((q) => q.question);

    if (questionsToImport.length === 0) {
      setError("Pilih minimal satu soal yang valid");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: questionsToImport }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Import gagal");
        return;
      }

      onConfirm(result.data.imported as number);
    } catch {
      setError("Terjadi kesalahan saat mengimport soal");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Preview Import</CardTitle>
            <div className="mt-2 flex gap-2">
              <Badge variant="default">
                {data.validCount} Valid
              </Badge>
              {data.invalidCount > 0 && (
                <Badge variant="destructive">
                  {data.invalidCount} Error
                </Badge>
              )}
              <Badge variant="secondary">
                {selected.size} Dipilih
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={isImporting}
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={isImporting || selected.size === 0}
            >
              {isImporting ? "Mengimport..." : `Import ${selected.size} Soal`}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="mb-3 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={
                pageItems.length > 0 &&
                pageItems.every((q) => !q.isValid || selected.has(q.index))
              }
              onChange={toggleAllPage}
              className="h-4 w-4 rounded border-input"
            />
            Pilih semua di halaman ini
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-3"></th>
                <th className="pb-2 pr-3 font-medium">#</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 pr-3 font-medium">Tingkat</th>
                <th className="pb-2 pr-3 font-medium">Level</th>
                <th className="pb-2 pr-3 font-medium">Matpel</th>
                <th className="pb-2 pr-3 font-medium">Tipe</th>
                <th className="pb-2 pr-3 font-medium">Konten</th>
                <th className="pb-2 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((q) => (
                <PreviewRow
                  key={q.index}
                  item={q}
                  isSelected={selected.has(q.index)}
                  onToggle={() => toggleSelect(q.index)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {page + 1} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PreviewRow({
  item,
  isSelected,
  onToggle,
}: {
  item: PreviewQuestionData;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const contentPreview =
    item.question.content.length > 80
      ? item.question.content.slice(0, 80) + "..."
      : item.question.content;

  return (
    <tr className="border-b">
      <td className="py-2 pr-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          disabled={!item.isValid}
          className="h-4 w-4 rounded border-input"
        />
      </td>
      <td className="py-2 pr-3 text-muted-foreground">{item.index + 1}</td>
      <td className="py-2 pr-3">
        {item.isValid ? (
          <Badge variant="success">Valid</Badge>
        ) : (
          <Badge variant="destructive">Error</Badge>
        )}
      </td>
      <td className="py-2 pr-3">{item.question.tingkat || "—"}</td>
      <td className="py-2 pr-3">{item.question.level || "—"}</td>
      <td className="py-2 pr-3">{item.question.matpel || "—"}</td>
      <td className="py-2 pr-3">
        {item.question.questionType || "—"}
      </td>
      <td className="py-2 pr-3 max-w-xs">{contentPreview}</td>
      <td className="py-2">
        {item.errors.length > 0 ? (
          <span className="text-xs text-destructive">
            {item.errors.join("; ")}
          </span>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}
