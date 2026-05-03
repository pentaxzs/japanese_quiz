import { create } from 'zustand';
import type { Deck, Word } from '@/lib/types';

interface DeckState {
  decks: Deck[];
  currentWords: Word[];
  isLoading: boolean;
  setDecks: (decks: Deck[]) => void;
  addDeck: (deck: Deck) => void;
  updateDeck: (id: string, updates: Partial<Deck>) => void;
  removeDeck: (id: string) => void;
  setCurrentWords: (words: Word[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useDeckStore = create<DeckState>((set) => ({
  decks: [],
  currentWords: [],
  isLoading: false,
  setDecks: (decks) => set({ decks }),
  addDeck: (deck) => set((s) => ({ decks: [...s.decks, deck] })),
  updateDeck: (id, updates) =>
    set((s) => ({
      decks: s.decks.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),
  removeDeck: (id) => set((s) => ({ decks: s.decks.filter((d) => d.id !== id) })),
  setCurrentWords: (words) => set({ currentWords: words }),
  setLoading: (isLoading) => set({ isLoading }),
}));
