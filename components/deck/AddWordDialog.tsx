'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { storage } from '@/lib/storage';
import type { Word } from '@/lib/types';
import { toast } from 'sonner';

interface AddWordDialogProps {
  deckId: string;
  onSaved: (word: Word) => void;
}

export function AddWordDialog({ deckId, onSaved }: AddWordDialogProps) {
  const [open, setOpen] = useState(false);
  const [japanese, setJapanese] = useState('');
  const [reading, setReading] = useState('');
  const [korean, setKorean] = useState('');
  const [type, setType] = useState<'word' | 'sentence'>('word');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!japanese.trim() || !korean.trim()) return;
    setSaving(true);

    const now = Date.now();
    const newWord: Word = {
      id: uuidv4(),
      userId: 'local',
      japanese: japanese.trim(),
      reading: reading.trim() || japanese.trim(),
      korean: korean.trim(),
      type,
      deckId,
      createdAt: now,
      updatedAt: now,
      stats: { attempts: 0, correct: 0, lastAttempt: null, consecutiveCorrect: 0 },
    };

    await storage.saveWords([newWord]);

    // Update deck wordCount
    const deck = await storage.getDeck(deckId);
    if (deck) {
      await storage.saveDeck({ ...deck, wordCount: deck.wordCount + 1, updatedAt: now });
    }

    onSaved(newWord);
    toast.success('단어가 추가되었습니다.');
    setJapanese('');
    setReading('');
    setKorean('');
    setType('word');
    setSaving(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          단어 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>단어 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="flex gap-2">
            {(['word', 'sentence'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                  type === t
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'border-border hover:border-indigo-300'
                }`}
              >
                {t === 'word' ? '단어' : '문장'}
              </button>
            ))}
          </div>
          <Input
            placeholder="일본어 (예: 勉強)"
            value={japanese}
            onChange={(e) => setJapanese(e.target.value)}
            lang="ja"
            autoComplete="off"
          />
          <Input
            placeholder="읽기 (예: べんきょう) — 비워두면 일본어와 동일"
            value={reading}
            onChange={(e) => setReading(e.target.value)}
            lang="ja"
            autoComplete="off"
          />
          <Input
            placeholder="한국어 (예: 공부)"
            value={korean}
            onChange={(e) => setKorean(e.target.value)}
            lang="ko"
            autoComplete="off"
          />
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            onClick={handleSave}
            disabled={!japanese.trim() || !korean.trim() || saving}
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
