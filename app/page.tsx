'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Play, MoreVertical, Pencil, Trash2, ChevronDown } from 'lucide-react';
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
import { NewDeckCard } from '@/components/deck/NewDeckCard';
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

      {/*
        API 키 배너는 상단 고정에서 내렸다. 키는 단어를 뽑아올 때만 필요한데
        늘 떠 있어서 첫 화면에서 가장 눈에 띄는 것이 "뭔가 빠졌다"는 경고였다.
        이제 업로드를 열었을 때만 안내한다.
      */}
      {!extractionResult && showUploader && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">새 단어장 만들기</CardTitle>
          </CardHeader>
          <CardContent>
            {!apiKey && (
              <div className="mb-3 rounded-lg border border-mark/30 bg-mark/10 px-3 py-2.5 text-xs leading-relaxed text-foreground">
                <p className="font-semibold">먼저 Anthropic API 키가 필요합니다</p>
                <p className="mt-1 text-muted-foreground">
                  사진에서 단어를 뽑아내는 데 AI를 씁니다. 키는 이 기기에만 저장되고,
                  비용은 본인 Anthropic 계정에 청구됩니다. 사진 한 장당 몇 원 수준입니다.
                </p>
                <button
                  className="mt-1.5 font-medium underline"
                  onClick={() => router.push('/settings')}
                >
                  설정에서 키 넣기
                </button>
              </div>
            )}
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

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">단어장</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {!showUploader && !extractionResult && (
              <NewDeckCard onClick={() => setShowUploader(true)} />
            )}
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

          {/*
            빈 상태가 따로 없다. 빈 종이 카드가 곧 입구이자 빈 상태다.
            이전에는 배너·버튼·안내문이 같은 말을 세 번 했다.
          */}
          {visibleDecks.length === 0 && !showUploader && !extractionResult && (
            <div className="mt-5 text-sm leading-relaxed text-muted-foreground">
              <p className="mb-3">아직 단어장이 없습니다. 이렇게 만듭니다.</p>
              {/* 순서 자체가 정보라 번호를 붙인다 */}
              <ol className="space-y-2">
                {[
                  '교재나 단어장을 사진으로 찍거나 PDF를 올립니다',
                  'AI가 단어와 읽는 법, 뜻을 뽑아 단어장을 만듭니다',
                  '가려진 답을 꾹 눌러 확인하며 외웁니다',
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold tabular-nums text-foreground">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

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
