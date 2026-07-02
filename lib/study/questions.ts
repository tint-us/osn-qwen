import { prisma } from "@/lib/prisma";
import type { Tingkat, Level } from "@prisma/client";

export interface StudyQuestion {
  id: number;
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

export interface SafeQuestion {
  id: number;
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

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffleOptions(options: string[], correctOption: number | null) {
  if (!options || options.length === 0 || correctOption === null) {
    return { options, correctOption };
  }

  const indices = options.map((_, i) => i);
  const shuffledIndices = fisherYatesShuffle(indices);

  const shuffledOptions = shuffledIndices.map((i) => options[i]);
  const newCorrectOption = shuffledIndices.indexOf(correctOption);

  return { options: shuffledOptions, correctOption: newCorrectOption };
}

export async function fetchAndShuffleQuestions(
  tingkat: Tingkat,
  level: Level,
  matpels: string[]
): Promise<SafeQuestion[]> {
  const questions = await prisma.question.findMany({
    where: {
      tingkat,
      level,
      matpel: { in: matpels },
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
    },
  });

  const shuffledQuestions = fisherYatesShuffle(questions);

  const processed: SafeQuestion[] = shuffledQuestions.map((q) => {
    const options = (q.options as string[]) || [];
    const { options: shuffledOpts, correctOption: newCorrect } =
      shuffleOptions(options, q.correctOption);

    return {
      ...q,
      tingkat: q.tingkat as string,
      level: q.level as string,
      matpel: q.matpel,
      questionType: q.questionType as string,
      options: shuffledOpts,
      // Security: strip correct answer from response
      correctOption: newCorrect === null ? null : null,
      acceptableAnswers: [],
    };
  });

  return processed;
}
