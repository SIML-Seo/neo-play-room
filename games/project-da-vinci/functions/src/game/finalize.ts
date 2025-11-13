/**
 * Finalize Game Database Trigger
 * 게임 종료 시 자동으로 Firestore에 게임 로그 저장 및 분석 데이터 집계
 */

import { onValueUpdated } from 'firebase-functions/v2/database'
import { getDatabase } from 'firebase-admin/database'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'

/**
 * 게임 종료 처리 로직 (공통 함수)
 */
export async function processGameFinalization(roomId: string): Promise<void> {
  logger.info(`[finalizeGame] 게임 종료 처리 시작: ${roomId}`)

  const db = getDatabase()
  const firestore = getFirestore()

  try {
      // 1. 게임 룸 데이터 가져오기
      const roomSnapshot = await db.ref(`/gameRooms/${roomId}`).once('value')
      if (!roomSnapshot.exists()) {
        logger.error(`[finalizeGame] 게임 룸을 찾을 수 없음: ${roomId}`)
        return
      }

      const gameRoom = roomSnapshot.val()

      // 이미 로그가 저장되었는지 확인 (Firestore)
      const existingLogRef = firestore.collection('gameLogs').doc(roomId)
      const existingLog = await existingLogRef.get()
      if (existingLog.exists) {
        logger.warn(`[finalizeGame] 이미 로그가 저장됨: ${roomId}`)
        return
      }

      // 2. 정답 단어 가져오기
      let targetWord = gameRoom.targetWordReveal || '비공개'
      if (!gameRoom.targetWordReveal) {
        const secretSnapshot = await db.ref(`/roomSecrets/${roomId}/targetWord`).once('value')
        if (secretSnapshot.exists()) {
          targetWord = secretSnapshot.val()
        }
      }

      // 3. Firestore에 게임 로그 저장
      const gameLog = {
        roomId,
        theme: gameRoom.theme || '알 수 없음',
        difficulty: gameRoom.difficulty || 'normal',
        targetWord,
        finalTurnCount: gameRoom.turnCount || 0,
        finalTime: gameRoom.endTime ? gameRoom.endTime - gameRoom.startTime : 0,
        result: gameRoom.result || 'failure',
        failReason: gameRoom.failReason || null,
        lastGuess: gameRoom.lastGuess || null,
        aiGuessList: gameRoom.aiGuesses || [],
        players: gameRoom.players || {},
        completedAt: Date.now(),
        finishedAt: FieldValue.serverTimestamp(),
      }

      await existingLogRef.set(gameLog)
      logger.info(`[finalizeGame] ✅ Firestore 게임 로그 저장 완료: ${roomId}`)

      // 4. 일별 집계 업데이트 (Atomic Increment)
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const dailyRef = firestore.collection('analytics').doc(`daily_${today}`)

      await dailyRef.set(
        {
          date: today,
          totalGames: FieldValue.increment(1),
          successCount:
            gameRoom.result === 'success' ? FieldValue.increment(1) : FieldValue.increment(0),
          failureCount:
            gameRoom.result === 'failure' ? FieldValue.increment(1) : FieldValue.increment(0),
          totalTurns: FieldValue.increment(gameRoom.turnCount || 0),
          totalTime: FieldValue.increment(gameLog.finalTime),
        },
        { merge: true }
      )
      logger.info(`[finalizeGame] ✅ 일별 집계 업데이트 완료: ${today}`)

      // 5. 단어별 통계 업데이트
      const wordRef = firestore.collection('analytics').doc(`word_${targetWord}`)

      // AI 추측 평균 신뢰도 계산
      const avgConfidence =
        gameRoom.aiGuesses && gameRoom.aiGuesses.length > 0
          ? gameRoom.aiGuesses.reduce(
              (sum: number, guess: any) => sum + (guess.confidence || 0),
              0
            ) / gameRoom.aiGuesses.length
          : 0

      await wordRef.set(
        {
          word: targetWord,
          difficulty: gameRoom.difficulty || 'normal',
          attempts: FieldValue.increment(1),
          successCount:
            gameRoom.result === 'success' ? FieldValue.increment(1) : FieldValue.increment(0),
          totalTurns: FieldValue.increment(gameRoom.turnCount || 0),
          totalConfidence: FieldValue.increment(avgConfidence),
        },
        { merge: true }
      )
      logger.info(`[finalizeGame] ✅ 단어별 통계 업데이트 완료: ${targetWord}`)

      // 6. RTDB에서 게임 룸 및 관련 데이터 삭제 (비용 절감)
      await Promise.all([
        db.ref(`/gameRooms/${roomId}`).remove(),
        db.ref(`/roomSecrets/${roomId}`).remove(),
        db.ref(`/liveDrawings/${roomId}`).remove(),
        db.ref(`/chatMessages/${roomId}`).remove(),
      ])
      logger.info(`[finalizeGame] ✅ RTDB 데이터 정리 완료: ${roomId}`)
  } catch (error) {
    logger.error(`[finalizeGame] 게임 로그 저장 실패: ${roomId}`, error)
    throw error
  }
}

/**
 * 게임 종료 시 게임 로그 저장 Trigger (Database Trigger)
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

    logger.info(`[finalizeGame] 게임 종료 감지 (Trigger): ${roomId}`)
    await processGameFinalization(roomId)
  }
)
