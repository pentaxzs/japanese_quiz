'use client';

import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizQuestion, QuizLanguage } from '@/lib/types';

interface QuizHeaderProps {
  questions: QuizQuestion[];
  currentIndex: number;
  deckName: string;
  onBack: () => void;
  language?: QuizLanguage;
}

/** 캐러셀에 들어갈 짧은 라벨. 문장은 앞부분만 보여준다. */
function label(q: QuizQuestion) {
  const text = q.word.japanese;
  return text.length > 4 ? `${text.slice(0, 4)}…` : text;
}

export function QuizHeader({ questions, currentIndex, deckName, onBack, language = 'japanese' }: QuizHeaderProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);
  // 영어 덱은 japanese 필드에 영어가 들어 있다. 언어를 잘못 주면 붓글씨가 영어에 붙는다.
  const isEnglishDeck = language === 'english';
  const total = questions.length;
  const position = currentIndex + 1;

  // 현재 문제를 가운데로. 지금 어디쯤인지가 한눈에 보여야 한다.
  useEffect(() => {
    const list = listRef.current;
    const active = activeRef.current;
    if (!list || !active) return;
    const offset = active.offsetLeft - list.clientWidth / 2 + active.clientWidth / 2;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollTo({ left: offset, behavior: reduce ? 'auto' : 'smooth' });
  }, [currentIndex]);

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between px-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="퀴즈 나가기"
          className="-ml-2 rounded-lg p-2 text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/*
          분수는 한 줄에 붙여 둔다. 큰 숫자 아래에 /N 을 따로 떨어뜨리면
          디자인 의도와 무관하게 "줄바꿈이 깨졌다"로 읽힌다.
        */}
        <div className="min-w-0 pl-3 text-right leading-none">
          <p className="whitespace-nowrap text-2xl font-bold tracking-tight tabular-nums">
            <span
              aria-hidden="true"
              className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-mark align-middle"
            />
            {position}
            <span className="text-base font-medium text-muted-foreground">/{total}</span>
          </p>
          <p className="mt-1.5 truncate text-xs text-muted-foreground">{deckName}</p>
        </div>
      </div>

      <div className="relative mt-4">
        <ul
          ref={listRef}
          aria-hidden="true"
          className="flex gap-4 overflow-x-hidden px-4 text-[15px] text-muted-foreground"
        >
          {questions.map((q, i) => (
            <li
              key={`${q.word.id}-${i}`}
              ref={i === currentIndex ? activeRef : null}
              lang={isEnglishDeck ? 'en' : 'ja'}
              className={cn(
                // 붓글씨체는 400 하나뿐이라 font-bold 를 주면 가짜 볼드로 획이 뭉갠다.
                // 현재 단어는 색과 크기로만 구분한다.
                'glyph shrink-0 whitespace-nowrap transition-colors',
                isEnglishDeck ? '' : 'brush',
                i === currentIndex ? 'text-[19px] text-foreground' : 'opacity-70'
              )}
            >
              {label(q)}
            </li>
          ))}
        </ul>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
      </div>

      <p className="sr-only" aria-live="polite">
        {total}문제 중 {position}번째
      </p>
    </div>
  );
}
