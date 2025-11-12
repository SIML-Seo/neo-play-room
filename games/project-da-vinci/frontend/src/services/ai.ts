import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

interface JudgeRequest {
  roomId: string
  imageBase64: string
}

interface JudgeResponse {
  guess: string
  confidence: number
  isCorrect: boolean
  turnCount: number
  gameStatus: 'in-progress' | 'finished'
}

/**
 * 지연 함수 (재시도 대기용)
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * AI에게 그림 판단 요청 (재시도 로직 포함)
 *
 * @param roomId - 게임 룸 ID
 * @param imageBase64 - Base64로 인코딩된 이미지
 * @param maxRetries - 최대 재시도 횟수 (기본값: 3)
 * @returns AI 판단 결과
 * @throws 모든 재시도 실패 시 마지막 에러
 */
export async function submitDrawingToAI(
  roomId: string,
  imageBase64: string,
  maxRetries: number = 3
): Promise<JudgeResponse> {
  const judgeDrawing = httpsCallable<JudgeRequest, JudgeResponse>(functions, 'judgeDrawing')

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AI] 시도 ${attempt + 1}/${maxRetries + 1}`)

      const result = await judgeDrawing({
        roomId,
        imageBase64,
      })

      console.log('[AI] ✅ 성공:', result.data)
      return result.data
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`[AI] ❌ 시도 ${attempt + 1} 실패:`, lastError.message)

      // 마지막 시도가 아니면 지수 백오프로 대기
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000 // 1초, 2초, 4초...
        console.log(`[AI] 🔄 ${delayMs / 1000}초 후 재시도...`)
        await delay(delayMs)
      }
    }
  }

  // 모든 재시도 실패
  console.error('[AI] 💥 모든 재시도 실패')
  throw new Error(
    `AI 판단에 실패했습니다 (${maxRetries + 1}회 시도). ${lastError?.message || '알 수 없는 오류'}`
  )
}
