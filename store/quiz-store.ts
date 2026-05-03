import { create } from 'zustand';
import type { QuizSession, QuizQuestion } from '@/lib/types';

interface QuizState {
  session: QuizSession | null;
  setSession: (session: QuizSession) => void;
  clearSession: () => void;
  submitAnswer: (wordId: string, isCorrect: boolean, userAnswer: string) => void;
  nextQuestion: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
  submitAnswer: (wordId, isCorrect, userAnswer) =>
    set((s) => {
      if (!s.session) return s;
      return {
        session: {
          ...s.session,
          answers: [...s.session.answers, { wordId, isCorrect, userAnswer }],
        },
      };
    }),
  nextQuestion: () =>
    set((s) => {
      if (!s.session) return s;
      return {
        session: {
          ...s.session,
          currentIndex: s.session.currentIndex + 1,
        },
      };
    }),
}));
