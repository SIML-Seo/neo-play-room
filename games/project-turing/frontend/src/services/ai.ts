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
