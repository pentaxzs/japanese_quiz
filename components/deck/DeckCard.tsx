'use client';

import { cn } from '@/lib/utils';
import type { Deck } from '@/lib/types';

interface DeckCardProps {
  deck: Deck;
  accuracy?: number | null;
  onOpen: () => void;
  /** 카드 오른쪽 동작 버튼. 화면마다 다르다 (홈: 재생+메뉴, 단어장: 재생+삭제) */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * 뒤에 겹쳐 보이는 종이 장수. 단어가 많은 단어장일수록 두꺼워 보인다.
 * 숫자를 읽지 않아도 어느 단어장이 두꺼운지 훑어볼 수 있게 하는 게 목적이다.
 */
function sheetCount(wordCount: number) {
  if (wordCount >= 40) return 2;
  if (wordCount >= 15) return 1;
  return 0;
}

export function DeckCard({ deck, accuracy, onOpen, actions, className }: DeckCardProps) {
  const sheets = sheetCount(deck.wordCount);

  return (
    <div
      className={cn(
        'relative',
        sheets === 2 && 'pb-[9px]',
        sheets === 1 && 'pb-[4px]',
        className
      )}
    >
      {/*
        겹친 종이. bg-muted 를 쓰는 이유: muted 는 라이트에서 card 보다 어둡고
        다크에서는 card 보다 밝다. 그래서 어느 팔레트에서든 카드와 구분된다.
        card 보다 어두운 고정값을 쓰면 다크에서 묻힌다.
      */}
      {sheets >= 2 && (
        <span
          aria-hidden="true"
          className="absolute inset-x-[14px] top-[9px] h-full -rotate-[0.3deg] rounded-lg border border-border bg-muted"
        />
      )}
      {sheets >= 1 && (
        <span
          aria-hidden="true"
          className="absolute inset-x-[7px] top-[4px] h-full rounded-lg border border-border bg-muted"
        />
      )}

      <div className="relative z-10 flex items-center gap-2 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_4px_10px_-8px_rgb(0_0_0/0.35)] transition-colors hover:border-mark/40">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          {/* 사용자가 공책 표지에 쓴 이름이라는 뜻으로 손글씨를 쓴다 */}
          <span className="handwritten block truncate text-[1.3125rem] leading-tight">
            {deck.name}
          </span>
          <span className="mt-1 block text-xs tabular-nums text-muted-foreground">
            {deck.wordCount}개
            {accuracy !== null && accuracy !== undefined && (
              <>
                {' · 정답률 '}
                <b className="font-medium text-foreground">{accuracy}%</b>
              </>
            )}
          </span>
        </button>

        {actions && <div className="flex shrink-0 items-center">{actions}</div>}
      </div>
    </div>
  );
}
