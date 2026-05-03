'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Play, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDeckStore } from '@/store/deck-store';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';

export default function LibraryPage() {
  const router = useRouter();
  const { decks, setDecks, removeDeck } = useDeckStore();
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">단어장</h1>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-sm">단어장이 없습니다. 홈에서 업로드해보세요.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid gap-3 sm:grid-cols-2' : 'space-y-2'}>
          {decks.map((deck) => (
            <Card key={deck.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => router.push(`/quiz/${deck.id}`)}
                >
                  <p className="truncate font-medium">{deck.name}</p>
                  <p className="text-xs text-muted-foreground">{deck.wordCount}개</p>
                </div>
                <div className="flex shrink-0 gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-indigo-500"
                    onClick={() => router.push(`/quiz/${deck.id}`)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(deck.id, deck.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
