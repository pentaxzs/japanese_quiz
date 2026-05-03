import { NextRequest, NextResponse } from 'next/server';
import { checkAnswer } from '@/lib/claude';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { expected, userAnswer, lang } = await req.json();
    const apiKey = req.headers.get('x-api-key') || undefined;

    if (!expected || !userAnswer) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const result = await checkAnswer(expected, userAnswer, lang ?? 'ja', apiKey);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[check-answer]', err);
    return NextResponse.json({ error: '평가 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
