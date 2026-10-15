import Anthropic from '@anthropic-ai/sdk';
import type { ExtractionResult, QuizLanguage } from '@/lib/types';

function getClient(apiKey?: string) {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('API 키가 설정되지 않았습니다. 설정 페이지에서 Anthropic API 키를 입력해주세요.');
  return new Anthropic({ apiKey: key });
}

const EXTRACTION_PROMPT = `다음 이미지에서 일본어-한국어 학습 콘텐츠를 추출해주세요.
JSON 형식으로만 응답하되, 다음 구조를 따라주세요:

{
  "words": [
    { "japanese": "勉強", "reading": "べんきょう", "korean": "공부" }
  ],
  "sentences": [
    { "japanese": "私は日本語を勉強します。", "reading": "わたしはにほんごをべんきょうします。", "korean": "저는 일본어를 공부합니다." }
  ]
}

규칙:
- 단어와 문장을 구분해주세요 (조사/구두점이 있으면 문장)
- 이미지에 일본어가 있으면 그대로 japanese 필드에 넣고, 한국어 번역을 korean 필드에 넣어주세요
- 이미지에 한국어만 있으면 한국어를 korean 필드에 넣고, 그 한국어를 자연스러운 일본어로 번역하여 japanese 필드에 넣어주세요
- 이미지에 한국어와 일본어가 모두 있으면 각각 대응하는 쌍으로 매핑해주세요
- japanese 필드에는 반드시 실제 일본어(히라가나/가타카나/한자)가 들어가야 합니다. 한국어를 japanese 필드에 넣으면 절대 안 됩니다
- korean 필드에는 반드시 실제 한국어가 들어가야 합니다. 일본어를 korean 필드에 넣으면 절대 안 됩니다
- 한자가 있는 경우 reading 필드에 히라가나 발음을 넣어주세요
- 한자가 없는 경우 reading은 japanese와 동일하게 처리
- JSON 외 다른 텍스트는 출력하지 마세요`;

const ENGLISH_EXTRACTION_PROMPT = `다음 이미지에서 영어-한국어 학습 콘텐츠를 추출해주세요.
JSON 형식으로만 응답하되, 다음 구조를 따라주세요:

{
  "words": [
    { "japanese": "study", "reading": "study", "korean": "공부" }
  ],
  "sentences": [
    { "japanese": "I couldn't clean my room because a friend suddenly came over.", "reading": "I couldn't clean my room because a friend suddenly came over.", "korean": "갑자기 친구가 와서 방 청소를 할 시간이 없었어요." }
  ]
}

규칙:
- japanese 필드에는 영어 텍스트를 넣어주세요 (필드명이 japanese이지만 영어를 넣습니다)
- reading 필드는 japanese와 동일하게 설정하세요
- korean 필드에는 한국어 번역을 넣어주세요
- 이미지에 영어가 있으면 그대로 사용하고, 한국어만 있으면 한국어를 korean에 넣고 영어 번역을 japanese에 넣어주세요
- 이미지에 영어와 한국어가 모두 있으면 대응하는 쌍으로 매핑해주세요
- 단어와 문장을 구분해주세요 (2단어 이상이거나 구두점이 있으면 문장)
- JSON 외 다른 텍스트는 출력하지 마세요`;

export async function extractFromImage(
  imageBase64: string,
  mimeType: string,
  apiKey?: string,
  language: QuizLanguage = 'japanese'
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
          { type: 'text', text: language === 'english' ? ENGLISH_EXTRACTION_PROMPT : EXTRACTION_PROMPT },
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
