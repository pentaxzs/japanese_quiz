import { create } from 'zustand';
import type { WrongNote } from '@/lib/types';

interface WrongNoteState {
  wrongNotes: WrongNote[];
  setWrongNotes: (notes: WrongNote[]) => void;
  addWrongNote: (note: WrongNote) => void;
  removeWrongNote: (wordId: string) => void;
  updateWrongNote: (wordId: string, update: Partial<WrongNote>) => void;
}

export const useWrongNoteStore = create<WrongNoteState>((set) => ({
  wrongNotes: [],
  setWrongNotes: (wrongNotes) => set({ wrongNotes }),
  addWrongNote: (note) =>
    set((s) => {
      const existing = s.wrongNotes.find((n) => n.wordId === note.wordId);
      if (existing) {
        return {
          wrongNotes: s.wrongNotes.map((n) =>
            n.wordId === note.wordId ? { ...n, ...note } : n
          ),
        };
      }
      return { wrongNotes: [...s.wrongNotes, note] };
    }),
  removeWrongNote: (wordId) =>
    set((s) => ({ wrongNotes: s.wrongNotes.filter((n) => n.wordId !== wordId) })),
  updateWrongNote: (wordId, update) =>
    set((s) => ({
      wrongNotes: s.wrongNotes.map((n) => (n.wordId === wordId ? { ...n, ...update } : n)),
    })),
}));
