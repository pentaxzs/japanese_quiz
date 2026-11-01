'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings-store';
import type { QuizSession, QuizLanguage } from '@/lib/types';
import { calculateScore } from '@/lib/quiz-engine';

interface QuizResultProps {
  session: QuizSession;
  onRetry: () => void;
  onWrongOnly: () => void;
  language?: QuizLanguage;
}

/** 점수를 0에서 끌어올린다. 한 세션의 끝이자 가장 기억에 남는 화면이다. */
function useCountUp(target: number, ms = 700) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    // 상태 변경은 전부 rAF 콜백 안에서 한다. 이펙트 본문에서 동기로 부르면
    // 연쇄 렌더가 생긴다.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (reduce) {
        setValue(target);
        return;
      }
      const t = Math.min((now - start) / ms, 1);
      // 빠르게 올라갔다 느리게 멎는다
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ms]);

  return value;
}

export function QuizResult({ session, onRetry, onWrongOnly, language = 'japanese' }: QuizResultProps) {
  const router = useRouter();
  const { showFurigana } = useSettingsStore();
  const score = calculateScore(session);
  const shown = useCountUp(score);
  const correct = session.answers.filter((a) => a.isCorrect).length;
  const wrong = session.answers.length - correct;

  /* 영어 덱은 japanese 필드에 영어가 들어 있다 */
  const isEnglishDeck = language === 'english';
  const studyLang = isEnglishDeck ? 'en' : 'ja';

  return (
    <div className="space-y-6">
      <div className="pt-6 text-center">
        <p className="text-[clamp(3.5rem,18vw,5rem)] font-bold leading-none tabular-nums">
          {shown}
          <span className="ml-1 text-2xl font-medium text-muted-foreground">점</span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {session.answers.length}문제 중 <b className="font-medium text-foreground">{correct}개</b>를 맞혔어요
        </p>
      </div>

      {wrong > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            다시 볼 단어 {wrong}개
          </h3>
          <div className="space-y-2">
            {session.answers
              .filter((a) => !a.isCorrect)
              .map((a, i) => {
                const q = session.questions.find((q) => q.word.id === a.wordId);
                if (!q) return null;
                const { word } = q;
                const hasReading = Boolean(word.reading && word.reading !== word.japanese);
                return (
                  <div key={`${word.id}-${i}`} className="rounded-xl border border-border bg-card px-3.5 py-3">
                    {/* 틀린 단어다. 읽는 법이 가장 필요한 정보인데 빠져 있었다. */}
                    {showFurigana && hasReading && (
                      <p lang={studyLang} className="text-xs text-muted-foreground">
                        {word.reading}
                      </p>
                    )}
                    <p
                      lang={studyLang}
                      className={cn('glyph text-lg font-medium', !isEnglishDeck && 'brush')}
                    >
                      {word.japanese}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{word.korean}</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {/* 틀린 게 있으면 그것부터 보는 게 맞다. 아는 것까지 다시 푸는 게 기본일 이유가 없다. */}
        {wrong > 0 ? (
          <>
            <Button className="h-12 w-full gap-2" onClick={onWrongOnly}>
              <BookOpen className="h-4 w-4" />
              틀린 것만 다시
            </Button>
            <Button variant="outline" className="h-12 w-full gap-2" onClick={onRetry}>
              <RotateCcw className="h-4 w-4" />
              처음부터 다시
            </Button>
          </>
        ) : (
          <Button className="h-12 w-full gap-2" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" />
            다시 풀기
          </Button>
        )}
        <Button variant="ghost" className="h-12 w-full" onClick={() => router.push('/')}>
          홈으로
        </Button>
      </div>
    </div>
  );
}
