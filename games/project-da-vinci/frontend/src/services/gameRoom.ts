import { ref, onValue, update, get } from 'firebase/database'
import { database } from '@/firebase'
import type { GameRoom, GameDifficulty } from '@/types/game.types'
import { getDifficultyConfig } from '@/utils/difficulty'

/**
 * 게임 룸 데이터 실시간 구독
 */
export function subscribeToGameRoom(
  roomId: string,
  callback: (room: GameRoom | null) => void
): () => void {
  const roomRef = ref(database, `gameRooms/${roomId}`)

  const unsubscribe = onValue(roomRef, (snapshot) => {
    const data = snapshot.val()
    callback(data)
  })

  return unsubscribe
}

/**
 * 게임 룸 데이터 가져오기
 */
export async function getGameRoom(roomId: string): Promise<GameRoom | null> {
  const roomRef = ref(database, `gameRooms/${roomId}`)
  const snapshot = await get(roomRef)
  return snapshot.val()
}

/**
 * 캔버스 데이터 업데이트
 */
export async function updateCanvasData(roomId: string, canvasData: string): Promise<void> {
  console.log('[gameRoom.ts] updateCanvasData 호출', { roomId, dataLength: canvasData.length })

  try {
    const roomRef = ref(database, `gameRooms/${roomId}`)
    await update(roomRef, {
      canvasData,
      lastUpdated: Date.now(),
    })
    console.log('[gameRoom.ts] Firebase update 성공')
  } catch (error) {
    console.error('[gameRoom.ts] Firebase update 실패:', error)
    throw error
  }
}

/**
 * 다음 턴으로 넘기기
 */
export async function nextTurn(roomId: string): Promise<void> {
  const room = await getGameRoom(roomId)
  if (!room) return

  const nextIndex = (room.currentTurnIndex + 1) % room.turnOrder.length
  const nextUid = room.turnOrder[nextIndex]

  await update(ref(database, `gameRooms/${roomId}`), {
    currentTurn: nextUid,
    currentTurnIndex: nextIndex,
    turnCount: room.turnCount + 1,
    turnStartTime: Date.now(),
    canvasData: '', // 캔버스 초기화
  })
}

/**
 * 플레이어 준비 상태 업데이트
 */
export async function updatePlayerReady(
  roomId: string,
  playerId: string,
  ready: boolean
): Promise<void> {
  await update(ref(database, `gameRooms/${roomId}/players/${playerId}`), {
    ready,
  })
}

/**
 * 난이도 변경 (모든 참가자가 변경 가능)
 */
export async function updateDifficulty(roomId: string, difficulty: GameDifficulty): Promise<void> {
  const difficultyConfig = getDifficultyConfig(difficulty)

  await update(ref(database, `gameRooms/${roomId}`), {
    difficulty,
    maxTurns: difficultyConfig.maxTurns,
    turnTimeLimit: difficultyConfig.turnTimeLimit,
  })
}

/**
 * 게임 시작
 */
export async function startGame(roomId: string): Promise<void> {
  await update(ref(database, `gameRooms/${roomId}`), {
    status: 'in-progress',
    turnStartTime: Date.now(),
    canvasData: '', // 빈 캔버스로 시작
  })
}

/**
 * 게임 종료 (턴 초과 시)
 */
export async function endGameByTurnLimit(roomId: string): Promise<void> {
  await update(ref(database, `gameRooms/${roomId}`), {
    status: 'finished',
    result: 'failed',
    failReason: 'turnLimitExceeded',
    finishedAt: Date.now(),
  })
}

/**
 * 게임 종료
 */
export async function endGame(roomId: string): Promise<void> {
  await update(ref(database, `gameRooms/${roomId}`), {
    status: 'completed',
    endTime: Date.now(),
  })
}
