import type { RawQuestion } from "./parsers";
import { prisma } from "@/lib/prisma";
import { Prisma, type Tingkat, type Level, type QuestionType } from "@prisma/client";

const VALID_TINGKAT = ["SD", "SMP", "SMA"];
const VALID_LEVEL = ["OSNK", "OSNP", "SEMIFINAL", "FINAL"];
const VALID_QUESTION_TYPE = ["MULTIPLE_CHOICE", "SHORT_ANSWER", "ESSAY"];

const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const HTML_TAG_REGEX = /<[^>]*>/g;

export function sanitizeText(text: string): string {
  if (!text) return "";
  let result = text;
  result = result.replace(SCRIPT_TAG_REGEX, "");
  result = result.replace(HTML_TAG_REGEX, "");
  return result.trim();
}

export interface ValidatedQuestion {
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

export interface ValidationResult {
  index: number;
  isValid: boolean;
  errors: string[];
  question: ValidatedQuestion;
}

function validateQuestion(raw: RawQuestion, index: number): ValidationResult {
  const errors: string[] = [];

  const tingkat = (raw.tingkat || "").toUpperCase().trim();
  const level = (raw.level || "").toUpperCase().trim();
  const matpel = sanitizeText(raw.matpel || "");
  const questionType = (raw.questionType || "").toUpperCase().trim();
  const content = sanitizeText(raw.content || "");
  const explanation = sanitizeText(raw.explanation || "");
  const imageUrl = raw.imageUrl ? sanitizeText(raw.imageUrl) : null;

  const options = Array.isArray(raw.options)
    ? raw.options.map((o) => sanitizeText(String(o)))
    : [];
  const acceptableAnswers = Array.isArray(raw.acceptableAnswers)
    ? raw.acceptableAnswers.map((a) => sanitizeText(String(a)))
    : [];

  let correctOption: number | null = null;
  if (raw.correctOption !== null && raw.correctOption !== undefined) {
    correctOption = typeof raw.correctOption === "number" ? raw.correctOption : parseInt(String(raw.correctOption), 10);
    if (isNaN(correctOption)) correctOption = null;
  }

  if (!tingkat) {
    errors.push("Field tingkat wajib diisi");
  } else if (!VALID_TINGKAT.includes(tingkat)) {
    errors.push(`Tingkat tidak valid: ${tingkat}. Gunakan SD, SMP, atau SMA`);
  }

  if (!level) {
    errors.push("Field level wajib diisi");
  } else if (!VALID_LEVEL.includes(level)) {
    errors.push(`Level tidak valid: ${level}. Gunakan OSNK, OSNP, SEMIFINAL, atau FINAL`);
  }

  if (!matpel) {
    errors.push("Field matpel wajib diisi");
  }

  if (!questionType) {
    errors.push("Field questionType wajib diisi");
  } else if (!VALID_QUESTION_TYPE.includes(questionType)) {
    errors.push(
      `QuestionType tidak valid: ${questionType}. Gunakan MULTIPLE_CHOICE, SHORT_ANSWER, atau ESSAY`
    );
  }

  if (!content) {
    errors.push("Field content wajib diisi");
  }

  if (!explanation) {
    errors.push("Field explanation wajib diisi");
  }

  if (questionType === "MULTIPLE_CHOICE") {
    if (options.length < 2) {
      errors.push("MULTIPLE_CHOICE wajib memiliki minimal 2 options");
    }
    if (correctOption === null) {
      errors.push("MULTIPLE_CHOICE wajib memiliki correctOption");
    } else if (correctOption < 0 || correctOption >= options.length) {
      errors.push(
        `correctOption ${correctOption} di luar range options (0-${options.length - 1})`
      );
    }
  } else if (questionType === "SHORT_ANSWER" || questionType === "ESSAY") {
    if (acceptableAnswers.length === 0) {
      errors.push(`${questionType} wajib memiliki minimal 1 acceptableAnswer`);
    }
    if (correctOption !== null) {
      correctOption = null;
    }
    if (options.length > 0) {
      options.length = 0;
    }
  }

  return {
    index,
    isValid: errors.length === 0,
    errors,
    question: {
      tingkat,
      level,
      matpel,
      questionType,
      content,
      options,
      correctOption,
      acceptableAnswers,
      explanation,
      imageUrl,
    },
  };
}

export function validateQuestions(raws: RawQuestion[]): ValidationResult[] {
  return raws.map((raw, index) => validateQuestion(raw, index));
}

export function revalidateForInsert(question: ValidatedQuestion): boolean {
  if (!VALID_TINGKAT.includes(question.tingkat)) return false;
  if (!VALID_LEVEL.includes(question.level)) return false;
  if (!VALID_QUESTION_TYPE.includes(question.questionType)) return false;
  if (!question.content) return false;
  if (!question.explanation) return false;
  if (!question.matpel) return false;

  if (question.questionType === "MULTIPLE_CHOICE") {
    if (question.options.length < 2) return false;
    if (question.correctOption === null) return false;
    if (question.correctOption < 0 || question.correctOption >= question.options.length)
      return false;
  } else {
    if (question.acceptableAnswers.length === 0) return false;
  }

  return true;
}

export async function bulkInsertQuestions(
  questions: ValidatedQuestion[]
): Promise<number> {
  const data = questions.map((q) => ({
    tingkat: q.tingkat as Tingkat,
    level: q.level as Level,
    matpel: q.matpel,
    questionType: q.questionType as QuestionType,
    content: q.content,
    imageUrl: q.imageUrl,
    options: q.options as unknown as Prisma.InputJsonValue,
    correctOption: q.correctOption,
    acceptableAnswers: q.acceptableAnswers,
    explanation: q.explanation,
  }));

  const result = await prisma.$transaction(
    data.map((d) => prisma.question.create({ data: d }))
  );

  return result.length;
}
