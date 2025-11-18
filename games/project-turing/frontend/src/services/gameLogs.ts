import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { firestore } from '@/firebase'

export interface GameLog {
  roomId: string
  difficulty: 'easy' | 'normal' | 'hard'
  finalTurnCount: number
  finalTime: number
  result: 'success' | 'failure'
  aiPlayerId: string
  score: number
  turnsHistory: TurnHistory[]
  completedAt: number
}

interface TurnHistory {
  turn: number
  question: string
  answers: Record<string, { text: string; submittedAt: number }>
  voteResult?: {
    mostVotedPlayer: string
    voteCount: number
    isAI: boolean
    gameEnded: boolean
  }
}

/**
 * 특정 게임 룸의 로그 조회
 */
export async function getGameLog(roomId: string): Promise<GameLog | null> {
  try {
    const logsRef = collection(firestore, 'gameLogs')
    const q = query(logsRef, where('roomId', '==', roomId), limit(1))
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      console.warn(`[getGameLog] 게임 로그를 찾을 수 없습니다: ${roomId}`)
      return null
    }
    
    const doc = snapshot.docs[0]
    return doc.data() as GameLog
  } catch (error) {
    console.error('[getGameLog] 게임 로그 조회 실패:', error)
    throw error
  }
}

/**
 * 전체 게임 로그 조회 (리더보드용)
 */
export async function getAllGameLogs(limitCount = 10): Promise<GameLog[]> {
  try {
    const logsRef = collection(firestore, 'gameLogs')
    const q = query(logsRef, orderBy('score', 'desc'), limit(limitCount))
    
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map((doc) => doc.data() as GameLog)
  } catch (error) {
    console.error('[getAllGameLogs] 게임 로그 조회 실패:', error)
    throw error
  }
}
