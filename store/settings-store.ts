import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  showFurigana: boolean;
  darkMode: boolean;
  quizDirection: 'random' | 'jp-to-kr' | 'kr-to-jp';
  hapticEnabled: boolean;
  apiKey: string;
  toggleFurigana: () => void;
  toggleDarkMode: () => void;
  setQuizDirection: (dir: SettingsState['quizDirection']) => void;
  setApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showFurigana: true,
      darkMode: false,
      quizDirection: 'random',
      hapticEnabled: true,
      apiKey: '',
      toggleFurigana: () => set((s) => ({ showFurigana: !s.showFurigana })),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setQuizDirection: (dir) => set({ quizDirection: dir }),
      setApiKey: (key) => set({ apiKey: key }),
    }),
    {
      name: 'jp-quiz-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
