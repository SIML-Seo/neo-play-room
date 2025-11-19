/**
 * checkVoteResult - 투표 집계 및 게임 상태 업데이트
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getDatabase, ServerValue } from 'firebase-admin/database'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

export const checkVoteResult = onCall(
  {
    region: 'asia-northeast3',
    timeoutSeconds: 30,
    memory: '512MiB',
    cors: true,
  },
  async (request) => {
  // 1. 인증 확인
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.')
  }

  const { roomId, turn } = request.data

  if (!roomId || !turn) {
    throw new HttpsError('invalid-argument', 'roomId와 turn이 필요합니다.')
  }

  try {
    const db = getDatabase()

    // 2. 투표 데이터 가져오기
    const votesSnapshot = await db
      .ref(`/gameRooms/${roomId}/turns/${turn}/votes`)
      .once('value')
    const votes = votesSnapshot.val()

    if (!votes) {
      throw new HttpsError('not-found', '투표 데이터를 찾을 수 없습니다.')
    }

    // 3. 투표 집계
    const voteCount: Record<string, number> = {}
    Object.values(votes).forEach((vote: any) => {
      const votedFor = vote.votedFor
      voteCount[votedFor] = (voteCount[votedFor] || 0) + 1
    })

    // 4. 최다 득표자 찾기 (동점자 포함)
    let mostVotedPlayers: string[] = []
    let maxVotes = 0
    Object.entries(voteCount).forEach(([playerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count
        mostVotedPlayers = [playerId]
      } else if (count === maxVotes) {
        mostVotedPlayers.push(playerId)
      }
    })

    // 5. AI 여부 확인
    const gameRoomSnapshot = await db
      .ref(`/gameRooms/${roomId}`)
      .once('value')
    const gameRoom = gameRoomSnapshot.val()
    const aiPlayerId = gameRoom.aiPlayerId

    // 단일 최다 득표자가 AI인지 확인 (동점이면 AI를 찾지 못한 것)
    const isAI = mostVotedPlayers.length === 1 && mostVotedPlayers[0] === aiPlayerId

    // 6. 게임 종료 여부
    // AI를 찾았거나, 현재 턴이 마지막 턴인 경우
    const gameEnded = isAI || turn >= gameRoom.maxTurns

    // 7. 투표 결과 저장
    await db
      .ref(`/gameRooms/${roomId}/turns/${turn}/voteResult`)
      .set({
        mostVotedPlayers, // 배열로 변경
        voteCount: maxVotes,
        isAI,
        gameEnded,
        timestamp: ServerValue.TIMESTAMP,
      })

    // 8. 게임 상태 업데이트
    if (gameEnded) {
      await db.ref(`/gameRooms/${roomId}`).update({
        status: 'finished',
        endTime: ServerValue.TIMESTAMP,
      })

      // 게임 로그 저장 (Firestore) - 최신 데이터 다시 가져오기
      const finalGameRoomSnapshot = await db.ref(`/gameRooms/${roomId}`).once('value')
      const finalGameRoom = finalGameRoomSnapshot.val()
      await finalizeGame(roomId, finalGameRoom)
    }
    // 다음 턴으로 넘어가는 것은 Frontend의 "다음 턴" 버튼 클릭 시에만 수행

    console.log('투표 결과 집계 완료', { roomId, turn, isAI, gameEnded, mostVotedPlayers })

    return { isAI, gameEnded, mostVotedPlayers }
  } catch (error) {
    console.error('투표 집계 실패:', error)
    throw new HttpsError('internal', '투표 집계에 실패했습니다.')
  }
})

/**
 * 게임 종료 처리 - Firestore에 로그 저장
 */
async function finalizeGame(roomId: string, gameRoom: any) {
  // 점수 계산
  const difficultyMultiplier: Record<string, number> = {
    easy: 1.0,
    normal: 1.3,
    hard: 1.6,
  }

  const finalTurnCount = gameRoom.currentTurn
  const finalTime = Date.now() - gameRoom.startTime
  const score = (finalTurnCount / difficultyMultiplier[gameRoom.difficulty]) * 1000 + finalTime / 1000

  // 턴 히스토리 정리 (voteResult가 있는 턴만 포함)
  const turnsHistory = Object.entries(gameRoom.turns || {})
    .filter(([_, turn]: [string, any]) => turn.voteResult !== undefined)
    .map(([turnNum, turn]: [string, any]) => ({
      turn: parseInt(turnNum),
      question: turn.question,
      answers: turn.answers,
      voteResult: turn.voteResult,
    }))

  // 게임 로그 생성
  const gameLog = {
    roomId,
    difficulty: gameRoom.difficulty,
    finalTurnCount,
    finalTime,
    result: gameRoom.turns[finalTurnCount]?.voteResult?.isAI ? 'success' : 'failure',
    aiPlayerId: gameRoom.aiPlayerId,
    score,
    turnsHistory,
    completedAt: Date.now(),
    finishedAt: FieldValue.serverTimestamp(),
  }

  // Firestore에 저장
  const firestore = getFirestore()
  await firestore.collection('gameLogs').add(gameLog)

  console.log('게임 로그 저장 완료', { roomId, score })
}
