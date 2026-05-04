'use client';

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings-store';
import type { QuizQuestion } from '@/lib/types';

interface QuizCardProps {
  question: QuizQuestion;
  onAnswered: (isCorrect: boolean, userAnswer: string) => void;
}

export function QuizCard({ question, onAnswered }: QuizCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [answered, setAnswered] = useState(false);
  const { showFurigana } = useSettingsStore();

  const isJpPrompt = question.direction === 'jp-to-kr';

  function handleAnswer(isCorrect: boolean) {
    if (answered) return;
    setAnswered(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(isCorrect ? 50 : [100, 50, 100]);
    }
    onAnswered(isCorrect, '');
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Question */}
      <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950 p-6 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-400 mb-2">
          {isJpPrompt ? '일본어 → 한국어' : '한국어 → 일본어'}
        </p>
        {isJpPrompt ? (
          <div>
            {showFurigana && question.word.reading && question.word.reading !== question.word.japanese && (
              <p className="break-all text-xs text-indigo-300 mb-1 leading-relaxed">{question.word.reading}</p>
            )}
            <p className="break-all font-bold leading-relaxed text-xl">{question.word.japanese}</p>
          </div>
        ) : (
          <p className="break-words font-bold leading-relaxed text-xl">{question.word.korean}</p>
        )}
      </div>

      {/* Answer reveal area */}
      <div className="relative overflow-hidden rounded-2xl"
        onMouseDown={() => setRevealed(true)}
        onMouseUp={() => setRevealed(false)}
        onMouseLeave={() => setRevealed(false)}
        onTouchStart={(e) => { e.preventDefault(); setRevealed(true); }}
        onTouchEnd={() => setRevealed(false)}
        onTouchCancel={() => setRevealed(false)}
      >
        {/* Actual answer underneath */}
        <div className="border-2 border-muted p-6 text-center min-h-[120px] flex flex-col items-center justify-center">
          {!isJpPrompt ? (
            <div>
              {showFurigana && question.word.reading && question.word.reading !== question.word.japanese && (
                <p className="break-all text-xs text-indigo-400 mb-1 leading-relaxed">{question.word.reading}</p>
              )}
              <p className="break-all font-bold leading-relaxed text-xl">{question.word.japanese}</p>
            </div>
          ) : (
            <p className="break-words font-bold leading-relaxed text-xl">{question.word.korean}</p>
          )}
        </div>

        {/* Sticky note overlay */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center cursor-pointer select-none',
            'bg-amber-100',
            'shadow-[3px_5px_16px_rgba(0,0,0,0.18)]',
            'transition-all duration-200 ease-out',
            revealed
              ? 'opacity-0 scale-[0.94] pointer-events-none'
              : 'opacity-100 scale-100'
          )}
        >
          {/* Tape strip at top */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-6 rounded-sm bg-amber-200/80 shadow-sm border border-amber-300/40" />

          {/* Subtle ruled lines */}
          <div className="absolute inset-x-8 top-10 bottom-8 flex flex-col justify-around pointer-events-none">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-px bg-amber-300/50" />
            ))}
          </div>

          {/* Content */}
          <span className="text-3xl mb-2 z-10">🤫</span>
          <p className="text-sm font-semibold text-amber-900 z-10">
            꾹 눌러서 정답 확인
          </p>
          <p className="text-[11px] text-amber-600 mt-1 z-10 tracking-wide">
            hold to reveal
          </p>

          {/* Folded corner */}
          <div className="absolute bottom-0 right-0 w-6 h-6 overflow-hidden">
            <div className="absolute bottom-0 right-0 w-0 h-0
              border-l-[24px] border-l-transparent
              border-b-[24px] border-b-amber-200
              drop-shadow-sm" />
          </div>
        </div>
      </div>

      {/* 몰라요 / 알아요 */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="h-14 rounded-xl text-base font-medium bg-red-500 hover:bg-red-600 text-white"
          onClick={() => handleAnswer(false)}
          disabled={answered}
        >
          <XCircle className="mr-2 h-5 w-5" />
          몰라요
        </Button>
        <Button
          className="h-14 rounded-xl text-base font-medium bg-green-600 hover:bg-green-700 text-white"
          onClick={() => handleAnswer(true)}
          disabled={answered}
        >
          <CheckCircle className="mr-2 h-5 w-5" />
          알아요
        </Button>
      </div>
    </div>
  );
}
