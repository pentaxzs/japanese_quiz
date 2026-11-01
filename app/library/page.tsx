'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Play, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeckCard } from '@/components/deck/DeckCard';
import { useDeckStore } from '@/store/deck-store';
import { useSettingsStore } from '@/store/settings-store';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';

export default function LibraryPage() {
  const router = useRouter();
  const { decks, setDecks, removeDeck } = useDeckStore();
  const { quizLanguage } = useSettingsStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    storage.getDecks().then(setDecks);
  }, [setDecks]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 단어장을 삭제하시겠습니까?`)) return;
    await storage.deleteDeck(id);
    removeDeck(id);
    toast.success(`"${name}"이 삭제되었습니다.`);
  }

  const visibleDecks = decks
    .filter((d) => (d.language ?? 'japanese') === quizLanguage)
    .sort((a, b) => b.createdAt - a.createdAt);
  const modeLabel = quizLanguage === 'english' ? '영어' : '일본어';

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">단어장</h1>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">{modeLabel}</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className="h-9 w-9"
            aria-label="바둑판 보기"
            aria-pressed={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            className="h-9 w-9"
            aria-label="목록 보기"
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {visibleDecks.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-sm">{modeLabel} 단어장이 없습니다. 홈에서 업로드해보세요.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
          {visibleDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onOpen={() => router.push(`/quiz/${deck.id}`)}
              actions={
                <>
                  <button
                    onClick={() => router.push(`/quiz/${deck.id}`)}
                    aria-label={`${deck.name} 퀴즈 시작`}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-mark transition-colors hover:bg-mark/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Play className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(deck.id, deck.name)}
                    aria-label={`${deck.name} 삭제`}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
