'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings-store';
import type { QuizQuestion, QuizLanguage } from '@/lib/types';

interface QuizCardProps {
  question: QuizQuestion;
  onAnswered: (isCorrect: boolean, userAnswer: string) => void;
  language?: QuizLanguage;
}

/** 오답일 때 정답을 보여주는 시간. 학습이 실제로 일어나는 지점이라 건너뛰지 않는다. */
const CORRECTION_MS = 1400;

export function QuizCard({ question, onAnswered, language = 'japanese' }: QuizCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const answeredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { showFurigana, hapticEnabled } = useSettingsStore();

  const { word } = question;
  const isJpPrompt = question.direction === 'jp-to-kr';
  /*
    영어 덱은 japanese 필드에 영어를 넣는다 (lib/claude.ts 의 추출 프롬프트 참고).
    그래서 "일본어 칸"의 실제 언어는 덱 설정에 달려 있다. lang 을 잘못 주면
    줄바꿈 규칙이 영어 단어를 중간에서 끊고, 붓글씨가 영어에 적용된다.
  */
  const isEnglishDeck = language === 'english';
  const studyLang = isEnglishDeck ? 'en' : 'ja';
  /* 붓글씨는 일본어·한국어에만. 영어는 본문 서체를 그대로 쓴다. */
  const studyBrush = isEnglishDeck ? '' : 'brush';
  const isSentence = word.type === 'sentence';
  const hasReading = Boolean(word.reading && word.reading !== word.japanese);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function vibrate(pattern: number | number[]) {
    if (!hapticEnabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
  }

  function handleAnswer(isCorrect: boolean) {
    if (answeredRef.current) return;
    answeredRef.current = true;
    vibrate(isCorrect ? 50 : [100, 50, 100]);

    if (isCorrect) {
      onAnswered(true, '');
      return;
    }
    setRevealed(true);
    setCorrecting(true);
    timerRef.current = setTimeout(() => onAnswered(false, ''), CORRECTION_MS);
  }

  /*
    누르고 있는 동안에만 정답이 보인다. 손을 떼면 다시 가려진다.
    포인터 캡처를 잡아두면 손가락이 영역 밖으로 미끄러져도 뗀 순간을 놓치지 않는다.
    키보드는 Space/Enter 를 누르고 있는 동안 같은 동작을 한다 — 마우스가 없어도
    같은 상호작용에 도달할 수 있어야 한다.
  */
  const show = revealed || correcting;

  function hold(e: React.PointerEvent<HTMLButtonElement>) {
    // 포인터가 이미 사라진 경우 캡처가 던진다. 공개 자체를 막으면 안 된다.
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* 캡처 없이도 동작한다 */
    }
    setRevealed(true);
  }
  function release() {
    setRevealed(false);
  }
  function holdKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (e.repeat) return;
    setRevealed(true);
  }
  function releaseKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    setRevealed(false);
  }

  const promptText = isJpPrompt ? word.japanese : word.korean;
  const answerText = isJpPrompt ? word.korean : word.japanese;
  const showPromptReading = isJpPrompt && showFurigana && hasReading;
  const showAnswerReading = !isJpPrompt && showFurigana && hasReading;

  /* 크기는 "공부 대상이 무엇인가"로 정한다. 일본어가 질문이든 정답이든 크게 둔다. */
  const promptSize = isSentence
    ? 'text-[clamp(1.5rem,6.5vw,2.25rem)] leading-snug'
    : 'text-[clamp(3rem,16vw,5rem)]';
  const answerSize = isSentence
    ? 'text-[clamp(1.0625rem,4.2vw,1.375rem)]'
    : 'text-[clamp(2rem,10vw,3rem)]';

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-1 flex-col rounded-2xl bg-card px-5 pb-5 pt-6">
        {/* 문제 — 6.5 */}
        <div className="flex flex-[6.5] flex-col items-center justify-center py-2">
          <p
            lang={isJpPrompt ? studyLang : 'ko'}
            className={cn('glyph text-center', isJpPrompt ? studyBrush : 'brush', promptSize)}
          >
            {promptText}
          </p>
          {showPromptReading && (
            <p lang={studyLang} className="mt-4 text-center text-sm text-muted-foreground">
              {word.reading}
            </p>
          )}
        </div>

        {/* 정답 — 3.5 */}
        <div className="relative flex flex-[3.5] flex-col justify-center border-t border-border pt-4">
          <div
            aria-hidden={!show}
            className={cn(
              'text-center transition-opacity duration-150',
              show ? 'opacity-100' : 'opacity-0',
              correcting && '-mx-3 rounded-xl bg-mark/10 px-3 py-2'
            )}
          >
            {correcting && (
              <p className="mb-1 text-xs font-bold tracking-wide text-mark">정답</p>
            )}
            {showAnswerReading && (
              <p lang={studyLang} className="mb-0.5 text-sm text-muted-foreground">{word.reading}</p>
            )}
            <p
              lang={isJpPrompt ? 'ko' : studyLang}
              className={cn('glyph', isJpPrompt ? 'brush' : studyBrush, answerSize)}
            >
              {answerText}
            </p>
            <p className="mt-2 text-[11px] tracking-[0.14em] text-muted-foreground">
              {isSentence ? '문장' : '단어'}
              {language === 'english' ? ' · 영어' : ' · 일본어'}
            </p>
          </div>

          {!correcting && (
            <button
              type="button"
              aria-expanded={revealed}
              aria-label="꾹 눌러서 정답 확인"
              onPointerDown={hold}
              onPointerUp={release}
              onPointerCancel={release}
              onKeyDown={holdKey}
              onKeyUp={releaseKey}
              onBlur={release}
              onContextMenu={(e) => e.preventDefault()}
              className={cn(
                'sheet absolute inset-x-0 bottom-0 top-4 flex touch-none select-none',
                'flex-col items-center justify-center rounded-lg bg-mark text-mark-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                revealed && 'sheet--lifted'
              )}
            >
              <span className="text-[clamp(1.0625rem,5vw,1.375rem)] font-bold">
                꾹 눌러 들춰보기
              </span>
              {/* 투명도로 위계를 주면 대비가 깨진다 — 크기와 굵기로만 낮춘다 */}
              <span className="mt-1.5 text-[12px] font-medium tracking-[0.1em]">
                손을 떼면 다시 덮입니다
              </span>
            </button>
          )}

          {/* 누르고 있는 동안에는 화면을 볼 수 없는 사용자를 위해 음성으로 읽어준다 */}
          <p className="sr-only" aria-live="polite">
            {show ? `정답 ${answerText}` : ''}
          </p>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleAnswer(false)}
          disabled={correcting}
          className="h-14 rounded-xl border-2 border-mark text-base font-bold text-foreground transition-colors hover:bg-mark/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
        >
          몰라요
        </button>
        <button
          type="button"
          onClick={() => handleAnswer(true)}
          disabled={correcting}
          className="h-14 rounded-xl bg-primary text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
        >
          알아요
        </button>
      </div>
    </div>
  );
}
