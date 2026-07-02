import { create } from "zustand";

export interface StudyQuestionData {
  id: number;
  tingkat: string;
  level: string;
  matpel: string;
  questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
  content: string;
  imageUrl: string | null;
  options: string[];
  correctOption: number | null;
  acceptableAnswers: string[];
  explanation: string;
}

export interface StudyResultData {
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

interface StudyStore {
  questions: StudyQuestionData[];
  currentIndex: number;
  results: StudyResultData[];
  isAnswered: boolean;
  isSubmitting: boolean;
  isFinished: boolean;

  setQuestions: (questions: StudyQuestionData[]) => void;
  setCurrentIndex: (index: number) => void;
  setSubmitting: (submitting: boolean) => void;
  addResult: (result: StudyResultData) => void;
  nextQuestion: () => void;
  finish: () => void;
  reset: () => void;
}

export const useStudyStore = create<StudyStore>((set, get) => ({
  questions: [],
  currentIndex: 0,
  results: [],
  isAnswered: false,
  isSubmitting: false,
  isFinished: false,

  setQuestions: (questions) => set({ questions }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setSubmitting: (submitting) => set({ isSubmitting: submitting }),

  addResult: (result) =>
    set((state) => ({
      results: [...state.results, result],
      isAnswered: true,
      isSubmitting: false,
    })),

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex + 1 >= questions.length) {
      set({ isFinished: true });
    } else {
      set({
        currentIndex: currentIndex + 1,
        isAnswered: false,
      });
    }
  },

  finish: () => set({ isFinished: true }),

  reset: () =>
    set({
      questions: [],
      currentIndex: 0,
      results: [],
      isAnswered: false,
      isSubmitting: false,
      isFinished: false,
    }),
}));
