import type { Deck, Word, WrongNote, BackupData, WordStats } from '@/lib/types';
import { getDB } from './indexed-db';

export interface StorageAdapter {
  getDecks(): Promise<Deck[]>;
  getDeck(id: string): Promise<Deck | null>;
  saveDeck(deck: Deck): Promise<void>;
  deleteDeck(id: string): Promise<void>;

  getWordsByDeckId(deckId: string): Promise<Word[]>;
  getWordsByIds(ids: string[]): Promise<Word[]>;
  saveWords(words: Word[]): Promise<void>;
  updateWordStats(wordId: string, stats: Partial<WordStats>): Promise<void>;
  deleteWord(id: string): Promise<void>;

  getWrongNotes(): Promise<WrongNote[]>;
  addWrongNote(note: WrongNote): Promise<void>;
  removeWrongNote(wordId: string): Promise<void>;
  updateWrongNote(wordId: string, update: Partial<WrongNote>): Promise<void>;

  getDeckStats(deckId: string): Promise<{ attempts: number; correct: number; accuracy: number | null }>;
  exportAll(): Promise<BackupData>;
  importAll(data: BackupData): Promise<void>;
  clearAll(): Promise<void>;

  getStorageEstimate(): Promise<{ usage: number; quota: number }>;
}

class IndexedDBStorage implements StorageAdapter {
  async getDecks(): Promise<Deck[]> {
    const db = await getDB();
    return db.getAllFromIndex('decks', 'by-createdAt');
  }

  async getDeck(id: string): Promise<Deck | null> {
    const db = await getDB();
    return (await db.get('decks', id)) ?? null;
  }

  async saveDeck(deck: Deck): Promise<void> {
    const db = await getDB();
    await db.put('decks', deck);
  }

  async deleteDeck(id: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['decks', 'words'], 'readwrite');
    await tx.objectStore('decks').delete(id);
    const wordIndex = tx.objectStore('words').index('by-deckId');
    const words = await wordIndex.getAllKeys(id);
    await Promise.all(words.map((key) => tx.objectStore('words').delete(key)));
    await tx.done;
  }

  async getWordsByDeckId(deckId: string): Promise<Word[]> {
    const db = await getDB();
    return db.getAllFromIndex('words', 'by-deckId', deckId);
  }

  async getWordsByIds(ids: string[]): Promise<Word[]> {
    const db = await getDB();
    const results = await Promise.all(ids.map((id) => db.get('words', id)));
    return results.filter((w): w is Word => w !== undefined);
  }

  async saveWords(words: Word[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('words', 'readwrite');
    await Promise.all(words.map((w) => tx.store.put(w)));
    await tx.done;
  }

  async updateWordStats(wordId: string, stats: Partial<WordStats>): Promise<void> {
    const db = await getDB();
    const word = await db.get('words', wordId);
    if (!word) return;
    await db.put('words', {
      ...word,
      stats: { ...word.stats, ...stats },
      updatedAt: Date.now(),
    });
  }

  async deleteWord(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('words', id);
  }

  async getWrongNotes(): Promise<WrongNote[]> {
    const db = await getDB();
    return db.getAll('wrongNotes');
  }

  async addWrongNote(note: WrongNote): Promise<void> {
    const db = await getDB();
    await db.put('wrongNotes', note);
  }

  async removeWrongNote(wordId: string): Promise<void> {
    const db = await getDB();
    await db.delete('wrongNotes', wordId);
  }

  async updateWrongNote(wordId: string, update: Partial<WrongNote>): Promise<void> {
    const db = await getDB();
    const existing = await db.get('wrongNotes', wordId);
    if (!existing) return;
    await db.put('wrongNotes', { ...existing, ...update });
  }

  async exportAll(): Promise<BackupData> {
    const db = await getDB();
    const [decks, words, wrongNotes] = await Promise.all([
      db.getAll('decks'),
      db.getAll('words'),
      db.getAll('wrongNotes'),
    ]);
    return {
      version: 1,
      exportedAt: Date.now(),
      decks,
      words,
      wrongNotes,
      settings: {},
    };
  }

  async importAll(data: BackupData): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['decks', 'words', 'wrongNotes'], 'readwrite');
    await Promise.all([
      ...data.decks.map((d) => tx.objectStore('decks').put(d)),
      ...data.words.map((w) => tx.objectStore('words').put(w)),
      ...data.wrongNotes.map((n) => tx.objectStore('wrongNotes').put(n)),
    ]);
    await tx.done;
  }

  async clearAll(): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['decks', 'words', 'wrongNotes', 'imageCache'], 'readwrite');
    await Promise.all([
      tx.objectStore('decks').clear(),
      tx.objectStore('words').clear(),
      tx.objectStore('wrongNotes').clear(),
      tx.objectStore('imageCache').clear(),
    ]);
    await tx.done;
  }

  async getDeckStats(deckId: string): Promise<{ attempts: number; correct: number; accuracy: number | null }> {
    const words = await this.getWordsByDeckId(deckId);
    const attempts = words.reduce((sum, w) => sum + w.stats.attempts, 0);
    const correct = words.reduce((sum, w) => sum + w.stats.correct, 0);
    return {
      attempts,
      correct,
      accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : null,
    };
  }

  async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
    if (!navigator.storage?.estimate) return { usage: 0, quota: 0 };
    const est = await navigator.storage.estimate();
    return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
  }
}

export const storage: StorageAdapter = new IndexedDBStorage();

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  const isPersisted = await navigator.storage.persisted();
  if (isPersisted) return true;
  return navigator.storage.persist();
}
