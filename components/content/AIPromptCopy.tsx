"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AI_PROMPT_TEXT = `Anda adalah asisten yang membantu mengkonversi soal-soal dari dokumen (PDF, Word, atau teks) ke format yang bisa diimport ke platform SoaLatihan.

Instruksi:
1. Baca soal-soal dalam dokumen yang diberikan.
2. Konversi setiap soal ke format JSON dengan struktur berikut:
   - tingkat: "SD" | "SMP" | "SMA"
   - level: "OSNK" | "OSNP" | "SEMIFINAL" | "FINAL"
   - matpel: nama mata pelajaran (contoh: "Matematika")
   - questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY"
   - content: isi soal (gunakan LaTeX dengan $...$ untuk inline dan $$...$$ untuk display)
   - options: array string untuk pilihan (kosong [] jika bukan MULTIPLE_CHOICE)
   - correctOption: index jawaban benar untuk MULTIPLE_CHOICE (null untuk tipe lain)
   - acceptableAnswers: array string jawaban yang diterima (kosong [] untuk MULTIPLE_CHOICE)
   - explanation: pembahasan singkat (gunakan LaTeX jika perlu)
   - imageUrl: URL gambar soal jika ada (null jika tidak ada)

Contoh format JSON:
[
  {
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Matematika",
    "questionType": "MULTIPLE_CHOICE",
    "content": "Hitung nilai dari $\\\\int_0^1 x^2 \\\\, dx$",
    "options": ["1/3", "1/2", "1", "0"],
    "correctOption": 0,
    "acceptableAnswers": [],
    "explanation": "Integral dari $x^2$ adalah $\\\\frac{x^3}{3}$, evaluasi dari 0 ke 1 memberikan $\\\\frac{1}{3}$.",
    "imageUrl": null
  }
]

Pastikan:
- Setiap soal memiliki semua field wajib (tingkat, level, matpel, questionType, content, explanation).
- MULTIPLE_CHOICE wajib memiliki minimal 2 options dan correctOption yang valid.
- SHORT_ANSWER dan ESSAY wajib memiliki minimal 1 acceptableAnswer.
- Notasi LaTeX gunakan $...$ untuk inline dan $$...$$ untuk display.
- Output harus berupa array JSON yang valid.`;

export function AIPromptCopy() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(AI_PROMPT_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text for manual copy
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">AI Prompt untuk Konversi Soal</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Gunakan prompt ini dengan AI (ChatGPT, Claude, Gemini) untuk mengkonversi soal dari PDF/dokumen ke format import.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? "Tersalin!" : "Salin Prompt"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="max-h-80 overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap">
          {AI_PROMPT_TEXT}
        </pre>
      </CardContent>
    </Card>
  );
}
