import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

/**
 * AI 답변 생성 호출 (Cloud Function)
 */
export async function generateAIAnswer(roomId: string, turn: number): Promise<void> {
  const generateAIResponse = httpsCallable(functions, 'generateAIResponse')

  try {
    const result = await generateAIResponse({ roomId, turn })
    console.log('[generateAIAnswer] AI 답변 생성 완료:', result.data)
  } catch (error) {
    console.error('[generateAIAnswer] AI 답변 생성 실패:', error)
    throw error
  }
}

/**
 * 투표 결과 집계 호출 (Cloud Function)
 */
export async function checkVoteResult(
  roomId: string,
  turn: number
): Promise<{ isAI: boolean; gameEnded: boolean; mostVotedPlayer: string }> {
  const checkVoteResultFn = httpsCallable(functions, 'checkVoteResult')

  try {
    const result = await checkVoteResultFn({ roomId, turn })
    console.log('[checkVoteResult] 투표 집계 완료:', result.data)
    return result.data as { isAI: boolean; gameEnded: boolean; mostVotedPlayer: string }
  } catch (error) {
    console.error('[checkVoteResult] 투표 집계 실패:', error)
    throw error
  }
}
