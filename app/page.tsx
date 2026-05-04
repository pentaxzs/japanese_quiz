'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Plus, BookOpen, Play, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { FileUploader } from '@/components/upload/FileUploader';
import { ExtractionPreview } from '@/components/upload/ExtractionPreview';
import { useDeckStore } from '@/store/deck-store';
import { useSettingsStore } from '@/store/settings-store';
import { storage } from '@/lib/storage';
import type { Deck, Word, ExtractionResult } from '@/lib/types';
import { toast } from 'sonner';

const EMOJIS = ['🍙', '🍜', '🍣', '🇯🇵', '🍥'];

export default function HomePage() {
  const router = useRouter();
  const { decks, setDecks, addDeck, updateDeck, removeDeck } = useDeckStore();
  const { apiKey } = useSettingsStore();
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [deckStats, setDeckStats] = useState<Record<string, number | null>>({});
  const [renameTarget, setRenameTarget] = useState<Deck | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [emoji, setEmoji] = useState('');

  useEffect(() => {
    setEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
  }, []);

  useEffect(() => {
    storage.getDecks().then(setDecks);
  }, [setDecks]);

  useEffect(() => {
    if (decks.length === 0) return;
    decks.forEach(async (deck) => {
      const stats = await storage.getDeckStats(deck.id);
      setDeckStats((prev) => ({ ...prev, [deck.id]: stats.accuracy }));
    });
  }, [decks]);

  async function handleSave(deckName: string, result: ExtractionResult) {
    const deckId = uuidv4();
    const now = Date.now();

    const words: Word[] = [
      ...result.words.map((w) => ({
        id: uuidv4(),
        userId: 'local',
        japanese: w.japanese,
        reading: w.reading,
        korean: w.korean,
        type: 'word' as const,
        deckId,
        createdAt: now,
        updatedAt: now,
        stats: { attempts: 0, correct: 0, lastAttempt: null, consecutiveCorrect: 0 },
      })),
      ...result.sentences.map((s) => ({
        id: uuidv4(),
        userId: 'local',
        japanese: s.japanese,
        reading: s.reading,
        korean: s.korean,
        type: 'sentence' as const,
        deckId,
        createdAt: now,
        updatedAt: now,
        stats: { attempts: 0, correct: 0, lastAttempt: null, consecutiveCorrect: 0 },
      })),
    ];

    const deck: Deck = {
      id: deckId,
      userId: 'local',
      name: deckName.trim(),
      createdAt: now,
      updatedAt: now,
      wordCount: words.length,
    };

    await storage.saveDeck(deck);
    await storage.saveWords(words);
    addDeck(deck);
    setExtractionResult(null);
    setShowUploader(false);
    toast.success(`"${deckName}" 단어장이 저장되었습니다. (${words.length}개)`);
  }

  async function handleRename() {
    if (!renameTarget || !renameValue.trim()) return;
    const updated = { ...renameTarget, name: renameValue.trim(), updatedAt: Date.now() };
    await storage.saveDeck(updated);
    updateDeck(renameTarget.id, { name: updated.name });
    toast.success('이름이 변경되었습니다.');
    setRenameTarget(null);
  }

  async function handleDelete(deck: Deck) {
    if (!confirm(`"${deck.name}" 단어장을 삭제하시겠습니까?\n단어 ${deck.wordCount}개도 함께 삭제됩니다.`)) return;
    await storage.deleteDeck(deck.id);
    removeDeck(deck.id);
    toast.success(`"${deck.name}"이 삭제되었습니다.`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between md:hidden">
        <h1 className="text-2xl font-bold text-slate-100">{emoji} 일본어 퀴즈</h1>
      </div>

      {!apiKey && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <strong>API 키 필요:</strong> 설정 페이지에서 Anthropic API 키를 입력해야 이미지 업로드 기능을 사용할 수 있습니다.{' '}
          <button className="underline font-medium" onClick={() => router.push('/settings')}>
            설정으로 이동
          </button>
        </div>
      )}

      {!extractionResult && (
        <div className="mb-6">
          {showUploader ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">학습 자료 업로드</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUploader onExtracted={setExtractionResult} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => setShowUploader(false)}
                >
                  취소
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 h-12"
              onClick={() => setShowUploader(true)}
            >
              <Plus className="h-5 w-5" />
              학습 자료 업로드
            </Button>
          )}
        </div>
      )}

      {extractionResult && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <ExtractionPreview
              result={extractionResult}
              onSave={handleSave}
              onCancel={() => setExtractionResult(null)}
            />
          </CardContent>
        </Card>
      )}

      {decks.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">단어장</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {decks.map((deck) => {
              const accuracy = deckStats[deck.id];
              return (
                <Card key={deck.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-2 p-4">
                    {/* Main area — click to quiz */}
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => router.push(`/quiz/${deck.id}`)}
                    >
                      <p className="truncate font-medium">{deck.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">{deck.wordCount}개</p>
                        {accuracy !== null && accuracy !== undefined && (
                          <p className="text-xs text-indigo-500 font-medium">정답률 {accuracy}%</p>
                        )}
                      </div>
                    </div>

                    {/* Play button */}
                    <button
                      onClick={() => router.push(`/quiz/${deck.id}`)}
                      className="shrink-0 text-indigo-500 hover:text-indigo-700 p-1 transition-colors"
                    >
                      <Play className="h-5 w-5" />
                    </button>

                    {/* More menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="shrink-0 text-muted-foreground hover:text-foreground p-1 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameTarget(deck);
                            setRenameValue(deck.name);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          이름 변경
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          destructive
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(deck);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {decks.length === 0 && !showUploader && !extractionResult && (
        <div className="py-16 text-center text-muted-foreground">
          <BookOpen className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">학습 자료를 업로드하여 시작하세요</p>
        </div>
      )}

      {/* Rename dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>단어장 이름 변경</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
            />
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={handleRename}
              disabled={!renameValue.trim() || renameValue.trim() === renameTarget?.name}
            >
              저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
