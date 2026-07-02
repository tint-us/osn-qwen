"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportUploader, type PreviewData } from "@/components/content/ImportUploader";
import { ImportPreview } from "@/components/content/ImportPreview";
import { AIPromptCopy } from "@/components/content/AIPromptCopy";

export default function ImportPage() {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  function handlePreview(data: PreviewData) {
    setImportedCount(null);
    setPreviewData(data);
  }

  function handleConfirm(count: number) {
    setImportedCount(count);
    setPreviewData(null);
  }

  function handleReset() {
    setPreviewData(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Soal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload file CSV, JSON, atau XML untuk mengimport soal secara massal.
        </p>
      </div>

      {importedCount !== null && (
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">
                  Berhasil mengimport {importedCount} soal
                </p>
                <p className="text-sm text-muted-foreground">
                  Soal telah ditambahkan ke bank soal.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportedCount(null)}
            >
              Import Lagi
            </Button>
          </CardContent>
        </Card>
      )}

      {importedCount === null && !previewData && <ImportUploader onPreview={handlePreview} />}

      {previewData && (
        <ImportPreview
          data={previewData}
          onConfirm={handleConfirm}
          onReset={handleReset}
        />
      )}

      <AIPromptCopy />
    </div>
  );
}
