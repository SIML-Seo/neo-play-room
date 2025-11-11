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
 * AI에게 그림 판단 요청
 */
export async function submitDrawingToAI(
  roomId: string,
  imageBase64: string
): Promise<JudgeResponse> {
  const judgeDrawing = httpsCallable<JudgeRequest, JudgeResponse>(functions, 'judgeDrawing')

  const result = await judgeDrawing({
    roomId,
    imageBase64,
  })

  return result.data
}
