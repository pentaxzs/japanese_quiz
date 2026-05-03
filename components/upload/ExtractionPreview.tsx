'use client';

import { useState } from 'react';
import { Check, X, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { ExtractionResult } from '@/lib/types';

interface ExtractionPreviewProps {
  result: ExtractionResult;
  onSave: (deckName: string, result: ExtractionResult) => void;
  onCancel: () => void;
}

export function ExtractionPreview({ result, onSave, onCancel }: ExtractionPreviewProps) {
  const [deckName, setDeckName] = useState(`단어장 ${new Date().toLocaleDateString('ko-KR')}`);
  const [editedResult, setEditedResult] = useState(result);

  const total = editedResult.words.length + editedResult.sentences.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">추출 결과 ({total}개)</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {editedResult.words.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">단어 ({editedResult.words.length})</h3>
          <div className="space-y-1">
            {editedResult.words.map((w, i) => (
              <Card key={i} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1 font-medium">{w.japanese}</span>
                <span className="text-xs text-muted-foreground">{w.reading}</span>
                <span className="min-w-0 flex-1 text-right text-sm">{w.korean}</span>
              </Card>
            ))}
          </div>
        </section>
      )}

      {editedResult.sentences.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            문장 ({editedResult.sentences.length})
          </h3>
          <div className="space-y-1">
            {editedResult.sentences.map((s, i) => (
              <Card key={i} className="space-y-0.5 px-3 py-2">
                <p className="text-sm font-medium">{s.japanese}</p>
                <p className="text-xs text-muted-foreground">{s.korean}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-2 pt-2">
        <label className="text-sm font-medium">단어장 이름</label>
        <Input
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          placeholder="단어장 이름을 입력하세요"
          className="text-base"
          lang="ko"
          autoComplete="off"
          autoCorrect="off"
        />
      </div>

      <Button
        className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
        onClick={() => onSave(deckName, editedResult)}
        disabled={total === 0 || !deckName.trim()}
      >
        <BookOpen className="h-4 w-4" />
        단어장에 저장 ({total}개)
      </Button>
    </div>
  );
}
