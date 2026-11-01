'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Plus, BookOpen, Play, MoreVertical, Pencil, Trash2, ChevronDown } from 'lucide-react';
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
import { DeckCard } from '@/components/deck/DeckCard';
import { FileUploader } from '@/components/upload/FileUploader';
import { ExtractionPreview } from '@/components/upload/ExtractionPreview';
import { useDeckStore } from '@/store/deck-store';
import { useSettingsStore } from '@/store/settings-store';
import { storage } from '@/lib/storage';
import type { Deck, Word, ExtractionResult, QuizLanguage } from '@/lib/types';
import { toast } from 'sonner';

const EMOJIS_JP = ['🍙', '🍜', '🍣', '🇯🇵', '🍥'];
const EMOJIS_EN = ['📚', '✏️', '🌍', '💬', '🎓'];

export default function HomePage() {
  const router = useRouter();
  const { decks, setDecks, addDeck, updateDeck, removeDeck } = useDeckStore();
  const { apiKey, quizLanguage, setQuizLanguage, fontSize, setFontSize } = useSettingsStore();
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [deckStats, setDeckStats] = useState<Record<string, number | null>>({});
  const [renameTarget, setRenameTarget] = useState<Deck | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [emoji, setEmoji] = useState('');

  useEffect(() => {
    const pool = quizLanguage === 'english' ? EMOJIS_EN : EMOJIS_JP;
    setEmoji(pool[Math.floor(Math.random() * pool.length)]);
  }, [quizLanguage]);

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
      language: quizLanguage,
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

  const visibleDecks = decks
    .filter((d) => (d.language ?? 'japanese') === quizLanguage)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-left outline-none">
              <span
                className="text-3xl text-foreground"
                style={{ fontFamily: 'var(--font-black-han-sans)' }}
              >
                {emoji} {quizLanguage === 'english' ? '영어 퀴즈' : '일본어 퀴즈'}
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/10">
                <ChevronDown className="h-4 w-4 text-foreground" />
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {([['japanese', '🇯🇵 일본어 퀴즈'], ['english', '🌍 영어 퀴즈']] as [QuizLanguage, string][]).map(([lang, label]) => (
              <DropdownMenuItem
                key={lang}
                className={`gap-2 ${quizLanguage === lang ? 'font-semibold text-mark' : ''}`}
                onClick={() => { setQuizLanguage(lang); setExtractionResult(null); setShowUploader(false); }}
              >
                {label}
                {quizLanguage === lang && <span className="ml-auto text-mark">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!apiKey && (
        <div className="mb-4 rounded-xl border border-mark/30 bg-mark/10 px-4 py-3 text-sm text-foreground">
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
                <FileUploader onExtracted={setExtractionResult} language={quizLanguage} />
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
              className="h-12 w-full gap-2"
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

      {visibleDecks.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">단어장</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleDecks.map((deck) => {
              const accuracy = deckStats[deck.id];
              return (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  accuracy={accuracy}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            aria-label={`${deck.name} 메뉴`}
                            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => { setRenameTarget(deck); setRenameValue(deck.name); }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            이름 변경
                          </DropdownMenuItem>
                          <DropdownMenuItem destructive onClick={() => handleDelete(deck)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  }
                />
              );
            })}
          </div>
        </section>
      )}

      {visibleDecks.length === 0 && !showUploader && !extractionResult && (
        <div className="py-16 text-center text-muted-foreground">
          <BookOpen className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">학습 자료를 업로드하여 시작하세요</p>
        </div>
      )}

      {/* Font size toggle — mobile only (md: hidden, PC has it in sidebar) */}
      <div className="mt-8 flex items-center justify-between md:hidden">
        <p className="text-sm text-muted-foreground">폰트 크기</p>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['default', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                fontSize === size
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {size === 'default' ? '기본' : '크게'}
            </button>
          ))}
        </div>
      </div>

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
              className="w-full"
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
