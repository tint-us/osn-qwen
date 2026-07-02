import { create } from "zustand";

export interface ExamQuestionData {
  id: number;
  questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
  content: string;
  imageUrl: string | null;
  options: string[];
  correctOption: number | null;
  acceptableAnswers: string[];
  explanation: string;
}

interface ExamStore {
  sessionId: number | null;
  batchIndex: number;
  questions: ExamQuestionData[];
  answers: Record<string, string>;
  currentIndex: number;
  timeLeft: number | null;
  timerEnabled: boolean;
  timerDuration: number;
  isSubmitting: boolean;

  setSession: (sessionId: number, batchIndex: number) => void;
  setQuestions: (questions: ExamQuestionData[]) => void;
  setAnswers: (answers: Record<string, string>) => void;
  setAnswer: (questionId: number, answer: string) => void;
  setCurrentIndex: (index: number) => void;
  setTimeLeft: (seconds: number | null) => void;
  setTimer: (enabled: boolean, duration: number) => void;
  setSubmitting: (submitting: boolean) => void;
  reset: () => void;
}

export const useExamStore = create<ExamStore>((set) => ({
  sessionId: null,
  batchIndex: 0,
  questions: [],
  answers: {},
  currentIndex: 0,
  timeLeft: null,
  timerEnabled: false,
  timerDuration: 30,
  isSubmitting: false,

  setSession: (sessionId, batchIndex) => set({ sessionId, batchIndex }),

  setQuestions: (questions) => set({ questions }),

  setAnswers: (answers) => set({ answers }),

  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [String(questionId)]: answer },
    })),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setTimeLeft: (seconds) => set({ timeLeft: seconds }),

  setTimer: (enabled, duration) =>
    set({ timerEnabled: enabled, timerDuration: duration }),

  setSubmitting: (submitting) => set({ isSubmitting: submitting }),

  reset: () =>
    set({
      sessionId: null,
      batchIndex: 0,
      questions: [],
      answers: {},
      currentIndex: 0,
      timeLeft: null,
      timerEnabled: false,
      timerDuration: 30,
      isSubmitting: false,
    }),
}));
