"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AnswerInputProps {
  type: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
  disabled: boolean;
}

export function AnswerInput({
  type,
  options,
  value,
  onChange,
  disabled,
}: AnswerInputProps) {
  if (type === "MULTIPLE_CHOICE") {
    return (
      <div className="space-y-2">
        {options.map((opt, i) => (
          <Label
            key={i}
            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent ${
              value === String(i) ? "border-primary bg-accent" : ""
            } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
          >
            <input
              type="radio"
              name="mc-answer"
              value={i}
              checked={value === String(i)}
              onChange={() => onChange(String(i))}
              disabled={disabled}
              className="h-4 w-4 accent-primary"
            />
            <span>{opt}</span>
          </Label>
        ))}
      </div>
    );
  }

  if (type === "SHORT_ANSWER") {
    return (
      <Input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Ketik jawaban Anda..."
      />
    );
  }

  return (
    <Input
      type="number"
      step="any"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="Masukkan angka jawaban..."
    />
  );
}
