'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizCard } from '@/components/quiz/QuizCard';
import { QuizResult } from '@/components/quiz/QuizResult';
import { ProgressBar } from '@/components/quiz/ProgressBar';
import { useQuizStore } from '@/store/quiz-store';
import { useWrongNoteStore } from '@/store/wrong-note-store';
import { useSettingsStore } from '@/store/settings-store';
import { storage } from '@/lib/storage';
import { generateQuizQuestions, createQuizSession } from '@/lib/quiz-engine';
import type { Word } from '@/lib/types';

type Mode = 'quiz' | 'result';

export function WrongNotesQuizClient() {
  const router = useRouter();
  const { session, setSession, clearSession, submitAnswer, nextQuestion } = useQuizStore();
  const { addWrongNote, updateWrongNote, removeWrongNote } = useWrongNoteStore();
  const { quizDirection } = useSettingsStore();
  const [mode, setMode] = useState<Mode>('quiz');
  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    async function load() {
      const notes = await storage.getWrongNotes();
      if (notes.length === 0) {
        router.replace('/wrong-notes');
        return;
      }
      const wordIds = notes.map((n) => n.wordId);
      const wrongWords = await storage.getWordsByIds(wordIds);
      setWords(wrongWords);

      const questions = generateQuizQuestions(wrongWords, 'mixed', quizDirection);
      if (questions.length === 0) {
        router.replace('/wrong-notes');
        return;
      }
      const newSession = createQuizSession(
        [...new Set(wrongWords.map((w) => w.deckId))],
        questions,
        'mixed'
      );
      setSession(newSession);
    }
    load();
  }, []);

  async function handleAnswered(isCorrect: boolean, userAnswer: string) {
    if (!session) return;
    const q = session.questions[session.currentIndex];

    submitAnswer(q.word.id, isCorrect, userAnswer);

    const wrongNotes = await storage.getWrongNotes();
    const existing = wrongNotes.find((n) => n.wordId === q.word.id);

    if (!isCorrect) {
      if (existing) {
        const updated = { ...existing, wrongCount: existing.wrongCount + 1, lastAttempt: Date.now(), consecutiveCorrect: 0 };
        await storage.updateWrongNote(q.word.id, updated);
        updateWrongNote(q.word.id, updated);
      } else {
        const note = { wordId: q.word.id, deckId: q.word.deckId, wrongCount: 1, lastAttempt: Date.now(), consecutiveCorrect: 0 };
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
    const questions = generateQuizQuestions(words, 'mixed', quizDirection);
    const newSession = createQuizSession(
      [...new Set(words.map((w) => w.deckId))],
      questions,
      'mixed'
    );
    setSession(newSession);
    setMode('quiz');
  }

  function handleWrongOnly() {
    router.replace('/wrong-notes');
  }

  if (!session) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        로딩 중...
      </div>
    );
  }

  if (mode === 'result') {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <QuizResult session={session} onRetry={handleRetry} onWrongOnly={handleWrongOnly} />
      </div>
    );
  }

  const current = session.questions[session.currentIndex];
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => { clearSession(); router.push('/wrong-notes'); }}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <ProgressBar current={session.currentIndex} total={session.questions.length} />
        </div>
      </div>
      <p className="mb-3 text-center text-xs text-muted-foreground">오답 노트 퀴즈</p>
      <QuizCard
        key={`${current.word.id}-${session.currentIndex}`}
        question={current}
        onAnswered={handleAnswered}
      />
    </div>
  );
}
