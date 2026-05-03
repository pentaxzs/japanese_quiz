import Anthropic from '@anthropic-ai/sdk';
import type { ExtractionResult } from '@/lib/types';

function getClient(apiKey?: string) {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('API 키가 설정되지 않았습니다. 설정 페이지에서 Anthropic API 키를 입력해주세요.');
  return new Anthropic({ apiKey: key });
}

const EXTRACTION_PROMPT = `다음 이미지에서 일본어 학습 콘텐츠를 추출해주세요.
JSON 형식으로만 응답하되, 다음 구조를 따라주세요:

{
  "words": [
    { "japanese": "勉強", "reading": "べんきょう", "korean": "공부" }
  ],
  "sentences": [
    { "japanese": "私は日本語を勉強します。", "reading": "わたしはにほんごをべんきょうします。", "korean": "저는 일본어를 공부합니다。" }
  ]
}

규칙:
- 단어와 문장을 구분해주세요 (조사/구두점이 있으면 문장)
- 한자가 있는 경우 reading 필드에 히라가나 발음을 넣어주세요
- 한자가 없는 경우 reading은 japanese와 동일하게 처리
- 이미지에 없는 내용은 절대 만들어내지 마세요
- JSON 외 다른 텍스트는 출력하지 마세요`;

export async function extractFromImage(
  imageBase64: string,
  mimeType: string,
  apiKey?: string
): Promise<ExtractionResult> {
  const response = await getClient(apiKey).messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: imageBase64,
            },
          },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.');

  const parsed = JSON.parse(jsonMatch[0]) as ExtractionResult;
  return {
    words: parsed.words ?? [],
    sentences: parsed.sentences ?? [],
  };
}

export async function checkAnswer(
  expected: string,
  userAnswer: string,
  lang: 'ja' | 'ko' = 'ja',
  apiKey?: string
): Promise<{ isCorrect: boolean; feedback: string; similarity: number }> {
  const langLabel = lang === 'ja' ? '일본어' : '한국어';
  const response = await getClient(apiKey).messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `다음 ${langLabel} 답안을 평가해주세요. 관대하게 평가하세요.

정답: ${expected}
사용자 답안: ${userAnswer}

JSON으로만 응답해주세요:
{"isCorrect": true/false, "feedback": "피드백 메시지", "similarity": 0.0~1.0}

평가 기준 (모두 정답 처리):
- 의미가 동일하거나 유사하면 정답 (표현 달라도 됨)
- 띄어쓰기, 구두점, 조사 차이 무시
- 동의어/유사 표현 허용 (예: "이야기"="얘기", "없어요"="없습니다", "봐요"="봅니다")
- 축약어/줄임말 허용 (예: "슈퍼"="슈퍼마켓", "지하철"="전철")
- 한자어 동의어 허용 (예: "민폐"="폐", "애인"="연인", "전화"="통화")
- 핵심 동사구가 같으면 정답 (예: "폐를 끼치다"="민폐를 끼치다"="민폐를 주다")
- 일본어: 히라가나/한자/가타카나 혼용 허용, 장음 표기 차이 허용
- 단어/구문의 핵심 의미만 맞으면 정답 (조사/어미 변형 허용)
- 의심스러우면 정답으로 처리 (학습 의욕 유지 우선)`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { isCorrect: false, feedback: '평가 오류', similarity: 0 };

  return JSON.parse(jsonMatch[0]);
}
