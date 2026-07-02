import type { QuestionType } from "@prisma/client";

export interface GradingResult {
  isCorrect: boolean;
  correctAnswer: string;
}

export function gradeAnswer(
  questionType: QuestionType,
  userAnswer: string,
  correctOption: number | null,
  options: string[],
  acceptableAnswers: string[]
): GradingResult {
  switch (questionType) {
    case "MULTIPLE_CHOICE": {
      const userIndex = parseInt(userAnswer, 10);
      const isCorrect =
        !isNaN(userIndex) &&
        correctOption !== null &&
        userIndex === correctOption;
      const correctAnswer =
        correctOption !== null && options[correctOption]
          ? options[correctOption]
          : "";
      return { isCorrect, correctAnswer };
    }

    case "SHORT_ANSWER": {
      const normalized = userAnswer.trim().toLowerCase();
      const isCorrect = acceptableAnswers.some(
        (a) => a.trim().toLowerCase() === normalized
      );
      const correctAnswer = acceptableAnswers[0] || "";
      return { isCorrect, correctAnswer };
    }

    case "ESSAY": {
      const normalizedUser = parseFloat(userAnswer.replace(",", "."));
      const isCorrect =
        !isNaN(normalizedUser) &&
        acceptableAnswers.some((a) => {
          const normalizedAccepted = parseFloat(a.replace(",", "."));
          return (
            !isNaN(normalizedAccepted) &&
            normalizedAccepted === normalizedUser
          );
        });
      const correctAnswer = acceptableAnswers[0] || "";
      return { isCorrect, correctAnswer };
    }

    default:
      return { isCorrect: false, correctAnswer: "" };
  }
}
