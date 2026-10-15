import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QuizLanguage } from '@/lib/types';

interface SettingsState {
  showFurigana: boolean;
  darkMode: boolean;
  quizDirection: 'random' | 'jp-to-kr' | 'kr-to-jp';
  hapticEnabled: boolean;
  apiKey: string;
  quizLanguage: QuizLanguage;
  fontSize: 'default' | 'large';
  toggleFurigana: () => void;
  toggleDarkMode: () => void;
  setQuizDirection: (dir: SettingsState['quizDirection']) => void;
  setApiKey: (key: string) => void;
  setQuizLanguage: (lang: QuizLanguage) => void;
  setFontSize: (size: 'default' | 'large') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showFurigana: true,
      darkMode: false,
      quizDirection: 'random',
      hapticEnabled: true,
      apiKey: '',
      quizLanguage: 'japanese',
      fontSize: 'default',
      toggleFurigana: () => set((s) => ({ showFurigana: !s.showFurigana })),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setQuizDirection: (dir) => set({ quizDirection: dir }),
      setApiKey: (key) => set({ apiKey: key }),
      setQuizLanguage: (lang) => set({ quizLanguage: lang }),
      setFontSize: (size) => set({ fontSize: size }),
    }),
    {
      name: 'jp-quiz-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
