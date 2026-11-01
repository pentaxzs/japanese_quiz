'use client';

import { Plus } from 'lucide-react';

interface NewDeckCardProps {
  onClick: () => void;
}

/**
 * 아직 아무것도 쓰지 않은 단어장.
 *
 * 만들려는 것이 단어장이니 그 입구도 단어장처럼 생기는 게 맞다.
 * 덱 카드와 같은 가족이되 비어 있고(겹친 종이 없음) 테두리가 점선이다.
 * 목록 맨 위에 두어 단어장이 늘어나도 자리가 변하지 않게 한다.
 */
export function NewDeckCard({ onClick }: NewDeckCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border-[1.5px] border-dashed border-mark/55 bg-mark/[0.04] p-4 text-left transition-colors hover:bg-mark/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mark/15 text-mark"
      >
        <Plus className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="handwritten block text-[1.1875rem] leading-tight">
          새 단어장 만들기
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          사진이나 PDF에서 단어를 뽑아옵니다
        </span>
      </span>
    </button>
  );
}
