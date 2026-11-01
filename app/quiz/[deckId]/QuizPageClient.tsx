'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizCard } from '@/components/quiz/QuizCard';
import { QuizResult } from '@/components/quiz/QuizResult';
import { QuizHeader } from '@/components/quiz/QuizHeader';
import { useQuizStore } from '@/store/quiz-store';
import { useWrongNoteStore } from '@/store/wrong-note-store';
import { useSettingsStore } from '@/store/settings-store';
import { storage } from '@/lib/storage';
import { generateQuizQuestions, createQuizSession } from '@/lib/quiz-engine';
import { AddWordDialog } from '@/components/deck/AddWordDialog';
import type { Word, QuizLanguage } from '@/lib/types';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  deckId: string;
}

type Mode = 'select' | 'quiz' | 'result';

export function QuizPageClient({ deckId }: Props) {
  const router = useRouter();
  const { session, setSession, clearSession, submitAnswer, nextQuestion } = useQuizStore();
  const { addWrongNote, updateWrongNote, removeWrongNote } = useWrongNoteStore();
  const { quizDirection, showFurigana } = useSettingsStore();
  const [mode, setMode] = useState<Mode>('select');
  const [words, setWords] = useState<Word[]>([]);
  const [deckName, setDeckName] = useState('');
  const [deckLanguage, setDeckLanguage] = useState<QuizLanguage>('japanese');
  const [quizMode, setQuizMode] = useState<'words' | 'sentences' | 'mixed'>('mixed');

  useEffect(() => {
    async function load() {
      const [deck, ws] = await Promise.all([
        storage.getDeck(deckId),
        storage.getWordsByDeckId(deckId),
      ]);
      if (deck) {
        setDeckName(deck.name);
        setDeckLanguage(deck.language ?? 'japanese');
      }
      setWords(ws);
    }
    load();
  }, [deckId]);

  function startQuiz(selectedWords: Word[]) {
    const questions = generateQuizQuestions(selectedWords, quizMode, quizDirection);
    if (questions.length === 0) return;
    const newSession = createQuizSession([deckId], questions, quizMode);
    setSession(newSession);
    setMode('quiz');
  }

  async function handleAnswered(isCorrect: boolean, userAnswer: string) {
    if (!session) return;
    const q = session.questions[session.currentIndex];

    submitAnswer(q.word.id, isCorrect, userAnswer);

    // Update wrong notes
    const wrongNotes = await storage.getWrongNotes();
    const existing = wrongNotes.find((n) => n.wordId === q.word.id);

    if (!isCorrect) {
      if (existing) {
        const updated = { ...existing, wrongCount: existing.wrongCount + 1, lastAttempt: Date.now(), consecutiveCorrect: 0 };
        await storage.updateWrongNote(q.word.id, updated);
        updateWrongNote(q.word.id, updated);
      } else {
        const note = { wordId: q.word.id, deckId, wrongCount: 1, lastAttempt: Date.now(), consecutiveCorrect: 0 };
        await storage.addWrongNote(note);
        addWrongNote(note);
      }
    } else if (existing) {
      const newConsecutive = existing.consecutiveCorrect + 1;
      if (newConsecutive >= 3) {
        await storage.removeWrongNote(q.word.id);
        removeWrongNote(q.word.id);
      } else {
        await storage.updateWrongNote(q.word.id, { consecutiveCorrect: newConsecutive });
        updateWrongNote(q.word.id, { consecutiveCorrect: newConsecutive });
      }
    }

    // Update word stats
    const word = words.find((w) => w.id === q.word.id);
    if (word) {
      await storage.updateWordStats(q.word.id, {
        attempts: word.stats.attempts + 1,
        correct: word.stats.correct + (isCorrect ? 1 : 0),
        lastAttempt: Date.now(),
        consecutiveCorrect: isCorrect ? word.stats.consecutiveCorrect + 1 : 0,
      });
    }

    const isLast = session.currentIndex >= session.questions.length - 1;
    if (isLast) {
      setMode('result');
    } else {
      nextQuestion();
    }
  }

  function handleRetry() {
    clearSession();
    startQuiz(words);
  }

  function handleWrongOnly() {
    clearSession();
    storage.getWrongNotes().then((notes) => {
      const wrongWordIds = new Set(notes.map((n) => n.wordId));
      const wrongWords = words.filter((w) => wrongWordIds.has(w.id));
      startQuiz(wrongWords.length > 0 ? wrongWords : words);
    });
  }

  if (mode === 'result' && session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <QuizResult session={session} onRetry={handleRetry} onWrongOnly={handleWrongOnly} language={deckLanguage} />
      </div>
    );
  }

  if (mode === 'quiz' && session) {
    const current = session.questions[session.currentIndex];
    return (
      // 화면을 채운다. 빈 공간이 아래로 반쯤 남으면 공부하는 글자가 작아 보인다.
      <div className="mx-auto flex min-h-[calc(100dvh-6.5rem)] max-w-lg flex-col px-4 py-5 md:min-h-[calc(100dvh-2.5rem)]">
        <QuizHeader
          questions={session.questions}
          currentIndex={session.currentIndex}
          deckName={deckName}
          language={deckLanguage}
          onBack={() => { clearSession(); setMode('select'); }}
        />
        <QuizCard key={`${current.word.id}-${session.currentIndex}`} question={current} onAnswered={handleAnswered} language={deckLanguage} />
      </div>
    );
  }

  // Mode select
  return (
    <div className="mx-auto max-w-lg px-4 py-6 overflow-x-hidden">
      <div className="mb-6 flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" className="shrink-0" aria-label="홈으로" onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold truncate">{deckName}</h1>
          <p className="text-xs text-muted-foreground">{words.length}개</p>
        </div>
        <AddWordDialog
          deckId={deckId}
          onSaved={(word) => setWords((prev) => [...prev, word])}
          language={deckLanguage}
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">퀴즈 모드 선택</p>
        {(['words', 'sentences', 'mixed'] as const).map((m) => (
          <button
            key={m}
            className={`w-full rounded-xl border p-4 text-left transition-colors ${quizMode === m ? 'border-primary bg-primary/15 text-foreground' : 'border-border hover:border-primary/40'}`}
            onClick={() => setQuizMode(m)}
          >
            <p className="font-medium">
              {m === 'words' ? '단어만' : m === 'sentences' ? '문장만' : '혼합'}
            </p>
            <p className={`text-xs ${quizMode === m ? 'text-foreground/70' : 'text-muted-foreground'}`}>
              {m === 'words' ? '단어 위주 학습' : m === 'sentences' ? '문장 작문 연습' : '단어+문장 랜덤'}
            </p>
          </button>
        ))}

        <Button
          className="mt-4 h-14 w-full text-base"
          onClick={() => startQuiz(words)}
          disabled={words.length === 0}
        >
          퀴즈 시작
        </Button>
      </div>

      {words.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-muted-foreground">단어 목록</p>
          <div className="space-y-1 max-h-60 overflow-y-auto rounded-xl border p-1">
            {words.map((word) => (
              <div key={word.id} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors min-w-0">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{word.japanese}</p>
                  {showFurigana && word.reading && word.reading !== word.japanese && (
                    <p className="truncate text-xs text-muted-foreground">{word.reading}</p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">{word.korean}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                    {word.type === 'word' ? '단어' : '문장'}
                  </span>
                  <button
                    onClick={async () => {
                      await storage.deleteWord(word.id);
                      setWords((prev) => prev.filter((w) => w.id !== word.id));
                      toast.success('단어가 삭제되었습니다.');
                    }}
                    className="-m-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
