/**
 * AI 단어 생성 Cloud Function
 * Gemini API를 사용하여 주제별 단어 자동 생성
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from 'firebase-functions'

interface GenerateWordsRequest {
  theme: string
  count?: number
}

interface GenerateWordsResponse {
  theme: string
  words: string[]
  count: number
}

/**
 * 단어 생성 프롬프트 작성
 */
function buildWordGenerationPrompt(theme: string, count: number): string {
  return `당신은 Pictionary 게임을 위한 문제 출제자입니다.

**주제**: ${theme}

**요구사항**:
1. "${theme}" 주제에 맞는 그림으로 표현 가능한 단어 ${count}개를 생성하세요.
2. 모든 단어는 **한글**로 작성하세요.
3. 단어는 **명사**여야 합니다 (동사, 형용사 금지).
4. 너무 쉽지도, 너무 어렵지도 않은 적절한 난이도로 선택하세요.
5. 다양성을 고려하여 중복되지 않는 단어들을 선택하세요.
6. 그림으로 표현하기 어려운 추상적인 개념은 피하세요.

**응답 형식** (JSON 배열만):
{
  "words": ["단어1", "단어2", "단어3", ...]
}

**예시**:
주제: "동화"
{
  "words": ["백설공주", "신데렐라", "콩쥐팥쥐", "흥부놀부", "견우직녀", "심청전", "춘향전", "피노키오", "인어공주", "잠자는숲속의공주", "빨간모자", "헨젤과그레텔", "엄지공주", "미운오리새끼", "성냥팔이소녀", "알라딘", "라푼젤", "개구리왕자", "브레멘음악대", "이솝우화"]
}

이제 "${theme}" 주제로 ${count}개의 단어를 생성하세요.`
}

/**
 * AI 응답에서 단어 배열 파싱 (judge.flow.ts 스타일)
 */
function parseWordsFromResponse(responseText: string): string[] {
  try {
    // ```json ... ``` 제거 (judge.flow.ts와 동일한 방식)
    const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleanedText)

    // 다양한 키 허용 (judge.flow.ts 패턴)
    const words = parsed.words || parsed.단어목록 || parsed.단어들 || []

    if (!Array.isArray(words)) {
      throw new Error('words 배열을 찾을 수 없습니다.')
    }

    // 문자열만 필터링
    return words.filter((w: unknown) => typeof w === 'string' && w.trim().length > 0)
  } catch (parseError) {
    logger.warn('JSON 파싱 실패, fallback 시도:', responseText)

    // Fallback: 정규식으로 추출 시도
    const wordsMatch = responseText.match(/"words"\s*:\s*\[([\s\S]*?)\]/)
    if (wordsMatch) {
      const wordsString = wordsMatch[1]
      const words = wordsString
        .split(',')
        .map((w) => w.trim().replace(/^["']|["']$/g, ''))
        .filter((w) => w.length > 0)
      return words
    }

    throw new Error('AI 응답을 파싱할 수 없습니다.')
  }
}

/**
 * 단어 생성 Cloud Function
 */
export const generateWords = onCall<GenerateWordsRequest, Promise<GenerateWordsResponse>>(
  {
    region: 'asia-northeast3',
    timeoutSeconds: 30,
    memory: '512MiB',
    cors: true,
  },
  async (request) => {
    // 인증 확인
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.')
    }

    const { theme, count = 20 } = request.data

    // 입력 검증
    if (!theme || typeof theme !== 'string') {
      throw new HttpsError('invalid-argument', 'theme이 필요합니다.')
    }

    if (count < 5 || count > 50) {
      throw new HttpsError('invalid-argument', 'count는 5~50 사이여야 합니다.')
    }

    // Gemini API 키 확인
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'GEMINI_API_KEY가 설정되지 않았습니다.')
    }

    try {
      // Gemini API 호출 (judge.flow.ts와 동일한 설정)
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
        generationConfig: {
          temperature: 0.8, // 다양성을 위해 약간 높게
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 500,
        },
      })

      const prompt = buildWordGenerationPrompt(theme, count)
      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      logger.info(`[generateWords] Gemini 원본 응답 (${theme}):`, responseText)

      // JSON 파싱
      const words = parseWordsFromResponse(responseText)

      if (words.length === 0) {
        throw new HttpsError('internal', 'AI가 단어를 생성하지 못했습니다.')
      }

      // 한글 검증
      const koreanWords = words.filter((w) => /[가-힣]/.test(w))
      if (koreanWords.length < words.length * 0.8) {
        logger.warn(`[generateWords] 한글이 아닌 단어가 많음: ${words.length - koreanWords.length}개`)
      }

      logger.info(`[generateWords] ${theme}: ${words.length}개 단어 생성 완료`)

      // Firestore에 저장
      const firestore = getFirestore()
      const wordPoolRef = firestore.collection('wordPools').doc(theme)

      await wordPoolRef.set({
        theme,
        words,
        description: `${theme} 주제 (AI 자동 생성)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: request.auth.uid,
      })

      logger.info(`[generateWords] Firestore 저장 완료: wordPools/${theme}`)

      return {
        theme,
        words,
        count: words.length,
      }
    } catch (error: unknown) {
      logger.error('[generateWords] 실패:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpsError('internal', `단어 생성 중 오류 발생: ${errorMessage}`)
    }
  }
)
