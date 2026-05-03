import { NextRequest, NextResponse } from 'next/server';
import { extractFromImage } from '@/lib/claude';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();
    const apiKey = req.headers.get('x-api-key') || undefined;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: '이미지 데이터가 필요합니다.' }, { status: 400 });
    }

    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validMimeTypes.includes(mimeType)) {
      return NextResponse.json({ error: '지원하지 않는 이미지 형식입니다.' }, { status: 400 });
    }

    const data = await extractFromImage(image, mimeType, apiKey);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[extract]', err);
    const message = err instanceof Error ? err.message : '추출 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
