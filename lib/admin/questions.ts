import { prisma } from "@/lib/prisma";
import { Prisma, type Tingkat, type Level, type QuestionType } from "@prisma/client";
import { sanitizeText } from "@/lib/content/validator";

const VALID_TINGKAT = ["SD", "SMP", "SMA"];
const VALID_LEVEL = ["OSNK", "OSNP", "SEMIFINAL", "FINAL"];
const VALID_QUESTION_TYPE = ["MULTIPLE_CHOICE", "SHORT_ANSWER", "ESSAY"];

const MAX_PAGE_SIZE = 100;
const CONTENT_PREVIEW_LENGTH = 80;

export interface QuestionListItem {
  id: number;
  tingkat: string;
  level: string;
  matpel: string;
  questionType: string;
  contentPreview: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface QuestionFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  tingkat?: string;
  level?: string;
  matpel?: string;
  questionType?: string;
}

export interface QuestionInput {
  tingkat: string;
  level: string;
  matpel: string;
  questionType: string;
  content: string;
  imageUrl?: string | null;
  options: string[];
  correctOption: number | null;
  acceptableAnswers: string[];
  explanation: string;
}

export interface QuestionValidationResult {
  isValid: boolean;
  errors: string[];
  data: QuestionInput | null;
}

function truncatePreview(text: string): string {
  if (text.length <= CONTENT_PREVIEW_LENGTH) return text;
  return text.slice(0, CONTENT_PREVIEW_LENGTH) + "...";
}

export function validateQuestionInput(input: QuestionInput): QuestionValidationResult {
  const errors: string[] = [];

  const tingkat = (input.tingkat || "").toUpperCase().trim();
  const level = (input.level || "").toUpperCase().trim();
  const matpel = sanitizeText(input.matpel || "");
  const questionType = (input.questionType || "").toUpperCase().trim();
  const content = sanitizeText(input.content || "");
  const explanation = sanitizeText(input.explanation || "");
  const imageUrl = input.imageUrl ? sanitizeText(input.imageUrl) : null;

  const options = Array.isArray(input.options)
    ? input.options.map((o) => sanitizeText(String(o)))
    : [];
  const acceptableAnswers = Array.isArray(input.acceptableAnswers)
    ? input.acceptableAnswers.map((a) => sanitizeText(String(a)))
    : [];

  let correctOption: number | null = input.correctOption;
  if (correctOption !== null && correctOption !== undefined) {
    if (typeof correctOption !== "number" || isNaN(correctOption)) {
      correctOption = null;
    }
  } else {
    correctOption = null;
  }

  if (!VALID_TINGKAT.includes(tingkat)) {
    errors.push("Tingkat tidak valid. Gunakan SD, SMP, atau SMA");
  }
  if (!VALID_LEVEL.includes(level)) {
    errors.push("Level tidak valid. Gunakan OSNK, OSNP, SEMIFINAL, atau FINAL");
  }
  if (!matpel) {
    errors.push("Matpel wajib diisi");
  }
  if (!VALID_QUESTION_TYPE.includes(questionType)) {
    errors.push("QuestionType tidak valid. Gunakan MULTIPLE_CHOICE, SHORT_ANSWER, atau ESSAY");
  }
  if (!content) {
    errors.push("Content wajib diisi");
  }
  if (!explanation) {
    errors.push("Explanation wajib diisi");
  }

  if (questionType === "MULTIPLE_CHOICE") {
    if (options.length < 2) {
      errors.push("MULTIPLE_CHOICE wajib memiliki minimal 2 options");
    }
    if (correctOption === null) {
      errors.push("MULTIPLE_CHOICE wajib memiliki correctOption");
    } else if (correctOption < 0 || correctOption >= options.length) {
      errors.push(`correctOption di luar range (0-${options.length - 1})`);
    }
  } else {
    if (acceptableAnswers.length === 0) {
      errors.push(`${questionType} wajib memiliki minimal 1 acceptableAnswer`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors, data: null };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      tingkat,
      level,
      matpel,
      questionType,
      content,
      imageUrl,
      options: questionType === "MULTIPLE_CHOICE" ? options : [],
      correctOption: questionType === "MULTIPLE_CHOICE" ? correctOption : null,
      acceptableAnswers: questionType !== "MULTIPLE_CHOICE" ? acceptableAnswers : [],
      explanation,
    },
  };
}

export async function getQuestions(filter: QuestionFilter) {
  const page = Math.max(1, filter.page || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, filter.pageSize || 20));

  const where: Prisma.QuestionWhereInput = {};

  if (filter.search) {
    where.OR = [
      { content: { contains: filter.search, mode: "insensitive" } },
      { matpel: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter.tingkat) {
    where.tingkat = filter.tingkat as Tingkat;
  }
  if (filter.level) {
    where.level = filter.level as Level;
  }
  if (filter.matpel) {
    where.matpel = { contains: filter.matpel, mode: "insensitive" };
  }
  if (filter.questionType) {
    where.questionType = filter.questionType as QuestionType;
  }

  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        tingkat: true,
        level: true,
        matpel: true,
        questionType: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const items: QuestionListItem[] = questions.map((q) => ({
    id: q.id,
    tingkat: q.tingkat,
    level: q.level,
    matpel: q.matpel,
    questionType: q.questionType,
    contentPreview: truncatePreview(q.content),
    imageUrl: q.imageUrl,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
  }));

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    } as QuestionPagination,
  };
}

export async function getQuestionById(id: number) {
  return prisma.question.findUnique({
    where: { id },
    select: {
      id: true,
      tingkat: true,
      level: true,
      matpel: true,
      questionType: true,
      content: true,
      imageUrl: true,
      options: true,
      correctOption: true,
      acceptableAnswers: true,
      explanation: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createQuestion(data: QuestionInput) {
  return prisma.question.create({
    data: {
      tingkat: data.tingkat as Tingkat,
      level: data.level as Level,
      matpel: data.matpel,
      questionType: data.questionType as QuestionType,
      content: data.content,
      imageUrl: data.imageUrl,
      options: data.options as unknown as Prisma.InputJsonValue,
      correctOption: data.correctOption,
      acceptableAnswers: data.acceptableAnswers,
      explanation: data.explanation,
    },
    select: {
      id: true,
      tingkat: true,
      level: true,
      matpel: true,
      questionType: true,
      content: true,
      imageUrl: true,
      options: true,
      correctOption: true,
      acceptableAnswers: true,
      explanation: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateQuestion(id: number, data: QuestionInput) {
  return prisma.question.update({
    where: { id },
    data: {
      tingkat: data.tingkat as Tingkat,
      level: data.level as Level,
      matpel: data.matpel,
      questionType: data.questionType as QuestionType,
      content: data.content,
      imageUrl: data.imageUrl,
      options: data.options as unknown as Prisma.InputJsonValue,
      correctOption: data.correctOption,
      acceptableAnswers: data.acceptableAnswers,
      explanation: data.explanation,
    },
    select: {
      id: true,
      tingkat: true,
      level: true,
      matpel: true,
      questionType: true,
      content: true,
      imageUrl: true,
      options: true,
      correctOption: true,
      acceptableAnswers: true,
      explanation: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteQuestion(id: number) {
  return prisma.question.delete({
    where: { id },
    select: { id: true },
  });
}
