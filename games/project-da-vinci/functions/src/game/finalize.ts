/**
 * Finalize Game Database Trigger
 * 게임 종료 시 자동으로 게임 로그 저장
 */

import { onValueUpdated } from 'firebase-functions/v2/database'
import { getDatabase } from 'firebase-admin/database'
import { logger } from 'firebase-functions'

/**
 * 게임 종료 시 게임 로그 저장 Trigger
 */
export const finalizeGame = onValueUpdated(
  {
    ref: '/gameRooms/{roomId}/status',
    region: 'asia-northeast3',
  },
  async (event) => {
    const newStatus = event.data.after.val()
    const roomId = event.params.roomId as string

    // 게임이 종료되지 않았으면 무시
    if (newStatus !== 'finished') {
      logger.info(`[finalizeGame] 게임이 아직 진행 중: ${roomId}`)
      return
    }

    logger.info(`[finalizeGame] 게임 종료 감지: ${roomId}`)

    const db = getDatabase()

    try {
      // 1. 게임 룸 데이터 가져오기
      const roomSnapshot = await db.ref(`/gameRooms/${roomId}`).once('value')
      if (!roomSnapshot.exists()) {
        logger.error(`[finalizeGame] 게임 룸을 찾을 수 없음: ${roomId}`)
        return
      }

      const gameRoom = roomSnapshot.val()

      // 이미 로그가 저장되었는지 확인
      const existingLogSnapshot = await db.ref(`/gameLogs/${roomId}`).once('value')
      if (existingLogSnapshot.exists()) {
        logger.warn(`[finalizeGame] 이미 로그가 저장됨: ${roomId}`)
        return
      }

      // 2. 정답 단어 가져오기
      let targetWord = gameRoom.targetWordReveal || '비공개'
      if (!gameRoom.targetWordReveal) {
        // targetWordReveal이 없으면 roomSecrets에서 가져오기
        const secretSnapshot = await db.ref(`/roomSecrets/${roomId}/targetWord`).once('value')
        if (secretSnapshot.exists()) {
          targetWord = secretSnapshot.val()
        }
      }

      // 3. 게임 로그 생성
      const gameLog = {
        logId: roomId,
        roomId,
        theme: gameRoom.theme || '알 수 없음',
        targetWord,
        finalTurnCount: gameRoom.turnCount || 0,
        finalTime: gameRoom.endTime
          ? gameRoom.endTime - gameRoom.startTime
          : 0,
        result: gameRoom.result || 'unknown', // 'success' | 'failure' | 'unknown'
        failReason: gameRoom.failReason || null,
        lastGuess: gameRoom.lastGuess || null,
        aiGuessList: gameRoom.aiGuesses || [],
        players: gameRoom.players || {},
        completedAt: Date.now(),
      }

      // 4. 게임 로그 저장
      await db.ref(`/gameLogs/${roomId}`).set(gameLog)

      logger.info(`[finalizeGame] ✅ 게임 로그 저장 완료: ${roomId}`, {
        theme: gameLog.theme,
        targetWord: gameLog.targetWord,
        result: gameLog.result,
        turnCount: gameLog.finalTurnCount,
        aiGuessCount: gameLog.aiGuessList.length,
      })

      // 5. (선택) roomSecrets 삭제 (보안)
      await db.ref(`/roomSecrets/${roomId}`).remove()
      logger.info(`[finalizeGame] roomSecrets 삭제 완료: ${roomId}`)
    } catch (error) {
      logger.error(`[finalizeGame] 게임 로그 저장 실패: ${roomId}`, error)
    }
  }
)
