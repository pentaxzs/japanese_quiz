'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSettingsStore } from '@/store/settings-store';
import { storage } from '@/lib/storage';
import type { Word, WrongNote } from '@/lib/types';
import { toast } from 'sonner';

type FilterType = 'all' | 'word' | 'sentence';

export default function WrongNotesPage() {
  const router = useRouter();
  const { showFurigana } = useSettingsStore();
  const [wrongNotes, setWrongNotes] = useState<WrongNote[]>([]);
  const [words, setWords] = useState<Map<string, Word>>(new Map());
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const notes = await storage.getWrongNotes();
    setWrongNotes(notes);

    const wordMap = new Map<string, Word>();
    for (const note of notes) {
      const deckWords = await storage.getWordsByDeckId(note.deckId);
      for (const w of deckWords) wordMap.set(w.id, w);
    }
    setWords(wordMap);
  }

  async function handleDelete(wordId: string) {
    await storage.removeWrongNote(wordId);
    setWrongNotes((prev) => prev.filter((n) => n.wordId !== wordId));
    toast.success('오답 노트에서 삭제했습니다.');
  }

  function handleStartQuiz() {
    const filtered = filteredNotes;
    if (filtered.length === 0) return;
    // 오답 노트 퀴즈 페이지로 이동
    router.push('/quiz/wrong-notes');
  }

  const filteredNotes = wrongNotes
    .filter((note) => {
      const word = words.get(note.wordId);
      if (!word) return false;
      if (filter === 'all') return true;
      return word.type === filter;
    })
    .sort((a, b) => b.wrongCount - a.wrongCount);

  const filterLabels: { value: FilterType; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'word', label: '단어' },
    { value: 'sentence', label: '문장' },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">오답 노트</h1>
        {filteredNotes.length > 0 && (
          <Button
            size="sm"
            className="gap-1 bg-indigo-600 hover:bg-indigo-700"
            onClick={handleStartQuiz}
          >
            <Play className="h-3 w-3" />
            오답 풀기
          </Button>
        )}
      </div>

      {wrongNotes.length > 0 && (
        <div className="mb-4 flex gap-2">
          {filterLabels.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                filter === value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {filteredNotes.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">오답 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotes.map((note) => {
            const word = words.get(note.wordId);
            if (!word) return null;
            return (
              <Card key={note.wordId}>
                <CardContent className="flex items-start justify-between p-4">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    {showFurigana && word.reading && word.reading !== word.japanese && (
                      <p className="break-all text-xs text-muted-foreground leading-relaxed">{word.reading}</p>
                    )}
                    <p className="break-all font-medium">{word.japanese}</p>
                    <p className="break-words text-sm text-muted-foreground">{word.korean}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <div className="text-right text-xs text-red-500">
                      <p className="font-semibold">{note.wrongCount}회 오답</p>
                      {note.consecutiveCorrect > 0 && (
                        <p className="text-muted-foreground">연속 정답 {note.consecutiveCorrect}/3</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(note.wordId)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      aria-label="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
