'use client';

import { useRouter } from 'next/navigation';
import { Trophy, RotateCcw, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { QuizSession } from '@/lib/types';
import { calculateScore } from '@/lib/quiz-engine';

interface QuizResultProps {
  session: QuizSession;
  onRetry: () => void;
  onWrongOnly: () => void;
}

export function QuizResult({ session, onRetry, onWrongOnly }: QuizResultProps) {
  const router = useRouter();
  const score = calculateScore(session);
  const correct = session.answers.filter((a) => a.isCorrect).length;
  const wrong = session.answers.length - correct;

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-2 pt-4">
        <Trophy
          className={
            score >= 80 ? 'h-16 w-16 text-yellow-500' : 'h-16 w-16 text-muted-foreground'
          }
        />
        <p className="text-5xl font-bold text-indigo-600">{score}점</p>
        <p className="text-muted-foreground">
          {correct}개 정답 / {wrong}개 오답
        </p>
      </div>

      {/* Wrong answers */}
      {wrong > 0 && (
        <div className="text-left">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">틀린 문제</h3>
          <div className="space-y-1">
            {session.answers
              .filter((a) => !a.isCorrect)
              .map((a, i) => {
                const q = session.questions.find((q) => q.word.id === a.wordId);
                if (!q) return null;
                return (
                  <Card key={i} className="px-3 py-2">
                    <p className="text-sm font-medium">{q.word.japanese}</p>
                    <p className="text-xs text-muted-foreground">{q.word.korean}</p>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 h-12" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" />
          다시 풀기
        </Button>
        {wrong > 0 && (
          <Button variant="outline" className="w-full gap-2 h-12" onClick={onWrongOnly}>
            <BookOpen className="h-4 w-4" />
            오답만 풀기
          </Button>
        )}
        <Button variant="ghost" className="w-full h-12" onClick={() => router.push('/')}>
          홈으로
        </Button>
      </div>
    </div>
  );
}
