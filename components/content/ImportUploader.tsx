"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ALLOWED_EXTENSIONS = [".csv", ".json", ".xml"];
const ALLOWED_MIME_TYPES = [
  "text/csv",
  "application/csv",
  "application/json",
  "text/json",
  "application/xml",
  "text/xml",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface PreviewQuestionData {
  index: number;
  isValid: boolean;
  errors: string[];
  question: {
    tingkat: string;
    level: string;
    matpel: string;
    questionType: string;
    content: string;
    options: string[];
    correctOption: number | null;
    acceptableAnswers: string[];
    explanation: string;
    imageUrl: string | null;
  };
}

export interface PreviewData {
  totalParsed: number;
  validCount: number;
  invalidCount: number;
  questions: PreviewQuestionData[];
}

interface ImportUploaderProps {
  onPreview: (data: PreviewData) => void;
}

export function ImportUploader({ onPreview }: ImportUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return "Format file tidak didukung. Gunakan .csv, .json, atau .xml";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Ukuran file maksimal 5MB";
    }

    if (file.size === 0) {
      return "File kosong";
    }

    const mime = file.type.toLowerCase();
    if (mime && !ALLOWED_MIME_TYPES.includes(mime)) {
      return "Tipe file tidak didukung. Gunakan CSV, JSON, atau XML";
    }

    return null;
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/import/preview", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error || "Gagal memproses file");
          return;
        }

        onPreview(data.data as PreviewData);
      } catch {
        setError("Terjadi kesalahan saat mengunggah file");
      } finally {
        setIsLoading(false);
      }
    },
    [onPreview, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <Card>
      <CardContent className="p-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30 hover:border-primary/50"
          )}
        >
          <svg
            className="h-12 w-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium">
              Tarik file ke sini atau klik untuk memilih
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Format: CSV, JSON, XML — Maks 5MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.json,.xml"
            onChange={handleChange}
            className="hidden"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Memproses file...</span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Pilih File
          </Button>
          <a href="/api/admin/import/template/csv" download>
            <Button variant="ghost" size="sm">
              Template CSV
            </Button>
          </a>
          <a href="/api/admin/import/template/json" download>
            <Button variant="ghost" size="sm">
              Template JSON
            </Button>
          </a>
          <a href="/api/admin/import/template/xml" download>
            <Button variant="ghost" size="sm">
              Template XML
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
