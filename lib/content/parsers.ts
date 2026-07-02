import Papa from "papaparse";
import { XMLParser } from "fast-xml-parser";

export interface RawQuestion {
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
}

function parseJsonArrayField(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "[]") return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v));
      }
    } catch {
      return [trimmed];
    }
  }
  return [];
}

function parseCorrectOption(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed.toLowerCase() === "null") return null;
    const num = parseInt(trimmed, 10);
    if (!isNaN(num)) return num;
  }
  return null;
}

export function parseCSV(text: string): RawQuestion[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    throw new Error(`Format CSV tidak valid: ${result.errors[0].message}`);
  }

  return result.data.map((row) => ({
    tingkat: (row.tingkat || "").trim(),
    level: (row.level || "").trim(),
    matpel: (row.matpel || "").trim(),
    questionType: (row.questionType || "").trim(),
    content: (row.content || "").trim(),
    options: parseJsonArrayField(row.options),
    correctOption: parseCorrectOption(row.correctOption),
    acceptableAnswers: parseJsonArrayField(row.acceptableAnswers),
    explanation: (row.explanation || "").trim(),
    imageUrl: row.imageUrl && row.imageUrl.trim() !== "" ? row.imageUrl.trim() : null,
  }));
}

export function parseJSON(text: string): RawQuestion[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Format JSON tidak valid: ${e instanceof Error ? e.message : "parse error"}`
    );
  }

  if (!Array.isArray(data)) {
    throw new Error("Format JSON tidak valid: root harus berupa array");
  }

  return data.map((row: Record<string, unknown>) => ({
    tingkat: String(row.tingkat || "").trim(),
    level: String(row.level || "").trim(),
    matpel: String(row.matpel || "").trim(),
    questionType: String(row.questionType || "").trim(),
    content: String(row.content || "").trim(),
    options: parseJsonArrayField(row.options),
    correctOption: parseCorrectOption(row.correctOption),
    acceptableAnswers: parseJsonArrayField(row.acceptableAnswers),
    explanation: String(row.explanation || "").trim(),
    imageUrl:
      row.imageUrl && String(row.imageUrl).trim() !== ""
        ? String(row.imageUrl).trim()
        : null,
  }));
}

export function parseXML(text: string): RawQuestion[] {
  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
  });

  let parsed: unknown;
  try {
    parsed = parser.parse(text);
  } catch (e) {
    throw new Error(
      `Format XML tidak valid: ${e instanceof Error ? e.message : "parse error"}`
    );
  }

  const root = parsed as { questions?: { question?: unknown } };
  if (!root.questions || !root.questions.question) {
    throw new Error("Format XML tidak valid: elemen <questions> tidak ditemukan");
  }

  const questions = Array.isArray(root.questions.question)
    ? root.questions.question
    : [root.questions.question];

  return questions.map((row: Record<string, unknown>) => ({
    tingkat: String(row.tingkat || "").trim(),
    level: String(row.level || "").trim(),
    matpel: String(row.matpel || "").trim(),
    questionType: String(row.questionType || "").trim(),
    content: String(row.content || "").trim(),
    options: parseJsonArrayField(row.options),
    correctOption: parseCorrectOption(row.correctOption),
    acceptableAnswers: parseJsonArrayField(row.acceptableAnswers),
    explanation: String(row.explanation || "").trim(),
    imageUrl:
      row.imageUrl && String(row.imageUrl).trim() !== ""
        ? String(row.imageUrl).trim()
        : null,
  }));
}

export function parseFile(text: string, format: "csv" | "json" | "xml"): RawQuestion[] {
  switch (format) {
    case "csv":
      return parseCSV(text);
    case "json":
      return parseJSON(text);
    case "xml":
      return parseXML(text);
    default:
      throw new Error("Format tidak didukung");
  }
}
