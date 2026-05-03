export interface WordStats {
  attempts: number;
  correct: number;
  lastAttempt: number | null;
  consecutiveCorrect: number;
}

export interface Word {
  id: string;
  userId: string; // 'local' for now, real userId when expanded
  japanese: string;
  reading: string;
  korean: string;
  type: 'word' | 'sentence';
  deckId: string;
  createdAt: number;
  updatedAt: number;
  syncStatus?: 'local' | 'synced' | 'pending';
  stats: WordStats;
}

export interface Deck {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  wordCount: number;
  syncStatus?: 'local' | 'synced' | 'pending';
}

export interface WrongNote {
  wordId: string;
  deckId: string;
  wrongCount: number;
  lastAttempt: number;
  consecutiveCorrect: number;
}

export interface BackupData {
  version: number;
  exportedAt: number;
  decks: Deck[];
  words: Word[];
  wrongNotes: WrongNote[];
  settings: Record<string, unknown>;
}

export interface ExtractionResult {
  words: Array<{ japanese: string; reading: string; korean: string }>;
  sentences: Array<{ japanese: string; reading: string; korean: string }>;
}

export interface QuizQuestion {
  word: Word;
  direction: 'jp-to-kr' | 'kr-to-jp';
}

export interface QuizSession {
  deckIds: string[];
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Array<{ wordId: string; isCorrect: boolean; userAnswer: string }>;
  mode: 'words' | 'sentences' | 'mixed';
}
