import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Deck, Word, WrongNote, ExtractionResult } from '@/lib/types';

interface JPQuizDB extends DBSchema {
  decks: {
    key: string;
    value: Deck;
    indexes: { 'by-createdAt': number; 'by-name': string };
  };
  words: {
    key: string;
    value: Word;
    indexes: { 'by-deckId': string; 'by-type': string };
  };
  wrongNotes: {
    key: string;
    value: WrongNote;
    indexes: { 'by-lastAttempt': number };
  };
  imageCache: {
    key: string;
    value: { hash: string; result: ExtractionResult; cachedAt: number };
  };
  meta: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'japanese-quiz';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<JPQuizDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<JPQuizDB>> {
  if (!dbPromise) {
    dbPromise = openDB<JPQuizDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const decksStore = db.createObjectStore('decks', { keyPath: 'id' });
        decksStore.createIndex('by-createdAt', 'createdAt');
        decksStore.createIndex('by-name', 'name');

        const wordsStore = db.createObjectStore('words', { keyPath: 'id' });
        wordsStore.createIndex('by-deckId', 'deckId');
        wordsStore.createIndex('by-type', 'type');

        const wrongNotesStore = db.createObjectStore('wrongNotes', { keyPath: 'wordId' });
        wrongNotesStore.createIndex('by-lastAttempt', 'lastAttempt');

        db.createObjectStore('imageCache', { keyPath: 'hash' });
        db.createObjectStore('meta', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

export async function getCachedExtraction(hash: string): Promise<ExtractionResult | null> {
  const db = await getDB();
  const cached = await db.get('imageCache', hash);
  return cached?.result ?? null;
}

export async function setCachedExtraction(hash: string, result: ExtractionResult): Promise<void> {
  const db = await getDB();
  await db.put('imageCache', { hash, result, cachedAt: Date.now() });
}
