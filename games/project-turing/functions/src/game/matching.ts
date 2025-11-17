/**
 * matchPlayers - 5명 매칭 시 게임 룸 생성
 * RTDB Trigger: /lobby/waitingPlayers 업데이트 시
 */

import { onValueUpdated } from 'firebase-functions/v2/database'
import * as admin from 'firebase-admin'

export const matchPlayers = onValueUpdated(
  { ref: '/lobby/waitingPlayers' },
  async (event) => {
    const players = event.data.after.val()

    // 5명 미만이면 대기
    if (!players || Object.keys(players).length < 5) {
      return null
    }

    console.log('5명 매칭 완료, 게임 룸 생성 시작')

    // 5명 플레이어 추출
    const playerList = Object.entries(players).slice(0, 5)

    // 게임 룸 ID 생성
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 익명 ID 할당 (player_1 ~ player_6)
    const anonymousIds = ['player_1', 'player_2', 'player_3', 'player_4', 'player_5', 'player_6']
    const shuffledIds = shuffle(anonymousIds)

    // AI는 6번째 플레이어
    const aiPlayerId = shuffledIds[5]

    // 게임 룸 생성
    const gameRoomData: any = {
      roomId,
      status: 'waiting',
      difficulty: 'normal',
      currentTurn: 1,
      maxTurns: 5,
      aiPlayerId,
      startTime: null,
      endTime: null,
      players: {},
      turns: {},
    }

    // 플레이어 데이터 추가
    playerList.forEach(([uid, player]: [string, any], index) => {
      gameRoomData.players[uid] = {
        name: player.name,
        email: player.email,
        photoURL: player.photoURL,
        ready: false,
        anonymousId: shuffledIds[index],
      }
    })

    // RTDB에 게임 룸 저장
    await admin.database().ref(`/gameRooms/${roomId}`).set(gameRoomData)

    // 대기실에서 플레이어 제거
    const updates: Record<string, null> = {}
    playerList.forEach(([uid]) => {
      updates[`/lobby/waitingPlayers/${uid}`] = null
    })
    await admin.database().ref().update(updates)

    console.log('게임 룸 생성 완료', { roomId, aiPlayerId })

    return null
  }
)

/**
 * 배열 셔플 유틸리티
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
