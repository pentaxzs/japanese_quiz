import type { Word, QuizQuestion, QuizSession } from '@/lib/types';

export function generateQuizQuestions(
  words: Word[],
  mode: 'words' | 'sentences' | 'mixed',
  direction: 'random' | 'jp-to-kr' | 'kr-to-jp',
  count = 10
): QuizQuestion[] {
  const filtered = words.filter((w) => {
    if (mode === 'words') return w.type === 'word';
    if (mode === 'sentences') return w.type === 'sentence';
    return true;
  });

  const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, count);

  return shuffled.map((word) => {
    let dir: 'jp-to-kr' | 'kr-to-jp';
    if (direction === 'random') {
      dir = Math.random() > 0.5 ? 'jp-to-kr' : 'kr-to-jp';
    } else {
      dir = direction;
    }
    return { word, direction: dir };
  });
}

export function checkWordAnswer(
  word: Word,
  direction: 'jp-to-kr' | 'kr-to-jp',
  userAnswer: string
): boolean {
  const normalize = (s: string) =>
    s.trim().toLowerCase().replace(/\s+/g, '').replace(/[。、！？.,!?]/g, '');

  const answer = normalize(userAnswer);

  if (direction === 'jp-to-kr') {
    return normalize(word.korean) === answer;
  } else {
    // Accept kanji or reading
    return normalize(word.japanese) === answer || normalize(word.reading) === answer;
  }
}

export function createQuizSession(
  deckIds: string[],
  questions: QuizQuestion[],
  mode: QuizSession['mode']
): QuizSession {
  return {
    deckIds,
    questions,
    currentIndex: 0,
    answers: [],
    mode,
  };
}

export function calculateScore(session: QuizSession): number {
  if (session.answers.length === 0) return 0;
  const correct = session.answers.filter((a) => a.isCorrect).length;
  return Math.round((correct / session.answers.length) * 100);
}
